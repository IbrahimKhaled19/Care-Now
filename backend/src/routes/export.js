const { Router } = require("express");
const db = require("../config/db");
const { requireAuth, attachUser } = require("../middleware/auth");

const router = Router();

function sendCsv(res, filename, columns, rows) {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  // Header row
  const header = columns.map((c) => c.label).join(",");
  const lines = [header];

  // Data rows
  for (const row of rows) {
    const values = columns.map((c) => {
      const val = row[c.key];
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    });
    lines.push(values.join(","));
  }

  res.send(lines.join("\n"));
}

// GET /api/requests/export
router.get("/requests/export", requireAuth, attachUser, async (req, res, next) => {
  try {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (req.user?.role === "provider") {
      conditions.push(`r.provider_id = $${idx++}`);
      params.push(req.user.id);
    } else if (req.user?.role === "patient") {
      conditions.push(`r.patient_id = $${idx++}`);
      params.push(req.user.id);
    }

    if (req.query.status) {
      conditions.push(`r.status = $${idx++}`);
      params.push(req.query.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await db.query(
      `SELECT r.id, pu.full_name AS patient_name, pru.full_name AS provider_name,
              r.service, r.status, r.date, r.created_at
       FROM requests r
       LEFT JOIN users pu ON r.patient_id = pu.id
       LEFT JOIN users pru ON r.provider_id = pru.id
       ${where}
       ORDER BY r.created_at DESC`,
      params
    );

    sendCsv(res, "requests.csv", [
      { key: "id", label: "ID" },
      { key: "patient_name", label: "Patient" },
      { key: "provider_name", label: "Provider" },
      { key: "service", label: "Service" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date" },
      { key: "created_at", label: "Created" },
    ], rows);
  } catch (err) { next(err); }
});

// GET /api/transactions/export
router.get("/transactions/export", requireAuth, attachUser, async (req, res, next) => {
  try {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (req.user?.role === "provider") {
      conditions.push(`t.provider_id = $${idx++}`);
      params.push(req.user.id);
    } else if (req.user?.role === "patient") {
      conditions.push(`t.patient_id = $${idx++}`);
      params.push(req.user.id);
    }

    if (req.query.status) {
      conditions.push(`t.status = $${idx++}`);
      params.push(req.query.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await db.query(
      `SELECT t.id, p.full_name AS patient_name, pr.full_name AS provider_name,
              t.service, t.amount, t.status, t.date
       FROM transactions t
       LEFT JOIN users p ON t.patient_id = p.id
       LEFT JOIN users pr ON t.provider_id = pr.id
       ${where}
       ORDER BY t.date DESC`,
      params
    );

    sendCsv(res, "transactions.csv", [
      { key: "id", label: "ID" },
      { key: "patient_name", label: "Patient" },
      { key: "provider_name", label: "Provider" },
      { key: "service", label: "Service" },
      { key: "amount", label: "Amount" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date" },
    ], rows);
  } catch (err) { next(err); }
});

// GET /api/providers/export — admins see all, providers see all (public directory), patients blocked
router.get("/providers/export", requireAuth, attachUser, async (req, res, next) => {
  try {
    const user = req.user;
    if (user?.role === "patient") {
      return res.status(403).json({ error: "Access denied" });
    }

    const conditions = ["u.deleted_at IS NULL"];
    const params = [];
    let idx = 1;

    if (req.query.status) {
      conditions.push(`u.status = $${idx++}`);
      params.push(req.query.status);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const { rows } = await db.query(
      `SELECT u.id, u.full_name AS name, p.specialty, p.credentials, p.rating, u.status
       FROM providers p
       JOIN users u ON p.id = u.id
       ${where}
       ORDER BY u.full_name`,
      params
    );

    sendCsv(res, "providers.csv", [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "specialty", label: "Specialty" },
      { key: "credentials", label: "Credentials" },
      { key: "rating", label: "Rating" },
      { key: "status", label: "Status" },
    ], rows);
  } catch (err) { next(err); }
});

// GET /api/patients/export — admins only (sensitive patient data)
router.get("/patients/export", requireAuth, attachUser, async (req, res, next) => {
  try {
    const user = req.user;
    if (user?.role !== "admin" && user?.role !== "moderator") {
      return res.status(403).json({ error: "Access denied" });
    }

    const conditions = ["u.deleted_at IS NULL"];
    const params = [];
    let idx = 1;

    if (req.query.status) {
      conditions.push(`u.status = $${idx++}`);
      params.push(req.query.status);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const { rows } = await db.query(
      `SELECT u.id, u.full_name AS name, u.email, p.location, u.status, p.date_joined
       FROM patients p
       JOIN users u ON p.id = u.id
       ${where}
       ORDER BY u.full_name`,
      params
    );

    sendCsv(res, "patients.csv", [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
      { key: "date_joined", label: "Date Joined" },
    ], rows);
  } catch (err) { next(err); }
});

module.exports = router;
