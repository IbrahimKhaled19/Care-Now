const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth, requireRole, attachUser, requireOwnership } = require("../middleware/auth");
const { validate, validateParam } = require("../middleware/validate");
const { trigger } = require("../lib/novu");

// GET / — list requests with optional filters (role-based)
router.get("/", requireAuth, attachUser, async (req, res, next) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    const params = [];
    const conditions = [];
    let paramIdx = 1;

    // Role-based filtering
    if (req.user?.role === "provider") {
      conditions.push(`r.provider_id = $${paramIdx++}`);
      params.push(req.user.id);
    } else if (req.user?.role === "patient") {
      conditions.push(`r.patient_id = $${paramIdx++}`);
      params.push(req.user.id);
    }

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
       LEFT JOIN users pu ON r.patient_id = pu.id AND pu.deleted_at IS NULL
       LEFT JOIN users pru ON r.provider_id = pru.id AND pru.deleted_at IS NULL
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
router.get("/:id", requireAuth, validateParam("integer"), attachUser, requireOwnership(async (req) => {
  const { rows } = await db.query(
    "SELECT patient_id, provider_id FROM requests WHERE id = $1",
    [req.params.id]
  );
  if (!rows[0]) return null;
  // Owner is either the patient or the provider on the request
  if (rows[0].patient_id === req.user.id) return req.user.id;
  if (rows[0].provider_id === req.user.id) return req.user.id;
  return null;
}), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT r.id, r.service, r.status, r.date, r.created_at,
              r.patient_id, r.provider_id,
              pu.full_name AS patient_name,
              pru.full_name AS provider_name
       FROM requests r
       LEFT JOIN users pu ON r.patient_id = pu.id AND pu.deleted_at IS NULL
       LEFT JOIN users pru ON r.provider_id = pru.id AND pru.deleted_at IS NULL
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
router.put("/:id", requireAuth, requireRole("admin"), validateParam("integer"), validate("updateRequest"), async (req, res, next) => {
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
router.delete("/:id", requireAuth, requireRole("admin"), validateParam("integer"), async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      "DELETE FROM requests WHERE id = $1",
      [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// PATCH /:id — partial update request (admin only, allows null values)
router.patch("/:id", requireAuth, requireRole("admin"), validateParam("integer"), validate("patchRequest"), async (req, res, next) => {
  try {
    const data = req.validated;
    const fields = ["patient_id", "provider_id", "service", "status", "date"];
    const setClauses = [];
    const params = [];
    let idx = 1;

    for (const f of fields) {
      if (f in data) {
        setClauses.push(`${f} = $${idx++}`);
        params.push(data[f]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE requests SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
