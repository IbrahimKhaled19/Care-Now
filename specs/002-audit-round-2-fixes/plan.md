# Implementation Plan: Audit Round 2 Fixes

**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-27
**Total Issues**: 6 critical, 13 high, 26 medium, 18 low/INFO

---

## Technical Context

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Test framework | Vitest | Already Vite-based, natural fit for both frontend and backend |
| Pagination | `paginatedQuery()` from query-builder.js | Already exists, unused. Adopt everywhere. |
| Audit logging | Insert into `audit_log` table | Table exists from 002_hardening.sql, just needs more call sites |
| CSV export | Server-side streaming | `res.write()` row by row, no temp files |
| URL state | `useSearchParams` from react-router | Built-in, no new deps |
| Focus trap | Manual (no library) | Single dialog component, lightweight impl |
| Column sorting | Client-side sort header + API params | BaseTable gets `onSort` callback, parent sends to API |
| Global search | Single endpoint with UNION queries | Returns grouped { patients, providers, requests, transactions } |

### Files Requiring Changes

**Backend (30 files)**:
- `backend/src/routes/transactions.js` — add GET /:id, paginatedQuery, audit log
- `backend/src/routes/withdrawals.js` — add GET /:id, fix soft-delete join, paginatedQuery, audit log
- `backend/src/routes/wallets.js` — add POST/PATCH/DELETE, paginatedQuery
- `backend/src/routes/patients.js` — add DELETE/restore, paginatedQuery, audit log
- `backend/src/routes/providers.js` — add DELETE/restore, paginatedQuery, audit log
- `backend/src/routes/requests.js` — paginatedQuery, audit log on create/status change
- `backend/src/routes/admins.js` — audit log on role changes
- `backend/src/middleware/validate.js` — remove password field, add wallet schemas
- `backend/src/config/db.js` — add error handler
- `backend/src/db/migrate.js` — wrap in transactions
- `backend/src/index.js` — improve health endpoint, add /api/search route, add /api/*/export routes
- `backend/src/routes/search.js` (new) — global search endpoint
- `backend/src/routes/export.js` (new) — CSV export endpoints
- 7 route files — adopt buildFilters/buildWhere (eliminate duplication)

**Frontend (20 files)**:
- `client/src/ui/Requests/RequestDetails.jsx` — remove hardcoded data, fix fetches
- `client/src/ui/Requests/RequestsTable.jsx` — server-side pagination, keyboard nav
- `client/src/ui/Providers/ProvidersTable.jsx` — server-side pagination, fix useCallback
- `client/src/ui/Patients/PatientTable.jsx` — server-side pagination
- `client/src/pages/Patient.jsx` — replace refreshKey, add htmlFor
- `client/src/pages/Requests.jsx` — add htmlFor, min date
- `client/src/pages/Providers.jsx` — add htmlFor
- `client/src/ui/Billing/TransactionsView.jsx` — server-side pagination, keyboard nav
- `client/src/ui/common/BaseTable.jsx` — add sort support
- `client/src/ui/common/CredentialsList.jsx` — wire download or show "No file attached"
- `client/src/components/RoleGuard.jsx` — show 403 page
- `client/src/components/ProtectedRoute.jsx` — remove duplicate token registration
- `client/src/main.jsx` — add global 401 handler
- `client/src/context/UserContext.jsx` — rename useIsAdmin
- `client/src/data/content.js` — remove navLinks
- `client/vite.config.js` — add manualChunks
- `client/src/ui/Admins Management/` — rename directory
- `client/src/components/AccessDenied.jsx` (new) — 403 page
- `client/src/App.jsx` — import changes for renamed components

**Migration (1 new)**:
- `backend/src/db/migrations/005_composite_indexes.sql` — composite indexes

---

## Phase 1: Critical Fixes (FR-1.1 — FR-1.8)

### Task 1.1: Remove password field
**FR**: FR-1.1
**Files**: `backend/src/middleware/validate.js`

Remove `password: z.string().optional()` from both `createAdmin` and `patchAdmin` schemas.

### Task 1.2: Add DELETE + restore for patients
**FR**: FR-1.3, FR-1.5
**Files**: `backend/src/routes/patients.js`

Add two routes after existing PATCH:
- `DELETE /:id` — admin only, `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, audit log
- `POST /:id/restore` — admin only, `UPDATE users SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL`, audit log

### Task 1.3: Add DELETE + restore for providers
**FR**: FR-1.4, FR-1.6
**Files**: `backend/src/routes/providers.js`

Same pattern as patients. DELETE soft-deletes, POST restore un-deletes.

### Task 1.4: Add GET /:id for transactions
**FR**: FR-1.7
**Files**: `backend/src/routes/transactions.js`

Add route with `validateParam("text")`, `attachUser`, `requireOwnership` checking patient_id or provider_id matches req.user.

### Task 1.5: Add GET /:id for withdrawals
**FR**: FR-1.8
**Files**: `backend/src/routes/withdrawals.js`

Add route with `validateParam("text")`, `attachUser`, `requireOwnership` checking user_id matches req.user.

### Task 1.6: Add Vitest + basic tests
**FR**: FR-1.2
**Files**: `backend/package.json`, `backend/vitest.config.js` (new), `backend/src/__tests__/api.test.js` (new)

Install vitest. Create 5 integration tests hitting real API:
1. GET /api/health returns 200
2. POST /api/users/sync returns needsRole or user
3. GET /api/providers returns array
4. GET /api/requests returns array
5. GET /api/analytics/stats returns stats object

---

## Phase 2: API Consistency (FR-2.1 — FR-2.13)

### Task 2.1: Migrate all list endpoints to paginatedQuery
**FR**: FR-2.1, FR-2.2
**Files**: `transactions.js`, `withdrawals.js`, `wallets.js`, `patients.js`, `providers.js`, `requests.js`, `admins.js`

For each file:
1. Import `{ parsePagination, paginatedQuery, buildFilters, buildWhere }` from query-builder
2. Replace `limit/offset` with `parsePagination(req.query)`
3. Replace `db.query(dataQuery)` with `paginatedQuery(db, dataQuery, dataParams, countQuery, countParams, page, limit)`
4. Return `{ data, meta }` instead of raw array

### Task 2.2: Add sort/order params
**FR**: FR-2.3
**Files**: Same 7 route files

Add to each list handler:
```js
const allowedSorts = { /* whitelisted columns */ };
const sort = allowedSorts[req.query.sort] || 'default_column';
const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
```
Inject `ORDER BY ${sort} ${order}` into query.

### Task 2.3: Adopt buildFilters across routes
**FR**: FR-2.4
**Files**: Same 7 route files

Replace hand-rolled `conditions/params/paramIdx` blocks with:
```js
const { conditions, params, nextIdx } = buildFilters({
  status, search, searchFields: [...],
  roleFilter: req.user ? { column: 't.provider_id', value: req.user.id } : null,
});
```

### Task 2.4: Remove PUT endpoints, keep PATCH only
**FR**: FR-2.5
**Files**: `patients.js`, `providers.js`, `requests.js`, `admins.js`

Delete all `router.put("/:id", ...)` blocks. PATCH already exists and handles the same use case.

### Task 2.5: Add audit logging to mutations
**FR**: FR-2.6
**Files**: `requests.js`, `transactions.js`, `patients.js`, `providers.js`, `withdrawals.js`, `admins.js`

After each mutation (create, update, delete, restore, status change), insert:
```js
await db.query(
  "INSERT INTO audit_log (action, entity_type, entity_id, actor_id, details) VALUES ($1, $2, $3, $4, $5)",
  [action, entityType, entityId, req.auth?.userId, JSON.stringify(details)]
);
```

### Task 2.6: Composite indexes migration
**FR**: FR-2.7
**Files**: `backend/src/db/migrations/006_composite_indexes.sql` (new)

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_status_date ON requests(status, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_date ON transactions(status, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status_deleted ON users(role, status, deleted_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_withdrawals_status_user ON withdrawals(status, user_id);
```

