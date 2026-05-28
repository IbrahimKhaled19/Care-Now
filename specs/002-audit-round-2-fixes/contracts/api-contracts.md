# API Contracts

**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-27

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

## Sort Parameters

All list endpoints accept optional:
- `sort` (string) — column name from allowed whitelist per endpoint
- `order` (string) — `asc` or `desc`, default `desc`

---

## New Endpoint Contracts

### GET /api/transactions/:id

**Auth**: Owner (patient_id or provider_id = req.user.id) or admin
**Params**: `:id` — text, validated as min 1 char
**Response**: 200 with transaction object, or 403/404

### GET /api/withdrawals/:id

**Auth**: Owner (user_id = req.user.id) or admin
**Params**: `:id` — text, validated as min 1 char
**Response**: 200 with withdrawal object, or 403/404

### DELETE /api/patients/:id

**Auth**: Admin only
**Params**: `:id` — UUID
**Action**: `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`
**Audit**: Inserts into audit_log
**Response**: 204 No Content, or 404

### POST /api/patients/:id/restore

**Auth**: Admin only
**Params**: `:id` — UUID
**Action**: `UPDATE users SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL`
**Audit**: Inserts into audit_log
**Response**: 200 with restored patient, or 404

### DELETE /api/providers/:id

Same pattern as patients DELETE.

### POST /api/providers/:id/restore

Same pattern as patients restore.

### POST /api/wallets

**Auth**: Admin only
**Body**: `{ id, user_id, balance, on_hold, earnings, type, status }`
**Validation**: createWallet schema
**Response**: 201 with wallet object

### PATCH /api/wallets/:id

**Auth**: Admin only
**Body**: Partial wallet fields (all nullable)
**Response**: 200 with updated wallet, or 404

### DELETE /api/wallets/:id

**Auth**: Admin only
**Response**: 204 No Content, or 404

### GET /api/requests/export

**Auth**: Authenticated
**Query**: Same filters as GET /api/requests (status, search)
**Response**: `Content-Type: text/csv`, `Content-Disposition: attachment`
**Columns**: id, patient_name, provider_name, service, status, date, created_at

### GET /api/transactions/export

Same pattern. Columns: id, patient_name, provider_name, service, amount, status, date

### GET /api/providers/export

Same pattern. Columns: id, name, specialty, credentials, rating, status

### GET /api/patients/export

Same pattern. Columns: id, name, email, location, status, date_joined

### GET /api/search?q=term

**Auth**: Authenticated
**Query**: `q` (string, min 2 chars)
**Response**:
```json
{
  "patients": [{ "id", "name", "type": "patient" }],
  "providers": [{ "id", "name", "type": "provider" }],
  "requests": [{ "id", "service", "type": "request" }],
  "transactions": [{ "id", "service", "type": "transaction" }]
}
```
Limits: max 5 results per entity type.

---

## Cache Headers

No new cache headers in this round. Existing analytics cache (5min) unchanged.
