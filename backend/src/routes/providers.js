const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth, requireRole, attachUser, requireOwnership } = require("../middleware/auth");
const { validate, validateParam } = require("../middleware/validate");

// GET / — list providers with optional filters
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
        `(u.full_name ILIKE $${paramIdx} OR p.specialty ILIKE $${paramIdx} OR p.credentials ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(Number(limit), Number(offset));

    const { rows } = await db.query(
      `SELECT u.id, u.full_name AS name, p.specialty, p.visits, p.credentials,
              p.accept_rate, p.rating, u.status,
              COALESCE(u.avatar_url, p.avatar) AS avatar
       FROM providers p
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

// GET /:id — single provider (join users + providers)
router.get("/:id", requireAuth, validateParam("uuid"), attachUser, requireOwnership(async (req) => {
  const { rows } = await db.query("SELECT id FROM providers WHERE id = $1", [req.params.id]);
  return rows[0]?.id;
}), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.clerk_user_id, u.email, u.full_name, u.role, u.status,
              u.account_number, u.created_at,
              p.specialty, p.visits, p.credentials, p.accept_rate, p.rating,
              COALESCE(u.avatar_url, p.avatar) AS avatar
       FROM providers p
       JOIN users u ON p.id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Provider not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /:id/services — list services for a provider
router.get("/:id/services", requireAuth, validateParam("uuid"), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, description FROM provider_services WHERE provider_id = $1 ORDER BY name`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /:id/transactions — list transactions for a provider
router.get("/:id/transactions", requireAuth, validateParam("uuid"), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT t.id, u.full_name AS patient_name, t.date, t.service, t.amount, t.status
       FROM transactions t
       LEFT JOIN users u ON t.patient_id = u.id
       WHERE t.provider_id = $1
       ORDER BY t.date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /:id/requests — list requests for a provider
router.get("/:id/requests", requireAuth, validateParam("uuid"), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT r.id, u.full_name AS patient_name, r.service, r.status, r.date
       FROM requests r
       LEFT JOIN users u ON r.patient_id = u.id
       WHERE r.provider_id = $1
       ORDER BY r.date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST / — create provider (admin only): create user first, then provider record
router.post("/", requireAuth, requireRole("admin"), validate("createProvider"), async (req, res, next) => {
  try {
    const {
      email, full_name, account_number,
      specialty, credentials, accept_rate, rating, avatar,
    } = req.validated;
    const clerk_user_id = req.validated.clerk_user_id || `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        `INSERT INTO users (clerk_user_id, email, full_name, role, status, account_number)
         VALUES ($1, $2, $3, 'provider', 'active', $4)
         RETURNING *`,
        [clerk_user_id, email, full_name, account_number]
      );
      const user = userResult.rows[0];

      const providerResult = await client.query(
        `INSERT INTO providers (id, specialty, credentials, accept_rate, rating, avatar)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [user.id, specialty, credentials, accept_rate, rating, avatar]
      );

      await client.query("COMMIT");

      res.status(201).json({ ...user, ...providerResult.rows[0] });
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

// PUT /:id — update provider (admin only)
router.put("/:id", requireAuth, requireRole("admin"), validateParam("uuid"), validate("updateProvider"), async (req, res, next) => {
  try {
    const {
      full_name, email, status, account_number,
      specialty, credentials, accept_rate, rating, avatar,
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
        return res.status(404).json({ error: "Provider not found" });
      }

      const providerResult = await client.query(
        `UPDATE providers
         SET specialty = COALESCE($1, specialty),
             credentials = COALESCE($2, credentials),
             accept_rate = COALESCE($3, accept_rate),
             rating = COALESCE($4, rating),
             avatar = COALESCE($5, avatar)
         WHERE id = $6
         RETURNING *`,
        [specialty, credentials, accept_rate, rating, avatar, req.params.id]
      );

      await client.query("COMMIT");

      res.json({ ...userResult.rows[0], ...providerResult.rows[0] });
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

// PATCH /:id — partial update provider (admin only, allows null values)
router.patch("/:id", requireAuth, requireRole("admin"), validateParam("uuid"), validate("patchProvider"), async (req, res, next) => {
  try {
    const data = req.validated;
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // User fields
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
          return res.status(404).json({ error: "Provider not found" });
        }
      } else {
        userResult = await client.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
      }

      // Provider fields
      const providerFields = ["specialty", "credentials", "accept_rate", "rating", "avatar"];
      const provSet = [];
      const provParams = [];
      idx = 1;
      for (const f of providerFields) {
        if (f in data) {
          provSet.push(`${f} = $${idx++}`);
          provParams.push(data[f]);
        }
      }
      provParams.push(req.params.id);

      let provResult;
      if (provSet.length > 0) {
        provResult = await client.query(
          `UPDATE providers SET ${provSet.join(", ")} WHERE id = $${idx} RETURNING *`,
          provParams
        );
      } else {
        provResult = await client.query("SELECT * FROM providers WHERE id = $1", [req.params.id]);
      }

      await client.query("COMMIT");
      res.json({ ...userResult.rows[0], ...provResult.rows[0] });
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