### Task 2.7: Pool error handler + withdrawals join fix + health check + days clamp
**FR**: FR-2.8, FR-2.9, FR-2.12, FR-2.13
**Files**: `config/db.js`, `withdrawals.js`, `index.js`, `analytics.js`

- `db.js`: Add `pool.on('error', (err) => console.error('Pool error:', err))`
- `withdrawals.js`: Add `AND u.deleted_at IS NULL` to join
- `index.js`: Health endpoint queries `SELECT 1` to verify DB
- `analytics.js`: Clamp `days` to `Math.min(365, Math.max(1, parseInt(req.query.days) || 30))`

### Task 2.8: Fix migration naming + wrap in transactions
**FR**: FR-2.10, FR-2.11
**Files**: migration files (rename), `migrate.js`

- Rename `002_services_medical.sql` → `003_services_medical.sql`, renumber 003→004, 004→005 (but 005 already exists from Task 2.6, so use 006)
- `migrate.js`: Wrap each file's SQL in `BEGIN`/`COMMIT`, `ROLLBACK` on error

---

## Phase 3: Frontend Data Fetching (FR-3.1 — FR-3.6)

### Task 3.1: Server-side pagination in all tables
**FR**: FR-3.1
**Files**: `RequestsTable.jsx`, `ProvidersTable.jsx`, `PatientTable.jsx`, `TransactionsView.jsx`, `WithdrawalsView.jsx`, `WalletsView.jsx`

