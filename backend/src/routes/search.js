const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, attachUser } = require("../middleware/auth");

const router = Router();

// GET /api/search?q=term — search across patients, providers, requests, transactions
// Role-based: patients/providers see only their own data, admins see all
router.get("/", requireAuth, attachUser, async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const term = `%${q}%`;
    const user = req.user;
    const isAdmin = user?.role === "admin" || user?.role === "moderator";

    // Patients can only search their own requests/transactions
    // Providers can only search their own requests/transactions
    // Admins/moderators see everything

    const [patients, providers, requests, transactions] = await Promise.all([
      // Patients: admins see all, others see none (patients don't list other patients)
      isAdmin ? db.query(
        `SELECT u.id, u.full_name AS name, 'patient' AS type
         FROM patients p JOIN users u ON p.id = u.id
         WHERE u.deleted_at IS NULL AND (u.full_name ILIKE $1 OR u.email ILIKE $1)
         LIMIT 5`,
        [term]
      ) : { rows: [] },

      // Providers: admins see all, patients/providers see all (public directory)
      db.query(
        `SELECT u.id, u.full_name AS name, p.specialty, 'provider' AS type
         FROM providers p JOIN users u ON p.id = u.id
         WHERE u.deleted_at IS NULL AND (u.full_name ILIKE $1 OR p.specialty ILIKE $1)
         LIMIT 5`,
        [term]
      ),

      // Requests: admins see all, others see only their own
      db.query(
        `SELECT r.id, r.service AS name, r.status, 'request' AS type
         FROM requests r
         WHERE r.service ILIKE $1 ${isAdmin ? "" : user?.role === "provider" ? "AND r.provider_id = $2" : "AND r.patient_id = $2"}
         LIMIT 5`,
        isAdmin ? [term] : [term, user.id]
      ),

      // Transactions: admins see all, others see only their own
      db.query(
        `SELECT t.id, t.service AS name, t.amount, 'transaction' AS type
         FROM transactions t
         WHERE (t.service ILIKE $1 OR t.id ILIKE $1) ${isAdmin ? "" : user?.role === "provider" ? "AND t.provider_id = $2" : "AND t.patient_id = $2"}
         LIMIT 5`,
        isAdmin ? [term] : [term, user.id]
      ),
    ]);

    res.json({
      patients: patients.rows,
      providers: providers.rows,
      requests: requests.rows,
      transactions: transactions.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;
