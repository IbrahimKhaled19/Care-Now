const { Router } = require("express");
const { requireAuth, attachUser } = require("../middleware/auth");
const db = require("../config/db");

const router = Router();

// Helper: build WHERE clause for role-based request filtering
function requestFilter(user) {
  if (user.role === "provider") return { clause: "AND r.provider_id = $3", param: user.id };
  if (user.role === "patient") return { clause: "AND r.patient_id = $3", param: user.id };
  return { clause: "", param: null };
}

// Helper: build WHERE clause for role-based transaction filtering
function transactionFilter(user) {
  if (user.role === "provider") return { clause: "AND t.provider_id = $2", param: user.id };
  if (user.role === "patient") return { clause: "AND t.patient_id = $2", param: user.id };
  return { clause: "", param: null };
}

// Helper: build WHERE clause for role-based wallet filtering
function walletFilter(user) {
  if (user.role === "provider" || user.role === "patient") return { clause: "WHERE w.user_id = $1", param: user.id };
  return { clause: "", param: null };
}

// Helper: build WHERE clause for role-based withdrawal filtering
function withdrawalFilter(user) {
  if (user.role === "provider") return { clause: "AND w.user_id = $2", param: user.id };
  return { clause: "", param: null };
}

// GET /api/analytics/stats?days=30
router.get("/stats", requireAuth, attachUser, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateStr = dateThreshold.toISOString().split("T")[0];

    const prevThreshold = new Date();
    prevThreshold.setDate(prevThreshold.getDate() - days * 2);
    const prevStr = prevThreshold.toISOString().split("T")[0];

    const rf = requestFilter(req.user);

    // Current period
    const currentParams = rf.param ? [dateStr, rf.param] : [dateStr];
    const current = await db.query(
      `SELECT
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
        COUNT(*) FILTER (WHERE status = 'canceled') as canceled
      FROM requests r WHERE r.date >= $1 ${rf.clause}`,
      currentParams
    );

    // Previous period
    const prevParams = rf.param ? [prevStr, dateStr, rf.param] : [prevStr, dateStr];
    const previous = await db.query(
      `SELECT
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM requests r WHERE r.date >= $1 AND r.date < $2 ${rf.clause}`,
      prevParams
    );

    // Active providers (admin only)
    let providerCount = 0;
    if (req.user.role === "admin" || req.user.role === "moderator") {
      const providers = await db.query(
        `SELECT COUNT(*) FROM users WHERE role = 'provider' AND status = 'active'`
      );
      providerCount = parseInt(providers.rows[0].count);
    }

    const cur = current.rows[0];
    const prev = previous.rows[0];
    const total = parseInt(cur.total_requests);
    const completed = parseInt(cur.completed);
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

    const prevTotal = parseInt(prev.total_requests);
    const prevCompleted = parseInt(prev.completed);
    const prevRate = prevTotal > 0 ? ((prevCompleted / prevTotal) * 100).toFixed(1) : "0";

    const requestChange = prevTotal > 0
      ? `+${Math.round(((total - prevTotal) / prevTotal) * 100)}%`
      : "+0%";

    const rateChange = (parseFloat(completionRate) - parseFloat(prevRate)).toFixed(1);
    const rateChangeStr = rateChange >= 0 ? `+${rateChange}%` : `${rateChange}%`;

    res.json({
      totalRequests: { value: total, change: requestChange },
      activeProviders: { value: providerCount, change: "+0%" },
      completionRate: { value: `${completionRate}%`, change: rateChangeStr },
      avgResponseTime: { value: "28 min", change: "-3 min" },
      patientSatisfaction: { value: parseFloat(completionRate), change: rateChangeStr },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/requests-over-time?days=30
router.get("/requests-over-time", requireAuth, attachUser, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateStr = dateThreshold.toISOString().split("T")[0];
    const rf = requestFilter(req.user);
    const params = rf.param ? [dateStr, rf.param] : [dateStr];

    const { rows } = await db.query(
      `SELECT
        TO_CHAR(r.date, 'Mon') as month,
        EXTRACT(MONTH FROM r.date) as month_num,
        COUNT(*) as requests,
        COUNT(*) FILTER (WHERE r.status = 'completed') as completed,
        COUNT(*) FILTER (WHERE r.status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE r.status = 'canceled') as canceled
      FROM requests r
      WHERE r.date >= $1 ${rf.clause}
      GROUP BY TO_CHAR(r.date, 'Mon'), EXTRACT(MONTH FROM r.date)
      ORDER BY month_num`,
      params
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
router.get("/revenue-by-service", requireAuth, attachUser, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateStr = dateThreshold.toISOString().split("T")[0];
    const tf = transactionFilter(req.user);
    const params = tf.param ? [dateStr, tf.param] : [dateStr];

    const { rows } = await db.query(
      `SELECT t.service as name, SUM(t.amount) as value
       FROM transactions t
       WHERE t.date >= $1 AND t.status = 'completed' ${tf.clause}
       GROUP BY t.service
       ORDER BY value DESC
       LIMIT 5`,
      params
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
router.get("/status-distribution", requireAuth, attachUser, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateStr = dateThreshold.toISOString().split("T")[0];
    const rf = requestFilter(req.user);
    const params = rf.param ? [dateStr, rf.param] : [dateStr];

    const { rows } = await db.query(
      `SELECT r.status as name, COUNT(*) as value
       FROM requests r
       WHERE r.date >= $1 ${rf.clause}
       GROUP BY r.status
       ORDER BY value DESC`,
      params
    );

    res.json(rows.map(r => ({
      name: r.name,
      value: parseInt(r.value),
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/top-providers (admin only)
router.get("/top-providers", requireAuth, attachUser, async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "moderator") {
      return res.json([]);
    }

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
router.get("/billing-summary", requireAuth, attachUser, async (req, res, next) => {
  try {
    const wf = walletFilter(req.user);
    const wd = withdrawalFilter(req.user);

    const walletWhere = wf.clause;
    const walletParams = wf.param ? [wf.param] : [];

    const withdrawalWhere = wd.clause ? `WHERE ${wd.clause.replace("AND ", "")}` : "";
    const withdrawalParams = wd.param ? [wd.param] : [];

    const [balance, earnings, pendingWithdrawals, onHold] = await Promise.all([
      db.query(`SELECT COALESCE(SUM(balance), 0) AS total FROM wallets w ${walletWhere}`, walletParams),
      db.query(`SELECT COALESCE(SUM(earnings), 0) AS total FROM wallets w ${walletWhere}`, walletParams),
      db.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM withdrawals w WHERE w.status = 'pending' ${wd.clause}`, wd.param ? [wd.param] : []),
      db.query(`SELECT COALESCE(SUM(on_hold), 0) AS total FROM wallets w ${walletWhere}`, walletParams),
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
router.get("/earnings-over-time", requireAuth, attachUser, async (req, res, next) => {
  try {
    const tf = transactionFilter(req.user);
    const params = tf.param ? [tf.param] : [];

    const { rows } = await db.query(
      `SELECT TO_CHAR(t.date, 'Mon') AS month,
              EXTRACT(MONTH FROM t.date) AS month_num,
              SUM(t.amount) AS value
       FROM transactions t
       WHERE t.status = 'completed' AND t.date >= NOW() - INTERVAL '1 year' ${tf.clause}
       GROUP BY TO_CHAR(t.date, 'Mon'), EXTRACT(MONTH FROM t.date)
       ORDER BY month_num`,
      params
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
router.get("/transaction-types", requireAuth, attachUser, async (req, res, next) => {
  try {
    const tf = transactionFilter(req.user);
    const params = tf.param ? [tf.param] : [];

    const { rows } = await db.query(
      `SELECT t.service AS label, COUNT(*) AS count FROM transactions t WHERE 1=1 ${tf.clause} GROUP BY t.service`,
      params
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