For each table:
1. Add `useState` for `page` and `limit`
2. Pass `{ page, limit, ...filters }` to hook
3. Use `meta` from response for `totalPages`, `currentPage`, `hasMore`
4. Remove client-side `data.slice()` logic
5. Use `const EMPTY = []` module-level constant

### Task 3.2: Fix RequestDetails fetches
**FR**: FR-3.2
**Files**: `RequestDetails.jsx`

Remove `useProviders()` and `usePatients()`. Use `request.patient_name` and `request.provider_name` directly for display. For avatars, fetch individual records:
```js
const { data: patient } = useQuery({
  queryKey: ['patient', request?.patient_id],
  queryFn: () => api.get(`/patients/${request.patient_id}`),
  enabled: !!request?.patient_id,
});
```

### Task 3.3: Fix cache invalidation
**FR**: FR-3.3
**Files**: `Patient.jsx`

Replace `refreshKey` pattern:
```js
// Before: const [refreshKey, setRefreshKey] = useState(0); setRefreshKey(k => k + 1);
// After:
const queryClient = useQueryClient();
// After mutation success:
queryClient.invalidateQueries({ queryKey: ['patients'] });
```
Remove `key={refreshKey}` from PatientsTable.

### Task 3.4: Global 401 handler + deduplicate token registration
**FR**: FR-3.4
**Files**: `main.jsx`, `ProtectedRoute.jsx`

- `main.jsx`: Add to QueryClient defaultOptions:
```js
mutations: {
  onError: (err) => {
    if (err.message?.includes('401')) window.location.href = '/login';
  }
}
```
Add `queryCache` with onError for queries too.
- `ProtectedRoute.jsx`: Remove `setTokenProvider(getToken)` useEffect. ApiProvider already does this.

### Task 3.5: Fix Requests double-fetch
**FR**: FR-3.5
**Files**: `Requests.jsx`

Remove separate `useRequests({})` for tab counts. Use a single query with a counts endpoint, or derive counts from the filtered data by fetching once without status filter and computing counts client-side (same as current approach but single fetch).

### Task 3.6: Fix array identity
**FR**: FR-3.6
**Files**: `RequestsTable.jsx`, `ProvidersTable.jsx`, `PatientTable.jsx`

Add at top of each file:
```js
const EMPTY = [];
```
Replace `data = requests || []` with `data = requests || EMPTY`.

---

## Phase 4: UX & Accessibility (FR-4.1 — FR-4.9)

### Task 4.1: Fix RequestDetails hardcoded data
**FR**: FR-4.1
**Files**: `RequestDetails.jsx`

- Remove hardcoded "3.2 km / 12 mins", "Al Khalyfa Al Zafer St", notes text
- Show real data if available, "N/A" if not
- Fix map link: `href={request.location_url || '#'}`
- Remove "Current State" pipeline (not in DB schema) — replace with status timeline from request.status

### Task 4.2: Implement Reports download
**FR**: FR-4.2
**Files**: `ReportComponent.jsx`, `backend/src/routes/export.js` (new)

Backend: Create `GET /api/requests/export` etc. endpoints that stream CSV.
Frontend: Wire download button to `window.open()` or `fetch()` + blob download.

### Task 4.3: Wire CredentialsList
**FR**: FR-4.3
**Files**: `CredentialsList.jsx`

If `cred.url` exists, link download button to it. If not, show "No file attached" disabled state.

### Task 4.4: Form label htmlFor
**FR**: FR-4.4
**Files**: `Requests.jsx`, `Providers.jsx`, `Patient.jsx`, `AdminForm.jsx`

Add `id` to each input, add `htmlFor={id}` to each label.

### Task 4.5: Focus trap
**FR**: FR-4.5
**Files**: `ConfirmationDialog.jsx`

Add onOpen/onKeyDown handler that traps Tab/Shift+Tab within dialog. Store trigger ref, restore focus on close.

### Task 4.6: Keyboard nav on table rows
**FR**: FR-4.6
**Files**: `RequestsTable.jsx`, `TransactionsView.jsx`

Add to each `<tr onClick={...}>`:
```
tabIndex={0} role="link" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(...); }}
```

### Task 4.7: Access Denied page
**FR**: FR-4.7
**Files**: `RoleGuard.jsx`, `components/AccessDenied.jsx` (new)

Create AccessDenied component showing 403 message with link to dashboard. RoleGuard renders it instead of Navigate.

### Task 4.8: Loading skeletons
**FR**: FR-4.8
**Files**: `RequestDetails.jsx`

