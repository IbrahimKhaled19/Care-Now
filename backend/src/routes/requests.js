const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth, requireRole, attachUser, requireOwnership } = require("../middleware/auth");
const { validate, validateParam } = require("../middleware/validate");
const { parsePagination, paginatedQuery, buildFilters, buildWhere } = require("../lib/query-builder");
const { trigger } = require("../lib/novu");

const ALLOWED_SORTS = { date: "r.date", created_at: "r.created_at", status: "r.status", service: "r.service" };

// GET / — list requests with optional filters (role-based)
router.get("/", requireAuth, attachUser, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const sort = ALLOWED_SORTS[req.query.sort] || "r.created_at";
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    let roleFilter = null;
    if (req.user?.role === "provider") roleFilter = { column: "r.provider_id", value: req.user.id };
    else if (req.user?.role === "patient") roleFilter = { column: "r.patient_id", value: req.user.id };

    const { conditions, params, nextIdx } = buildFilters({
      status: req.query.status,
      search: req.query.search,
      searchFields: ["pu.full_name", "pru.full_name", "r.service"],
      roleFilter,
      statusColumn: "r.status",
    });

    const where = buildWhere(conditions);
    const from = `FROM requests r LEFT JOIN users pu ON r.patient_id = pu.id AND pu.deleted_at IS NULL LEFT JOIN users pru ON r.provider_id = pru.id AND pru.deleted_at IS NULL ${where}`;
    const cols = `r.id, r.service, r.status, r.date, r.created_at, pu.full_name AS patient_name, pru.full_name AS provider_name`;

    const result = await paginatedQuery(
      db,
      `SELECT ${cols} ${from} ORDER BY ${sort} ${order} LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
      [...params, limit, offset],
      `SELECT COUNT(*) ${from}`,
      params,
      page, limit
    );
    res.json(result);
  } catch (err) { next(err); }
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

    // Audit log
    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["create", "request", String(request.id), req.auth?.userId, JSON.stringify({ service, status: request.status, patient_id, provider_id })]
    );

    res.status(201).json(request);
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

    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["delete", "request", req.params.id, req.auth?.userId, "{}"]
    );

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

    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["update", "request", req.params.id, req.auth?.userId, JSON.stringify(data)]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
