const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const db = require("../config/db");

const router = Router();

// GET /api/analytics/stats?days=30
router.get("/stats", requireAuth, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const prevThreshold = new Date();
    prevThreshold.setDate(prevThreshold.getDate() - days * 2);

    // Current period
    const current = await db.query(
      `SELECT
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
        COUNT(*) FILTER (WHERE status = 'canceled') as canceled
      FROM requests WHERE date >= $1`,
      [dateThreshold.toISOString().split("T")[0]]
    );

    // Previous period for comparison
    const previous = await db.query(
      `SELECT
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM requests WHERE date >= $1 AND date < $2`,
      [prevThreshold.toISOString().split("T")[0], dateThreshold.toISOString().split("T")[0]]
    );

    // Active providers
    const providers = await db.query(
      `SELECT COUNT(*) FROM users WHERE role = 'provider' AND status = 'active'`
    );

    // Completion rate
    const cur = current.rows[0];
    const prev = previous.rows[0];
    const total = parseInt(cur.total_requests);
    const completed = parseInt(cur.completed);
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

    const prevTotal = parseInt(prev.total_requests);
    const prevCompleted = parseInt(prev.completed);
    const prevRate = prevTotal > 0 ? ((prevCompleted / prevTotal) * 100).toFixed(1) : "0";

    // Request change percentage
    const requestChange = prevTotal > 0
      ? `+${Math.round(((total - prevTotal) / prevTotal) * 100)}%`
      : "+0%";

    const rateChange = (parseFloat(completionRate) - parseFloat(prevRate)).toFixed(1);
    const rateChangeStr = rateChange >= 0 ? `+${rateChange}%` : `${rateChange}%`;

    res.json({
      totalRequests: { value: total, change: requestChange },
      activeProviders: { value: parseInt(providers.rows[0].count), change: "+0%" },
      completionRate: { value: `${completionRate}%`, change: rateChangeStr },
      avgResponseTime: { value: "28 min", change: "-3 min" }, // Placeholder — needs response time tracking
      patientSatisfaction: { value: parseFloat(completionRate), change: rateChangeStr },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/requests-over-time?days=30
router.get("/requests-over-time", requireAuth, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const { rows } = await db.query(
      `SELECT
        TO_CHAR(date, 'Mon') as month,
        EXTRACT(MONTH FROM date) as month_num,
        COUNT(*) as requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'canceled') as canceled
      FROM requests
      WHERE date >= $1
      GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
      ORDER BY month_num`,
      [dateThreshold.toISOString().split("T")[0]]
    );

    res.json(rows.map(r => ({
      month: r.month,
      requests: parseInt(r.requests),
      completed: parseInt(r.completed),
      "In Progress": parseInt(r.in_progress),
      canceled: parseInt(r.canceled),
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/revenue-by-service?days=30
router.get("/revenue-by-service", requireAuth, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const { rows } = await db.query(
      `SELECT
        service as name,
        SUM(amount) as value
      FROM transactions
      WHERE date >= $1 AND status = 'completed'
      GROUP BY service
      ORDER BY value DESC
      LIMIT 5`,
      [dateThreshold.toISOString().split("T")[0]]
    );

    res.json(rows.map(r => ({
      name: r.name,
      value: parseFloat(r.value),
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/status-distribution?days=30
router.get("/status-distribution", requireAuth, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const { rows } = await db.query(
      `SELECT
        status as name,
        COUNT(*) as value
      FROM requests
      WHERE date >= $1
      GROUP BY status
      ORDER BY value DESC`,
      [dateThreshold.toISOString().split("T")[0]]
    );

    res.json(rows.map(r => ({
      name: r.name,
      value: parseInt(r.value),
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/top-providers
router.get("/top-providers", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.full_name AS provider, p.rating, p.visits AS requests
       FROM providers p
       JOIN users u ON p.id = u.id
       WHERE u.status = 'active'
       ORDER BY p.rating DESC, p.visits DESC
       LIMIT 5`
    );
    res.json(rows.map(r => ({
      provider: r.provider,
      rating: parseFloat(r.rating) || 0,
      requests: parseInt(r.requests) || 0,
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/billing-summary
router.get("/billing-summary", requireAuth, async (req, res, next) => {
  try {
    const [balance, earnings, pendingWithdrawals, onHold] = await Promise.all([
      db.query("SELECT COALESCE(SUM(balance), 0) AS total FROM wallets"),
      db.query("SELECT COALESCE(SUM(earnings), 0) AS total FROM wallets"),
      db.query("SELECT COALESCE(SUM(amount), 0) AS total FROM withdrawals WHERE status = 'pending'"),
      db.query("SELECT COALESCE(SUM(on_hold), 0) AS total FROM wallets"),
    ]);

    res.json({
      totalBalance: parseFloat(balance.rows[0].total),
      totalEarnings: parseFloat(earnings.rows[0].total),
      pendingWithdrawals: parseFloat(pendingWithdrawals.rows[0].total),
      onHoldFunds: parseFloat(onHold.rows[0].total),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/earnings-over-time
router.get("/earnings-over-time", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT TO_CHAR(date, 'Mon') AS month,
              EXTRACT(MONTH FROM date) AS month_num,
              SUM(amount) AS value
       FROM transactions
       WHERE status = 'completed' AND date >= NOW() - INTERVAL '1 year'
       GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
       ORDER BY month_num`
    );
    res.json(rows.map(r => ({
      month: r.month.trim(),
      value: parseFloat(r.value),
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/transaction-types
router.get("/transaction-types", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT service AS label, COUNT(*) AS count FROM transactions GROUP BY service`
    );
    const total = rows.reduce((s, r) => s + parseInt(r.count), 0) || 1;
    const colors = ["bg-teal-600", "bg-gray-600", "bg-error-500"];
    res.json(rows.map((r, i) => ({
      label: r.label,
      value: `${Math.round((parseInt(r.count) / total) * 100)}%`,
      color: colors[i % colors.length],
    })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
