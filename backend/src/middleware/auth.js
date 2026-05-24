const { getAuth } = require("@clerk/express");
const db = require("../config/db");

/**
 * Require authentication via Clerk.
 * Attaches req.auth (Clerk) and req.user (local DB record).
 */
function requireAuth(req, res, next) {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.auth = auth;
  next();
}

/**
 * Require specific roles. Must be used after requireAuth.
 * Looks up the user's role from the local users table.
 */
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const { rows } = await db.query(
        "SELECT id, clerk_user_id, email, full_name, role, status FROM users WHERE clerk_user_id = $1",
        [req.auth.userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "User profile not found" });
      }

      const user = rows[0];

      if (user.status === "suspended") {
        return res.status(403).json({ error: "Account is suspended" });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Attach user profile if authenticated. Blocks if user not found in DB.
 * Used as default middleware on data routes.
 */
async function attachUser(req, res, next) {
  try {
    // requireAuth already set req.auth with userId
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { rows } = await db.query(
      "SELECT id, clerk_user_id, email, full_name, role, status, avatar_url FROM users WHERE clerk_user_id = $1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User profile not found. Please complete sign-up." });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, requireRole, attachUser };
