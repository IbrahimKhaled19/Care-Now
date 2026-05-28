# Data Model Changes

**Spec**: [spec.md](../spec.md)
**Created**: 2026-05-26

---

## Modified Entities

### users

| Column | Type | Change | Notes |
|--------|------|--------|-------|
| `deleted_at` | `TIMESTAMP WITH TIME ZONE NULL` | **ADD** | Soft-delete marker. `NULL` = active. |

All existing columns unchanged.

**Query impact**: Every `SELECT` on `users` must add `WHERE deleted_at IS NULL` unless explicitly querying deleted records.

### providers

| Column | Type | Change | Notes |
|--------|------|--------|-------|
| `deleted_at` | `TIMESTAMP WITH TIME ZONE NULL` | **ADD** | Mirrors users.deleted_at for direct provider queries |

### patients

| Column | Type | Change | Notes |
|--------|------|--------|-------|
| `deleted_at` | `TIMESTAMP WITH TIME ZONE NULL` | **ADD** | Mirrors users.deleted_at for direct patient queries |

---

## New Entities

### audit_log

Records sensitive operations for compliance and debugging.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `SERIAL` | PRIMARY KEY |
| `action` | `TEXT` | NOT NULL — e.g. `soft_delete`, `restore`, `role_change`, `access_denied` |
| `entity_type` | `TEXT` | NOT NULL — e.g. `user`, `request`, `wallet` |
| `entity_id` | `TEXT` | NOT NULL — UUID or integer ID of affected entity |
| `actor_id` | `TEXT` | Nullable — clerk_user_id of who performed action |
| `details` | `JSONB` | Nullable — additional context (reason, old/new values) |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT NOW() |

**Indexes**:
- `idx_audit_log_entity` ON `(entity_type, entity_id)`
- `idx_audit_log_created` ON `(created_at DESC)`

---

## New Indexes

| Table | Column(s) | Type | Reason |
|-------|-----------|------|--------|
| `requests` | `date` | B-tree | Analytics queries filter by date range |
| `transactions` | `date` | B-tree | Analytics queries filter by date range |
| `transactions` | `provider_id` | B-tree | Role-based filtering, joins |
| `transactions` | `patient_id` | B-tree | Role-based filtering, joins |
| `users` | `email` | B-tree | Webhook user.updated lookup |
| `providers` | `rating` | B-tree DESC | Top-providers sort |

---

## Foreign Key Changes

| Table | Column | Current | New | Reason |
|-------|--------|---------|-----|--------|
| `requests` | `patient_id` | `REFERENCES users(id)` (RESTRICT) | `ON DELETE SET NULL` | Allow user soft-delete without FK violation |
| `requests` | `provider_id` | `REFERENCES users(id)` (RESTRICT) | `ON DELETE SET NULL` | Same |

Note: With soft-delete, actual `DELETE FROM users` is rare. FK change is safety net.

---

## State Transitions

### User soft-delete flow

```
Active (deleted_at = NULL)
  → Clerk sends user.deleted webhook
  → deleted_at = NOW(), audit_log entry created
  → Excluded from all normal queries
  
Soft-deleted (deleted_at != NULL)
  → Admin calls POST /api/admins/:id/restore
  → deleted_at = NULL, audit_log entry created
  → Visible again in queries
  
Soft-deleted > 30 days
  → Cleanup job (future) permanently deletes
```

### First-admin bootstrap flow

```
No users exist
  → First user.sync or webhook
  → Advisory lock acquired
  → User created with role = 'admin'
  → Lock released
  
Subsequent users
  → Must provide role (provider/patient)
  → Or admin creates them via /api/admins
```
