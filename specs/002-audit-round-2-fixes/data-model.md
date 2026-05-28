# Data Model Changes

**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Created**: 2026-05-27

---

## Modified Entities

### transactions

| Column | Type | Change | Notes |
|--------|------|--------|-------|
| (no schema change) | — | Add GET /:id | Ownership check on patient_id or provider_id |

### withdrawals

| Column | Type | Change | Notes |
|--------|------|--------|-------|
| (no schema change) | — | Add GET /:id | Ownership check on user_id |
| (no schema change) | — | Fix join filter | Add `AND u.deleted_at IS NULL` to list query |

### wallets

| Column | Type | Change | Notes |
|--------|------|--------|-------|
| (no schema change) | — | Add POST/PATCH/DELETE | Admin only, audit logged |

### audit_log (expand usage)

Currently logged: admin soft-delete/restore, Clerk webhook user.deleted.
Add logging for:
- Request creation, status change, deletion
- Transaction creation
- Provider/patient profile updates (PUT/PATCH)
- Withdrawal status changes
- Role changes

---

## New Indexes (migration 005)

| Table | Columns | Type | Reason |
|-------|---------|------|--------|
| requests | (status, date) | Composite | Analytics queries filter by both |
| transactions | (status, date) | Composite | Analytics queries filter by both |
| users | (role, status, deleted_at) | Composite | Admin list + analytics |
| withdrawals | (status, user_id) | Composite | Billing summary queries |

---

## New Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/transactions/:id | Owner or admin | Single transaction |
| GET | /api/withdrawals/:id | Owner or admin | Single withdrawal |
| DELETE | /api/patients/:id | Admin | Soft-delete patient |
| POST | /api/patients/:id/restore | Admin | Restore soft-deleted patient |
| DELETE | /api/providers/:id | Admin | Soft-delete provider |
| POST | /api/providers/:id/restore | Admin | Restore soft-deleted provider |
| POST | /api/wallets | Admin | Create wallet |
| PATCH | /api/wallets/:id | Admin | Update wallet |
| DELETE | /api/wallets/:id | Admin | Soft-delete wallet |
| GET | /api/requests/export | Auth | CSV export |
| GET | /api/transactions/export | Auth | CSV export |
| GET | /api/providers/export | Auth | CSV export |
| GET | /api/patients/export | Auth | CSV export |
| GET | /api/search?q=term | Auth | Global search across entities |

---

## Migration Safety

| Migration | Action | Safety |
|-----------|--------|--------|
| 002_services_medical.sql → 003_services_medical.sql | Rename only | All already applied, rename does not re-run |
| 003_user_avatar.sql → 004_user_avatar.sql | Rename only | Same |
| 004_requests_updated_at.sql → 005_requests_updated_at.sql | Rename only | Same |
| 005_composite_indexes.sql (new) | CREATE INDEX CONCURRENTLY | Non-blocking, safe on live DB |
| migrate.js | Wrap in BEGIN/COMMIT | Prevents partial migration state |
