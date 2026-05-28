const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, requireRole, attachUser, requireOwnership } = require("../middleware/auth");
const { validate, validateParam } = require("../middleware/validate");
const { parsePagination, paginatedQuery, buildFilters, buildWhere } = require("../lib/query-builder");
const { trigger } = require("../lib/novu");

const router = Router();

const ALLOWED_SORTS = { requested_date: "w.requested_date", amount: "w.amount", status: "w.status" };

// GET / — list withdrawals with role-based filtering
router.get("/", requireAuth, attachUser, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const sort = ALLOWED_SORTS[req.query.sort] || "w.requested_date";
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    let roleFilter = null;
    if (req.user?.role === "provider" || req.user?.role === "patient") {
      roleFilter = { column: "w.user_id", value: req.user.id };
    }

    const { conditions, params, nextIdx } = buildFilters({
      status: req.query.status,
      search: req.query.search,
      searchFields: ["u.full_name", "u.email"],
      roleFilter,
      statusColumn: "w.status",
    });

    const where = buildWhere(conditions);
    const from = `FROM withdrawals w LEFT JOIN users u ON w.user_id = u.id AND u.deleted_at IS NULL ${where}`;
    const cols = `w.*, u.full_name AS user_name, u.email AS user_email`;

    const result = await paginatedQuery(
      db,
      `SELECT ${cols} ${from} ORDER BY ${sort} ${order} LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
      [...params, limit, offset],
      `SELECT COUNT(*) ${from}`,
      params,
      page, limit
    );
    res.json(result);
  } catch (err) { next(err); }
});

// GET /:id — single withdrawal (owner: user_id)
router.get("/:id", requireAuth, validateParam("text"), attachUser, requireOwnership(async (req) => {
  const { rows } = await db.query("SELECT user_id FROM withdrawals WHERE id = $1", [req.params.id]);
  return rows[0]?.user_id;
}), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT w.*, u.full_name AS user_name, u.email AS user_email
       FROM withdrawals w
       LEFT JOIN users u ON w.user_id = u.id
       WHERE w.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Withdrawal not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
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

    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["status_change", "withdrawal", id, req.auth?.userId, JSON.stringify({ status, processed_date })]
    );

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
