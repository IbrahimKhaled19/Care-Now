const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, requireRole, attachUser, requireOwnership } = require("../middleware/auth");
const { validate, validateParam } = require("../middleware/validate");
const { parsePagination, paginatedQuery, buildFilters, buildWhere } = require("../lib/query-builder");

const router = Router();

const ALLOWED_SORTS = { date: "t.date", amount: "t.amount", status: "t.status", service: "t.service" };

// GET / — list transactions with role-based filtering
router.get("/", requireAuth, attachUser, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const sort = ALLOWED_SORTS[req.query.sort] || "t.date";
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    let roleFilter = null;
    if (req.user?.role === "provider") roleFilter = { column: "t.provider_id", value: req.user.id };
    else if (req.user?.role === "patient") roleFilter = { column: "t.patient_id", value: req.user.id };

    const { conditions, params, nextIdx } = buildFilters({
      status: req.query.status,
      search: req.query.search,
      searchFields: ["p.full_name", "pr.full_name", "t.service"],
      roleFilter,
      statusColumn: "t.status",
    });

    const where = buildWhere(conditions);
    const from = `FROM transactions t LEFT JOIN users p ON t.patient_id = p.id AND p.deleted_at IS NULL LEFT JOIN users pr ON t.provider_id = pr.id AND pr.deleted_at IS NULL ${where}`;
    const cols = `t.*, p.full_name AS patient_name, pr.full_name AS provider_name`;

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

// GET /:id — single transaction (owner: patient or provider)
router.get("/:id", requireAuth, validateParam("text"), attachUser, requireOwnership(async (req) => {
  const { rows } = await db.query(
    "SELECT patient_id, provider_id FROM transactions WHERE id = $1",
    [req.params.id]
  );
  if (!rows[0]) return null;
  if (rows[0].patient_id === req.user.id) return req.user.id;
  if (rows[0].provider_id === req.user.id) return req.user.id;
  return null;
}), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT t.*, p.full_name AS patient_name, pr.full_name AS provider_name
       FROM transactions t
       LEFT JOIN users p ON t.patient_id = p.id
       LEFT JOIN users pr ON t.provider_id = pr.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Transaction not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
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

    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["create", "transaction", id, req.auth?.userId, JSON.stringify({ patient_id, provider_id, service, amount })]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
