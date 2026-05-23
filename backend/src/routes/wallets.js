const { Router } = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// GET / — list wallets
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const { rows } = await db.query(
      `SELECT w.*, u.full_name AS user_name, u.email AS user_email, u.role AS user_role
       FROM wallets w
       LEFT JOIN users u ON w.user_id = u.id
       ORDER BY w.user_id LIMIT $1 OFFSET $2`,
      [Number(limit), Number(offset)]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /:id — get single wallet
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT w.*, u.full_name AS user_name, u.email AS user_email, u.role AS user_role
       FROM wallets w
       LEFT JOIN users u ON w.user_id = u.id
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
