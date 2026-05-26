const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, attachUser, requireOwnership } = require("../middleware/auth");
const { validateParam } = require("../middleware/validate");

const router = Router();

// GET / — list wallets with role-based filtering
router.get("/", requireAuth, attachUser, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const params = [];
    let paramIdx = 1;

    let where = "";
    // Role-based filtering: providers/patients see only their wallets
    if (req.user?.role === "provider" || req.user?.role === "patient") {
      where = `WHERE w.user_id = $${paramIdx++}`;
      params.push(req.user.id);
    }

    params.push(Number(limit), Number(offset));

    const { rows } = await db.query(
      `SELECT w.*, u.full_name AS user_name, u.email AS user_email, u.role AS user_role
       FROM wallets w
       LEFT JOIN users u ON w.user_id = u.id AND u.deleted_at IS NULL
       ${where}
       ORDER BY w.user_id LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      params
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
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

module.exports = router;
