const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = Router();

// GET / — list transactions, optional ?status filter
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (status) {
      conditions.push(`t.status = $${paramIdx++}`);
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(Number(limit), Number(offset));

    const { rows } = await db.query(
      `SELECT t.*,
              p.full_name AS patient_name,
              pr.full_name AS provider_name
       FROM transactions t
       LEFT JOIN users p ON t.patient_id = p.id
       LEFT JOIN users pr ON t.provider_id = pr.id
       ${where}
       ORDER BY t.date DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST / — create transaction (admin only)
router.post("/", requireAuth, requireRole("admin"), validate("createTransaction"), async (req, res, next) => {
  try {
    const { id, patient_id, provider_id, service, amount, status, date } =
      req.validated;

    const { rows } = await db.query(
      `INSERT INTO transactions (id, patient_id, provider_id, service, amount, status, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, patient_id, provider_id, service, amount, status || "pending", date]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
