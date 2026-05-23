const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = Router();

// GET / — list admins (users with role admin or moderator), optional ?search and ?status
router.get("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { search, status, limit = 50, offset = 0 } = req.query;

    let query =
      "SELECT id, clerk_user_id, email, full_name, role, status, account_number, created_at FROM users WHERE role IN ('admin', 'moderator')";
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

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /:id — update admin
router.put("/:id", requireAuth, requireRole("admin"), validate("updateAdmin"), async (req, res, next) => {
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

// DELETE /:id — delete admin
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query(
      "DELETE FROM users WHERE id = $1 AND role IN ('admin', 'moderator')",
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({ message: "Admin deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
