const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { trigger } = require("../lib/novu");

// POST /sync — upsert user from Clerk, create profile if not exists
// First user gets admin role automatically (bootstrap)
// New non-admin users must provide role (provider or patient)
router.post("/sync", requireAuth, async (req, res, next) => {
  try {
    const { email, full_name, role, avatar_url } = req.body;

    // Check if user exists (fast path — no lock needed)
    const existing = await db.query(
      "SELECT id, clerk_user_id, email, full_name, role, status, account_number, avatar_url, created_at FROM users WHERE clerk_user_id = $1",
      [req.auth.userId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    // New user — use transaction with advisory lock for safe first-admin bootstrap
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext('bootstrap_admin'))");

      // Re-check existence inside lock (another request may have created this user)
      const existingInside = await client.query(
        "SELECT id, clerk_user_id, email, full_name, role, status, account_number, avatar_url, created_at FROM users WHERE clerk_user_id = $1",
        [req.auth.userId]
      );
      if (existingInside.rows.length > 0) {
        await client.query("COMMIT");
        return res.json(existingInside.rows[0]);
      }

      const userCount = await client.query("SELECT COUNT(*) FROM users");
      const isFirstUser = parseInt(userCount.rows[0].count) === 0;

      if (isFirstUser) {
        const { rows } = await client.query(
          `INSERT INTO users (clerk_user_id, email, full_name, role, status, avatar_url)
           VALUES ($1, $2, $3, 'admin', 'active', $4)
           RETURNING id, clerk_user_id, email, full_name, role, status, account_number, avatar_url, created_at`,
          [req.auth.userId, email || "", full_name || "", avatar_url || null]
        );
        await client.query("COMMIT");
        return res.status(201).json(rows[0]);
      }

      // Non-first users must provide role
      if (!role || !["provider", "patient"].includes(role)) {
        await client.query("COMMIT");
        return res.status(200).json({ needsRole: true });
      }

      const { rows } = await client.query(
        `INSERT INTO users (clerk_user_id, email, full_name, role, status, avatar_url)
         VALUES ($1, $2, $3, $4, 'active', $5)
         RETURNING id, clerk_user_id, email, full_name, role, status, account_number, avatar_url, created_at`,
        [req.auth.userId, email || "", full_name || "", role, avatar_url || null]
      );

      // If provider, also create provider record
      if (role === "provider") {
        await client.query(
          `INSERT INTO providers (id, specialty, credentials, accept_rate, rating)
           VALUES ($1, NULL, NULL, NULL, 0)`,
          [rows[0].id]
        );
      }

      // If patient, also create patient record
      if (role === "patient") {
        await client.query(
          `INSERT INTO patients (id, location, avatar, date_joined)
           VALUES ($1, NULL, NULL, CURRENT_DATE)`,
          [rows[0].id]
        );
      }

      await client.query("COMMIT");

      // Notify admins (outside transaction — fire and forget)
      if (role === "patient") {
        const admins = await db.query(
          "SELECT clerk_user_id FROM users WHERE role = 'admin'"
        );
        for (const a of admins.rows) {
          trigger("patient-registered", a.clerk_user_id, {
            patientName: full_name || email,
          });
        }
      }

      res.status(201).json(rows[0]);
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

// GET /me — current user profile
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT id, clerk_user_id, email, full_name, role, status, account_number, created_at FROM users WHERE clerk_user_id = $1",
      [req.auth.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /me — update full_name and account_number
router.put("/me", requireAuth, validate("updateUser"), async (req, res, next) => {
  try {
    const { full_name, account_number } = req.validated;

    const { rows } = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           account_number = COALESCE($2, account_number)
       WHERE clerk_user_id = $3
       RETURNING id, clerk_user_id, email, full_name, role, status, account_number, created_at`,
      [full_name, account_number, req.auth.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
