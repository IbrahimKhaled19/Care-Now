const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, requireRole, attachUser, requireOwnership } = require("../middleware/auth");
const { validate, validateParam } = require("../middleware/validate");
const { parsePagination, paginatedQuery, buildFilters, buildWhere } = require("../lib/query-builder");

const router = Router();

const ALLOWED_SORTS = { balance: "w.balance", earnings: "w.earnings", status: "w.status" };

// GET / — list wallets with role-based filtering
router.get("/", requireAuth, attachUser, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const sort = ALLOWED_SORTS[req.query.sort] || "w.user_id";
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    let roleFilter = null;
    if (req.user?.role === "provider" || req.user?.role === "patient") {
      roleFilter = { column: "w.user_id", value: req.user.id };
    }

    const { conditions, params, nextIdx } = buildFilters({
      status: req.query.status,
      roleFilter,
      statusColumn: "w.status",
    });

    const where = buildWhere(conditions);
    const from = `FROM wallets w LEFT JOIN users u ON w.user_id = u.id AND u.deleted_at IS NULL ${where}`;
    const cols = `w.*, u.full_name AS user_name, u.email AS user_email, u.role AS user_role`;

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

// GET /:id — get single wallet
router.get("/:id", requireAuth, validateParam("text"), attachUser, requireOwnership(async (req) => {
  const { rows } = await db.query("SELECT user_id FROM wallets WHERE id = $1", [req.params.id]);
  return rows[0]?.user_id;
}), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT w.*, u.full_name AS user_name, u.email AS user_email, u.role AS user_role
       FROM wallets w
       LEFT JOIN users u ON w.user_id = u.id AND u.deleted_at IS NULL
       WHERE w.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST / — create wallet (admin only)
router.post("/", requireAuth, requireRole("admin"), validate("createWallet"), async (req, res, next) => {
  try {
    const { id, user_id, balance, on_hold, earnings, type, status } = req.validated;

    const { rows } = await db.query(
      `INSERT INTO wallets (id, user_id, balance, on_hold, earnings, type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, user_id, balance || 0, on_hold || 0, earnings || 0, type, status || "active"]
    );

    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["create", "wallet", id, req.auth?.userId, JSON.stringify({ user_id, type })]
    );

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /:id — partial update wallet (admin only)
router.patch("/:id", requireAuth, requireRole("admin"), validateParam("text"), validate("patchWallet"), async (req, res, next) => {
  try {
    const data = req.validated;
    const fields = ["balance", "on_hold", "earnings", "type", "status"];
    const setClauses = [];
    const params = [];
    let idx = 1;

    for (const f of fields) {
      if (f in data) {
        setClauses.push(`${f} = $${idx++}`);
        params.push(data[f]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE wallets SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["update", "wallet", req.params.id, req.auth?.userId, JSON.stringify(data)]
    );

    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /:id — soft-delete wallet (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), validateParam("text"), async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      "DELETE FROM wallets WHERE id = $1",
      [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["delete", "wallet", req.params.id, req.auth?.userId, "{}"]
    );

    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
