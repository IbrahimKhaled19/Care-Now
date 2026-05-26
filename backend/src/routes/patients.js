const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth, requireRole, attachUser, requireOwnership } = require("../middleware/auth");
const { validate, validateParam } = require("../middleware/validate");
const { trigger } = require("../lib/novu");

// GET / — list patients with optional filters
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    const params = [];
    const conditions = [];
    let paramIdx = 1;

    // Always exclude soft-deleted users
    conditions.push(`u.deleted_at IS NULL`);

    if (status) {
      conditions.push(`u.status = $${paramIdx++}`);
      params.push(status);
    }

    if (search) {
      conditions.push(
        `(u.full_name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR p.location ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(Number(limit), Number(offset));

    const { rows } = await db.query(
      `SELECT u.id, u.full_name AS name, u.email, u.status AS state,
              p.location, p.avatar, p.date_joined AS date,
              COALESCE(u.avatar_url, p.avatar) AS avatar
       FROM patients p
       JOIN users u ON p.id = u.id
       ${where}
       ORDER BY u.full_name
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      params
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
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

// GET /:id/medical — list medical info for a patient
router.get("/:id/medical", requireAuth, validateParam("uuid"), async (req, res, next) => {
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

// GET /:id/transactions — list transactions for a patient
router.get("/:id/transactions", requireAuth, validateParam("uuid"), async (req, res, next) => {
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

// PUT /:id — update patient (admin only)
router.put("/:id", requireAuth, requireRole("admin"), validateParam("uuid"), validate("updatePatient"), async (req, res, next) => {
  try {
    const {
      full_name, email, status, account_number,
      location, avatar, date_joined,
    } = req.validated;

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             email = COALESCE($2, email),
             status = COALESCE($3, status),
             account_number = COALESCE($4, account_number)
         WHERE id = $5
         RETURNING *`,
        [full_name, email, status, account_number, req.params.id]
      );

      if (userResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Patient not found" });
      }

      const patientResult = await client.query(
        `UPDATE patients
         SET location = COALESCE($1, location),
             avatar = COALESCE($2, avatar),
             date_joined = COALESCE($3, date_joined)
         WHERE id = $4
         RETURNING *`,
        [location, avatar, date_joined, req.params.id]
      );

      await client.query("COMMIT");

      res.json({ ...userResult.rows[0], ...patientResult.rows[0] });
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

module.exports = router;
