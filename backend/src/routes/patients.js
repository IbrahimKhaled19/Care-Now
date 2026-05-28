const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth, requireRole, attachUser, requireOwnership } = require("../middleware/auth");
const { validate, validateParam } = require("../middleware/validate");
const { parsePagination, paginatedQuery, buildFilters, buildWhere } = require("../lib/query-builder");
const { trigger } = require("../lib/novu");

const ALLOWED_SORTS = { name: "u.full_name", date: "p.date_joined", status: "u.status" };

// GET / — list patients with optional filters
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const sort = ALLOWED_SORTS[req.query.sort] || "u.full_name";
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    const { conditions, params, nextIdx } = buildFilters({
      status: req.query.status,
      search: req.query.search,
      searchFields: ["u.full_name", "u.email", "p.location"],
      statusColumn: "u.status",
    });

    // Always exclude soft-deleted
    conditions.unshift("u.deleted_at IS NULL");

    const where = buildWhere(conditions);
    const from = `FROM patients p JOIN users u ON p.id = u.id ${where}`;
    const cols = `u.id, u.full_name AS name, u.email, u.status AS state, p.location, COALESCE(u.avatar_url, p.avatar) AS avatar, p.date_joined AS date`;

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

// GET /:id — single patient (join users + patients)
router.get("/:id", requireAuth, validateParam("uuid"), attachUser, requireOwnership(async (req) => {
  const { rows } = await db.query("SELECT id FROM patients WHERE id = $1", [req.params.id]);
  return rows[0]?.id;
}), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.clerk_user_id, u.email, u.full_name, u.role, u.status,
              u.account_number, u.created_at,
              p.location, COALESCE(u.avatar_url, p.avatar) AS avatar, p.date_joined
       FROM patients p
       JOIN users u ON p.id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /:id/medical — list medical info for a patient (owner or admin)
router.get("/:id/medical", requireAuth, validateParam("uuid"), attachUser, requireOwnership(async (req) => {
  const { rows } = await db.query("SELECT id FROM patients WHERE id = $1", [req.params.id]);
  return rows[0]?.id;
}), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, category, items FROM patient_medical WHERE patient_id = $1 ORDER BY id`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /:id/transactions — list transactions for a patient (owner or admin)
router.get("/:id/transactions", requireAuth, validateParam("uuid"), attachUser, requireOwnership(async (req) => {
  const { rows } = await db.query("SELECT id FROM patients WHERE id = $1", [req.params.id]);
  return rows[0]?.id;
}), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT t.id, u.full_name AS provider_name, t.date, t.service, t.amount, t.status
       FROM transactions t
       LEFT JOIN users u ON t.provider_id = u.id
       WHERE t.patient_id = $1
       ORDER BY t.date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST / — create patient (admin only)
router.post("/", requireAuth, requireRole("admin"), validate("createPatient"), async (req, res, next) => {
  try {
    const {
      email, full_name, account_number,
      location, avatar, date_joined,
    } = req.validated;
    const clerk_user_id = req.validated.clerk_user_id || `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        `INSERT INTO users (clerk_user_id, email, full_name, role, status, account_number)
         VALUES ($1, $2, $3, 'patient', 'active', $4)
         RETURNING *`,
        [clerk_user_id, email, full_name, account_number]
      );
      const user = userResult.rows[0];

      const patientResult = await client.query(
        `INSERT INTO patients (id, location, avatar, date_joined)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user.id, location, avatar, date_joined]
      );

      await client.query("COMMIT");

      // Notify all admins about new patient
      const admins = await db.query(
        "SELECT clerk_user_id FROM users WHERE role = 'admin'"
      );
      for (const a of admins.rows) {
        trigger("patient-registered", a.clerk_user_id, {
          patientName: full_name,
        });
      }

      res.status(201).json({ ...user, ...patientResult.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// PATCH /:id — partial update patient (admin only, allows null values)
router.patch("/:id", requireAuth, requireRole("admin"), validateParam("uuid"), validate("patchPatient"), async (req, res, next) => {
  try {
    const data = req.validated;
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const userFields = ["full_name", "email", "status", "account_number"];
      const userSet = [];
      const userParams = [];
      let idx = 1;
      for (const f of userFields) {
        if (f in data) {
          userSet.push(`${f} = $${idx++}`);
          userParams.push(data[f]);
        }
      }
      userParams.push(req.params.id);

      let userResult;
      if (userSet.length > 0) {
        userResult = await client.query(
          `UPDATE users SET ${userSet.join(", ")} WHERE id = $${idx} RETURNING *`,
          userParams
        );
        if (userResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Patient not found" });
        }
      } else {
        userResult = await client.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
      }

      const patFields = ["location", "avatar", "date_joined"];
      const patSet = [];
      const patParams = [];
      idx = 1;
      for (const f of patFields) {
        if (f in data) {
          patSet.push(`${f} = $${idx++}`);
          patParams.push(data[f]);
        }
      }
      patParams.push(req.params.id);

      let patResult;
      if (patSet.length > 0) {
        patResult = await client.query(
          `UPDATE patients SET ${patSet.join(", ")} WHERE id = $${idx} RETURNING *`,
          patParams
        );
      } else {
        patResult = await client.query("SELECT * FROM patients WHERE id = $1", [req.params.id]);
      }

      await client.query("COMMIT");
      res.json({ ...userResult.rows[0], ...patResult.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — soft-delete patient (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), validateParam("uuid"), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Patient not found" });
    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["soft_delete", "user", req.params.id, req.auth.userId, JSON.stringify({ type: "patient" })]
    );
    res.status(204).send();
  } catch (err) { next(err); }
});

// POST /:id/restore — restore soft-deleted patient (admin only)
router.post("/:id/restore", requireAuth, requireRole("admin"), validateParam("uuid"), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `UPDATE users SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING id, email, full_name, role, status, created_at`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Patient not found or not deleted" });
    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["restore", "user", req.params.id, req.auth.userId, JSON.stringify({ type: "patient" })]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
