# API Contracts

**Spec**: [spec.md](../spec.md)
**Created**: 2026-05-26

---

## Response Envelope

All list endpoints return:
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

Single resource endpoints return:
```json
{
  "data": { ... }
}
```

---

## Pagination Parameters

All list endpoints accept:
- `page` (integer, default 1, min 1)
- `limit` (integer, default 20, min 1, max 100)

---

## ID Validation

| Route pattern | Validation | Error |
|---------------|------------|-------|
| `/providers/:id` | UUID format | 400 "Invalid ID format" |
| `/patients/:id` | UUID format | 400 "Invalid ID format" |
| `/requests/:id` | Positive integer | 400 "Invalid ID format" |
| `/wallets/:id` | Text, min 1 | 400 "Invalid ID format" |
| `/transactions/:id` | Text, min 1 | 400 "Invalid ID format" |
| `/withdrawals/:id` | Text, min 1 | 400 "Invalid ID format" |
| `/admins/:id` | UUID format | 400 "Invalid ID format" |

---

## Ownership Enforcement

| Endpoint | Owner field | Admin bypass |
|----------|-------------|--------------|
| `GET /providers/:id` | `providers.id` | Yes |
| `GET /patients/:id` | `patients.id` | Yes |
| `GET /requests/:id` | `requests.patient_id` OR `requests.provider_id` | Yes |
| `GET /wallets/:id` | `wallets.user_id` | Yes |

Non-owner non-admin receives:
```json
{ "error": "Access denied" }
```
Status: 403

---

## Status Codes

| Action | Status | Body |
|--------|--------|------|
| Resource created | 201 | Resource object |
| Resource updated | 200 | Updated resource |
| Resource deleted | 204 | No body |
| Validation error | 400 | `{ "error": "...", "details": [...] }` |
| Business logic error | 422 | `{ "error": "..." }` |
| Not found | 404 | `{ "error": "..." }` |
| Unauthorized | 401 | `{ "error": "..." }` |
| Forbidden | 403 | `{ "error": "..." }` |

---

## PATCH vs PUT

- `PATCH /:id` — partial update, only provided fields updated, can set fields to null
- `PUT /:id` — deprecated, kept for backward compatibility, uses COALESCE (cannot null fields)

Request body for PATCH:
```json
{
  "full_name": "New Name",
  "specialty": null
}
```

---

## Cache Headers

| Endpoint | Cache-Control |
|----------|---------------|
| `/analytics/top-providers` | `public, max-age=300` |
| `/analytics/transaction-types` | `public, max-age=300` |
| All other endpoints | No cache |

---

## Rate Limiting

All environments:
- General: 100 requests / 15 min (production), 1000 requests / 15 min (development)
- Auth endpoints (`/users/sync`): 20 requests / 15 min

Response when exceeded:
```json
{ "error": "Too many requests, please try again later" }
```
Status: 429

---

## Analytics Response Changes

### `/analytics/stats`

Current:
```json
{
  "avgResponseTime": { "value": "28 min", "change": "-3 min" },
  "patientSatisfaction": { "value": 85.0, "change": "+2.0%" }
}
```

New:
```json
{
  "avgResponseTime": { "value": 28.5, "unit": "minutes", "change": "-3.2", "insufficient_data": false },
  "patientSatisfaction": { "value": null, "status": "coming_soon", "change": null }
}
```

Or if sufficient data exists:
```json
{
  "avgResponseTime": { "value": 28.5, "unit": "minutes", "change": "-3.2", "insufficient_data": false },
  "patientSatisfaction": { "value": 4.2, "unit": "rating", "change": "+0.3", "insufficient_data": false }
}
```
