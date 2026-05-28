const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate, validateParam } = require("../middleware/validate");
const { parsePagination, paginatedQuery, buildWhere } = require("../lib/query-builder");
const { trigger } = require("../lib/novu");

const router = Router();

const ALLOWED_SORTS = { name: "full_name", role: "role", status: "status", created_at: "created_at" };

// GET / — list admins (users with role admin or moderator), optional ?search and ?status
router.get("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const sort = ALLOWED_SORTS[req.query.sort] || "full_name";
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    const conditions = [`role IN ('admin', 'moderator')`, `deleted_at IS NULL`];
    const params = [];
    let idx = 1;

    if (req.query.status) {
      conditions.push(`status = $${idx++}`);
      params.push(req.query.status);
    }

    if (req.query.search) {
      conditions.push(`(full_name ILIKE $${idx} OR email ILIKE $${idx})`);
      params.push(`%${req.query.search}%`);
      idx++;
    }

    const where = buildWhere(conditions);
    const cols = `id, clerk_user_id, email, full_name, role, status, account_number, created_at`;

    const result = await paginatedQuery(
      db,
      `SELECT ${cols} FROM users ${where} ORDER BY ${sort} ${order} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
      `SELECT COUNT(*) FROM users ${where}`,
      params,
      page, limit
    );
    res.json(result);
  } catch (err) { next(err); }
});

// POST / — create admin (creates user with admin/moderator role)
router.post("/", requireAuth, requireRole("admin"), validate("createAdmin"), async (req, res, next) => {
  try {
    const { email, full_name, role, status, account_number } = req.validated;
    const clerk_user_id = req.validated.clerk_user_id || `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!["admin", "moderator"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Role must be 'admin' or 'moderator'" });
    }

    const { rows } = await db.query(
      `INSERT INTO users (clerk_user_id, email, full_name, role, status, account_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, clerk_user_id, email, full_name, role, status, account_number, created_at`,
      [clerk_user_id, email, full_name, role, status || "active", account_number]
    );

    const admin = rows[0];

    // Notify all existing admins about new team member
    const admins = await db.query(
      "SELECT clerk_user_id FROM users WHERE role = 'admin' AND id != $1",
      [admin.id]
    );
    for (const a of admins.rows) {
      trigger("new-admin-created", a.clerk_user_id, {
        adminName: admin.full_name,
        role: admin.role,
      });
    }

    res.status(201).json(admin);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — soft-delete admin
router.delete("/:id", requireAuth, requireRole("admin"), validateParam("uuid"), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `UPDATE users SET deleted_at = NOW()
       WHERE id = $1 AND role IN ('admin', 'moderator') AND deleted_at IS NULL
       RETURNING id, email, full_name`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Audit log
    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["soft_delete", "user", id, req.auth.userId, JSON.stringify({ type: "admin" })]
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /:id/restore — restore soft-deleted admin
router.post("/:id/restore", requireAuth, requireRole("admin"), validateParam("uuid"), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `UPDATE users SET deleted_at = NULL
       WHERE id = $1 AND role IN ('admin', 'moderator') AND deleted_at IS NOT NULL
       RETURNING id, clerk_user_id, email, full_name, role, status, account_number, created_at`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Admin not found or not deleted" });
    }

    // Audit log
    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["restore", "user", id, req.auth.userId, JSON.stringify({ type: "admin" })]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /:id — partial update admin (admin only, allows null values)
router.patch("/:id", requireAuth, requireRole("admin"), validateParam("uuid"), validate("patchAdmin"), async (req, res, next) => {
  try {
    const data = req.validated;
    const fields = ["full_name", "email", "role", "status", "account_number"];
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
      `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${idx} AND role IN ('admin', 'moderator') RETURNING id, clerk_user_id, email, full_name, role, status, account_number, created_at`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (data.role) {
      await db.query(
        "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
        ["role_change", "user", req.params.id, req.auth?.userId, JSON.stringify({ new_role: data.role })]
      );
    } else {
      await db.query(
        "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
        ["update", "user", req.params.id, req.auth?.userId, JSON.stringify(data)]
      );
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
