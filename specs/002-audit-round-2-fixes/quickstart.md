# Quickstart: Audit Round 2 Fixes

**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Created**: 2026-05-27

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (Neon cloud or local)
- Clerk account with webhook configured
- Vitest installed (Phase 1 adds it)

---

## Step 1: Remove password field from admin schemas

**File**: `backend/src/middleware/validate.js`

Delete `password: z.string().optional()` from both `createAdmin` (line ~113) and `patchAdmin` (line ~173) schemas.

---

## Step 2: Add DELETE + restore to patients and providers

**Files**: `backend/src/routes/patients.js`, `backend/src/routes/providers.js`

Add after existing PATCH route in each file:

```js
// DELETE /:id — soft-delete (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), validateParam("uuid"), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["soft_delete", "user", req.params.id, req.auth.userId, "{}"]
    );
    res.status(204).send();
  } catch (err) { next(err); }
});

// POST /:id/restore — restore soft-deleted (admin only)
router.post("/:id/restore", requireAuth, requireRole("admin"), validateParam("uuid"), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "UPDATE users SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id, email, full_name, role, status",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found or not deleted" });
    await db.query(
      "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
      ["restore", "user", req.params.id, req.auth.userId, "{}"]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});
```

---

## Step 3: Add GET /:id to transactions and withdrawals

**File**: `backend/src/routes/transactions.js`

Add after GET / list handler:

```js
router.get("/:id", requireAuth, validateParam("text"), attachUser, requireOwnership(async (req) => {
  const { rows } = await db.query(
    "SELECT patient_id, provider_id FROM transactions WHERE id = $1", [req.params.id]
  );
  if (!rows[0]) return null;
  if (rows[0].patient_id === req.user.id) return req.user.id;
  if (rows[0].provider_id === req.user.id) return req.user.id;
  return null;
}), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT t.*, p.full_name AS patient_name, pr.full_name AS provider_name
       FROM transactions t
       LEFT JOIN users p ON t.patient_id = p.id
       LEFT JOIN users pr ON t.provider_id = pr.id
       WHERE t.id = $1`, [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
});
```

**File**: `backend/src/routes/withdrawals.js` — same pattern, ownership on `user_id`.

---

## Step 4: Migrate list endpoints to paginatedQuery

**Files**: All 7 route list handlers

Replace hand-rolled pagination with:

```js
const { page, limit, offset } = parsePagination(req.query);
// ... build conditions using buildFilters() ...
const where = buildWhere(conditions);

const result = await paginatedQuery(
  db,
  `SELECT ... FROM ... ${where} ORDER BY ... LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
  [...params, limit, offset],
  `SELECT COUNT(*) FROM ... ${where}`,
  params,
  page, limit
);
res.json(result);
```

---

## Step 5: Add audit logging to mutations

**Files**: `requests.js`, `transactions.js`, `withdrawals.js`, `admins.js`

After each create/update/delete/restore, insert:
```js
await db.query(
  "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
  [action, entityType, entityId, req.auth?.userId, JSON.stringify(details)]
);
```

---

## Step 6: Create composite indexes migration

**File**: `backend/src/db/migrations/005_composite_indexes.sql`

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_status_date ON requests(status, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_date ON transactions(status, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status_deleted ON users(role, status, deleted_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_withdrawals_status_user ON withdrawals(status, user_id);
```

Run: `npm run migrate`

---

## Step 7: Fix frontend — server-side pagination

**Files**: All table components

For each table:
1. Import `parsePagination` from query-builder (frontend won't have it — use inline)
2. Add `page` state, pass to hook
3. Use `meta` from response for pagination controls
4. Replace `data.slice()` with `data` directly (already paginated by API)

---

## Step 8: Fix RequestDetails hardcoded data

**File**: `client/src/ui/Requests/RequestDetails.jsx`

Remove:
- Hardcoded "3.2 km / 12 mins"
- Hardcoded "Al Khalyfa Al Zafer St"
- Hardcoded notes text
- Full provider/patient list fetches

Replace with: real data from request object or "N/A". Use individual fetches for avatars.

---

## Step 9: Fix cache invalidation + token registration

**Files**: `Patient.jsx`, `ProtectedRoute.jsx`, `main.jsx`

- Patient.jsx: Replace `refreshKey` with `queryClient.invalidateQueries({ queryKey: ['patients'] })`
- ProtectedRoute.jsx: Remove `setTokenProvider(getToken)` useEffect
- main.jsx: Add global 401 handler on QueryClient

---

## Step 10: Accessibility fixes

**Files**: Form components, ConfirmationDialog, RoleGuard, RequestsTable, TransactionsView

- Add `id` to inputs, `htmlFor` to labels
- Add focus trap to ConfirmationDialog
- Add `tabIndex={0}`, `role="link"`, `onKeyDown` to table rows
- Create AccessDenied component, use in RoleGuard instead of Navigate

---

## Step 11: Code quality cleanup

**Files**: Various

- Remove `navLinks` from `content.js`
- Rename `useIsAdmin` → `useHasAdminAccess` everywhere
- Rename `Admins Management/` → `AdminsManagement/`
- Fix `AppLayout.jsx` import from `react-router` → `react-router-dom`
- Add `manualChunks` to `vite.config.js`

---

## Verification

```bash
# Backend
cd backend
npm run migrate
npm test  # Vitest, 5 integration tests

# Frontend
cd client
npm run build  # Should pass with no errors

# Manual checks
curl http://localhost:3001/api/transactions/TXN12345  # 200 for owner
curl http://localhost:3001/api/transactions/TXN12345  # 403 for non-owner
curl -X DELETE http://localhost:3001/api/patients/<id>  # 204 + audit log
curl "http://localhost:3001/api/requests?page=1&limit=5&sort=date&order=desc"  # { data, meta }
```