Replace `<p>Loading request details...</p>` with Skeleton components.

### Task 4.9: Min date on request form
**FR**: FR-4.9
**Files**: `Requests.jsx`

Add `min={new Date().toISOString().split('T')[0]}` to date input.

---

## Phase 5: Missing Features (FR-5.1 — FR-5.5)

### Task 5.1: URL state sync
**FR**: FR-5.1
**Files**: `Providers.jsx`, `Patient.jsx`, `Requests.jsx`, `AdminsManagement.jsx`

Use `useSearchParams` to read/write filter state to URL. On mount, initialize state from URL params. On change, update URL.

### Task 5.2: Column sorting
**FR**: FR-5.2
**Files**: `BaseTable.jsx`, all table consumers

Add `sortKey`, `sortOrder`, `onSort` props to BaseTable. Column headers render clickable sort arrows. Parent component sends `sort` and `order` to API.

### Task 5.3: CSV export endpoints
**FR**: FR-5.3
**Files**: `backend/src/routes/export.js` (new), `backend/src/index.js`

Create export routes that stream CSV:
```js
router.get("/requests/export", ..., async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="requests.csv"');
  // Stream rows
});
```
Mount at `/api/requests/export`, etc.

### Task 5.4: Global search endpoint
**FR**: FR-5.4
**Files**: `backend/src/routes/search.js` (new), `backend/src/index.js`

`GET /api/search?q=term` runs UNION query across patients, providers, requests, transactions. Returns `{ patients: [...], providers: [...], requests: [...], transactions: [...] }`.

### Task 5.5: Wallet CRUD
**FR**: FR-5.5
**Files**: `wallets.js`, `validate.js`

Add `createWallet`, `patchWallet` schemas. Add POST /, PATCH /:id, DELETE /:id routes (admin only).

---

## Phase 6: Code Quality (FR-6.1 — FR-6.7)

### Task 6.1: Remove dead navLinks
**FR**: FR-6.1
**Files**: `content.js`

Delete `export const navLinks = [...]` block (lines 64-72).

### Task 6.2: Rename useIsAdmin
**FR**: FR-6.2
**Files**: `UserContext.jsx` + all 10+ consumers

Rename function and all imports. Use find-and-replace across codebase.

### Task 6.3: Rename directory
**FR**: FR-6.3
**Files**: Rename `Admins Management/` → `AdminsManagement/`

Update all imports referencing the old path.

### Task 6.4: Standardize imports
**FR**: FR-6.4
**Files**: `AppLayout.jsx`

Change `import { Outlet } from "react-router"` to `import { Outlet } from "react-router-dom"`.

### Task 6.5: Vite manualChunks
**FR**: FR-6.5
**Files**: `vite.config.js`

```js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        recharts: ['recharts'],
      }
    }
  }
}
```

### Task 6.6: QueryClient global onError
**FR**: FR-6.6
**Files**: `main.jsx`

Add `queryCache` with `onError` that handles 401 → redirect to login.

### Task 6.7: Fix useCallback deps
**FR**: FR-6.7
**Files**: `ProvidersTable.jsx`

Add `isAdmin`, `toast`, `handleToggleStatus` to useCallback dependency array. Memoize `handleToggleStatus` with useCallback.

---

## Execution Order

```
Phase 1 (Critical) → independent tasks, run in parallel
Phase 2 (API) → depends on Phase 1 (paginatedQuery changes touch same files)
Phase 3 (Frontend) → depends on Phase 2 (needs { data, meta } envelope from API)
Phase 4 (UX) → independent of Phase 3, can run parallel
Phase 5 (Features) → depends on Phase 2 (needs paginatedQuery, sort params)
Phase 6 (Quality) → independent, can run any time
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| paginatedQuery changes break frontend | High | Update frontend tables in same commit |
| PUT removal breaks external consumers | Medium | Frontend is only consumer, safe to remove |
| Migration rename breaks applied tracking | Medium | All migrations already applied, rename files only |
| Directory rename breaks imports | Medium | Find-and-replace all import paths before rename |

---

## Verification Checklist

After all phases:
- [ ] `GET /api/transactions/:id` returns 200 for owner, 403 for non-owner
- [ ] `DELETE /api/patients/:id` soft-deletes and writes audit log
- [ ] All list endpoints return `{ data, meta }` envelope
- [ ] RequestDetails shows no hardcoded data
- [ ] All form inputs have htmlFor/id
- [ ] Filter state persists on page refresh
- [ ] Column sorting works on Providers table
- [ ] 401 errors redirect to login
- [ ] Reports page downloads CSV
- [ ] `navLinks` export removed
