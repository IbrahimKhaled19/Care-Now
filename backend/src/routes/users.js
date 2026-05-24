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
    const { email, full_name, role } = req.body;

    // Check if user exists
    const existing = await db.query(
      "SELECT id, clerk_user_id, email, full_name, role, status, account_number, created_at FROM users WHERE clerk_user_id = $1",
      [req.auth.userId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    // First user gets admin automatically
    const userCount = await db.query("SELECT COUNT(*) FROM users");
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;

    if (isFirstUser) {
      const { rows } = await db.query(
        `INSERT INTO users (clerk_user_id, email, full_name, role, status)
         VALUES ($1, $2, $3, 'admin', 'active')
         RETURNING id, clerk_user_id, email, full_name, role, status, account_number, created_at`,
        [req.auth.userId, email || "", full_name || ""]
      );
      return res.status(201).json(rows[0]);
    }

    // Non-first users must provide role
    if (!role || !["provider", "patient"].includes(role)) {
      return res.status(200).json({ needsRole: true });
    }

    const { rows } = await db.query(
      `INSERT INTO users (clerk_user_id, email, full_name, role, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id, clerk_user_id, email, full_name, role, status, account_number, created_at`,
      [req.auth.userId, email || "", full_name || "", role]
    );

    // If provider, also create provider record
    if (role === "provider") {
      await db.query(
        `INSERT INTO providers (id, specialty, credentials, accept_rate, rating)
         VALUES ($1, NULL, NULL, NULL, 0)`,
        [rows[0].id]
      );
    }

    // If patient, also create patient record
    if (role === "patient") {
      await db.query(
        `INSERT INTO patients (id, location, avatar, date_joined)
         VALUES ($1, NULL, NULL, CURRENT_DATE)`,
        [rows[0].id]
      );

      // Notify admins
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
