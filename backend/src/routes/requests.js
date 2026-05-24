const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { trigger } = require("../lib/novu");

// GET / — list all requests with optional filters
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    const params = [];
    const conditions = [];
    let paramIdx = 1;

    if (status) {
      conditions.push(`r.status = $${paramIdx++}`);
      params.push(status);
    }

    if (search) {
      conditions.push(
        `(pu.full_name ILIKE $${paramIdx} OR pru.full_name ILIKE $${paramIdx} OR r.service ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(Number(limit), Number(offset));

    const { rows } = await db.query(
      `SELECT r.id, r.service, r.status, r.date, r.created_at,
              pu.full_name AS patient_name,
              pru.full_name AS provider_name
       FROM requests r
       LEFT JOIN users pu ON r.patient_id = pu.id
       LEFT JOIN users pru ON r.provider_id = pru.id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      params
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /:id — single request
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT r.id, r.service, r.status, r.date, r.created_at,
              r.patient_id, r.provider_id,
              pu.full_name AS patient_name,
              pru.full_name AS provider_name
       FROM requests r
       LEFT JOIN users pu ON r.patient_id = pu.id
       LEFT JOIN users pru ON r.provider_id = pru.id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST / — create request (admin only)
router.post("/", requireAuth, requireRole("admin"), validate("createRequest"), async (req, res, next) => {
  try {
    const { patient_id, provider_id, service, status, date } = req.validated;

    const { rows } = await db.query(
      date
        ? `INSERT INTO requests (patient_id, provider_id, service, status, date)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`
        : `INSERT INTO requests (patient_id, provider_id, service, status)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
      date
        ? [patient_id, provider_id, service, status || "waiting", date]
        : [patient_id, provider_id, service, status || "waiting"]
    );

    const request = rows[0];

    // Notify provider if assigned
    if (provider_id) {
      const provider = await db.query(
        "SELECT clerk_user_id, full_name FROM users WHERE id = $1",
        [provider_id]
      );
      if (provider.rows.length > 0) {
        const patient = patient_id
          ? await db.query("SELECT full_name FROM users WHERE id = $1", [patient_id])
          : null;
        trigger("new-request", provider.rows[0].clerk_user_id, {
          providerName: provider.rows[0].full_name,
          patientName: patient?.rows[0]?.full_name || "A patient",
          service,
          requestId: request.id,
        });
      }
    }

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// PUT /:id — update request (admin only)
router.put("/:id", requireAuth, requireRole("admin"), validate("updateRequest"), async (req, res, next) => {
  try {
    const { patient_id, provider_id, service, status, date } = req.validated;

    const { rows } = await db.query(
      `UPDATE requests
       SET patient_id = COALESCE($1, patient_id),
           provider_id = COALESCE($2, provider_id),
           service = COALESCE($3, service),
           status = COALESCE($4, status),
           date = COALESCE($5, date)
       WHERE id = $6
       RETURNING *`,
      [patient_id, provider_id, service, status, date, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const updated = rows[0];

    // Notify provider on status change
    if (status && updated.provider_id) {
      const provider = await db.query(
        "SELECT clerk_user_id, full_name FROM users WHERE id = $1",
        [updated.provider_id]
      );
      if (provider.rows.length > 0) {
        trigger("request-status-changed", provider.rows[0].clerk_user_id, {
          providerName: provider.rows[0].full_name,
          service: updated.service,
          status,
          requestId: updated.id,
        });
      }
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — delete request (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      "DELETE FROM requests WHERE id = $1",
      [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ message: "Request deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
