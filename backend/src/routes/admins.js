const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate, validateParam } = require("../middleware/validate");
const { trigger } = require("../lib/novu");

const router = Router();

// GET / — list admins (users with role admin or moderator), optional ?search and ?status
router.get("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { search, status, limit = 50, offset = 0 } = req.query;

    let query =
      "SELECT id, clerk_user_id, email, full_name, role, status, account_number, created_at FROM users WHERE role IN ('admin', 'moderator') AND deleted_at IS NULL";
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    params.push(Number(limit));
    query += ` LIMIT $${params.length}`;

    params.push(Number(offset));
    query += ` OFFSET $${params.length}`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
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

// PUT /:id — update admin
router.put("/:id", requireAuth, requireRole("admin"), validateParam("uuid"), validate("updateAdmin"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, full_name, role, status, account_number } = req.validated;

    if (role && !["admin", "moderator"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Role must be 'admin' or 'moderator'" });
    }

    const { rows } = await db.query(
      `UPDATE users
       SET email = COALESCE($1, email),
           full_name = COALESCE($2, full_name),
           role = COALESCE($3, role),
           status = COALESCE($4, status),
           account_number = COALESCE($5, account_number)
       WHERE id = $6 AND role IN ('admin', 'moderator')
       RETURNING id, clerk_user_id, email, full_name, role, status, account_number, created_at`,
      [email, full_name, role, status, account_number, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json(rows[0]);
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
    const fields = ["full_name", "email", "role", "status", "account_number", "password"];
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

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
