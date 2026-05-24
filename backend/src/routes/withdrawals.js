const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, requireRole, attachUser } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { trigger } = require("../lib/novu");

const router = Router();

// GET / — list withdrawals with role-based filtering
router.get("/", requireAuth, attachUser, async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    // Role-based filtering: providers see only their withdrawals
    if (req.user?.role === "provider") {
      conditions.push(`w.user_id = $${paramIdx++}`);
      params.push(req.user.id);
    }

    if (status) {
      conditions.push(`w.status = $${paramIdx++}`);
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(Number(limit), Number(offset));

    const { rows } = await db.query(
      `SELECT w.*, u.full_name AS user_name, u.email AS user_email
       FROM withdrawals w
       LEFT JOIN users u ON w.user_id = u.id
       ${where}
       ORDER BY w.requested_date DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST / — create withdrawal (admin only)
router.post("/", requireAuth, requireRole("admin"), validate("createWithdrawal"), async (req, res, next) => {
  try {
    const { id, user_id, amount, status, method, requested_date, processed_date } =
      req.validated;

    const { rows } = await db.query(
      `INSERT INTO withdrawals (id, user_id, amount, status, method, requested_date, processed_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, user_id, amount, status || "pending", method, requested_date, processed_date]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /:id — update withdrawal status (admin only)
router.put("/:id", requireAuth, requireRole("admin"), validate("updateWithdrawal"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, processed_date } = req.validated;

    const { rows } = await db.query(
      `UPDATE withdrawals
       SET status = $1, processed_date = $2
       WHERE id = $3
       RETURNING *`,
      [status, processed_date, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    const updated = rows[0];

    // Notify provider about withdrawal status change
    const user = await db.query(
      "SELECT clerk_user_id, full_name FROM users WHERE id = $1",
      [updated.user_id]
    );
    if (user.rows.length > 0) {
      trigger("withdrawal-status", user.rows[0].clerk_user_id, {
        amount: String(updated.amount),
        status: updated.status,
        withdrawalId: updated.id,
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
