# Tasks: Audit Round 2 Fixes

**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Created**: 2026-05-27
**Total Tasks**: 74

---

## Phase 1: Setup & Foundation

- [x] T001 Remove `password` field from `createAdmin` and `patchAdmin` Zod schemas in `backend/src/middleware/validate.js`
- [x] T002 Add Vitest to backend — install `vitest`, create `backend/vitest.config.js`, add `"test": "vitest"` script to `backend/package.json`
- [x] T003 Add `error` event handler to database pool in `backend/src/config/db.js` — `pool.on('error', (err) => console.error('Pool error:', err))`
- [x] T004 Clamp `days` analytics param to 1-365 range in `backend/src/routes/analytics.js`
- [x] T005 Add `WHERE u.deleted_at IS NULL` to withdrawals list query join in `backend/src/routes/withdrawals.js`
- [x] T006 Improve `/api/health` endpoint in `backend/src/index.js` — query `SELECT 1` to verify DB, return `{ status, db, timestamp }`
- [x] T007 Wrap migration SQL in transactions in `backend/src/db/migrate.js` — BEGIN/COMMIT per file, ROLLBACK on error
- [x] T008 Rename migration files — `002_services_medical.sql` → `003_services_medical.sql`, `003_user_avatar.sql` → `004_user_avatar.sql`, `004_requests_updated_at.sql` → `005_requests_updated_at.sql`

---

## Phase 2: US1 — Complete CRUD on All Entities

**Goal**: Admin can create, read, update, delete, and restore all entities
**Test**: `GET /api/transactions/:id` returns 200 for owner. `DELETE /api/patients/:id` returns 204 + audit log entry.

- [x] T009 [P] [US1] Add `GET /api/transactions/:id` with ownership check in `backend/src/routes/transactions.js` — validateParam("text"), attachUser, requireOwnership on patient_id or provider_id
- [x] T010 [P] [US1] Add `GET /api/withdrawals/:id` with ownership check in `backend/src/routes/withdrawals.js` — validateParam("text"), attachUser, requireOwnership on user_id
- [x] T011 [P] [US1] Add `DELETE /api/patients/:id` soft-delete in `backend/src/routes/patients.js` — admin only, SET deleted_at = NOW(), audit log
- [x] T012 [P] [US1] Add `POST /api/patients/:id/restore` in `backend/src/routes/patients.js` — admin only, SET deleted_at = NULL, audit log
- [x] T013 [P] [US1] Add `DELETE /api/providers/:id` soft-delete in `backend/src/routes/providers.js` — admin only, SET deleted_at = NOW(), audit log
- [x] T014 [P] [US1] Add `POST /api/providers/:id/restore` in `backend/src/routes/providers.js` — admin only, SET deleted_at = NULL, audit log
- [x] T015 [US1] Remove PUT endpoints from `backend/src/routes/patients.js`, `providers.js`, `requests.js`, `admins.js` — PATCH only
- [x] T016 [US1] Update frontend `client/src/lib/api.js` — replace all `api.put()` calls with `api.patch()` in consumers

---

## Phase 3: US2 — Real Data on All Pages

**Goal**: No page displays hardcoded placeholder data
**Test**: RequestDetails shows real data or "N/A". Reports page downloads CSV. CredentialsList buttons work.

- [x] T017 [US2] Fix `client/src/ui/Requests/RequestDetails.jsx` — remove hardcoded distance/ETA/address/notes. Use real data from request or show "N/A". Fix map link.
- [x] T018 [US2] Fix `client/src/ui/Requests/RequestDetails.jsx` — remove `useProviders()` and `usePatients()` full-list fetches. Use individual fetch by ID for avatars.
- [x] T019 [US2] Create CSV export endpoints in `backend/src/routes/export.js` (new) — `GET /api/requests/export`, `/transactions/export`, `/providers/export`, `/patients/export`. Stream CSV with Content-Disposition header.
- [x] T020 [US2] Mount export routes in `backend/src/index.js` — add `/api/requests/export`, `/api/transactions/export`, etc.
- [x] T021 [US2] Wire Reports page download button in `client/src/ui/Reports/ReportComponent.jsx` — onClick calls export endpoint, triggers blob download
- [x] T022 [US2] Wire CredentialsList download buttons in `client/src/ui/common/CredentialsList.jsx` — if `cred.url` exists, link to it; else show "No file attached" disabled state

---

## Phase 4: US3 — Efficient List Navigation

**Goal**: Server-side pagination, sorting, URL state persistence
**Test**: All list endpoints return `{ data, meta }`. Column headers clickable. Filter state persists on refresh.

- [x] T023 [US3] Migrate `backend/src/routes/transactions.js` list endpoint to `paginatedQuery()` — returns `{ data, meta }` envelope
- [x] T024 [US3] Migrate `backend/src/routes/withdrawals.js` list endpoint to `paginatedQuery()`
- [x] T025 [US3] Migrate `backend/src/routes/wallets.js` list endpoint to `paginatedQuery()`
- [x] T026 [US3] Migrate `backend/src/routes/patients.js` list endpoint to `paginatedQuery()`
- [x] T027 [US3] Migrate `backend/src/routes/providers.js` list endpoint to `paginatedQuery()`
- [x] T028 [US3] Migrate `backend/src/routes/requests.js` list endpoint to `paginatedQuery()`
- [x] T029 [US3] Migrate `backend/src/routes/admins.js` list endpoint to `paginatedQuery()`
- [x] T030 [P] [US3] Add `sort` and `order` query params to all list endpoints — whitelist allowed columns per endpoint
- [x] T031 [P] [US3] Adopt `buildFilters()` and `buildWhere()` from `backend/src/lib/query-builder.js` in all 7 route files — eliminate duplicated conditions/params/paramIdx blocks
- [x] T032 [US3] Create composite indexes migration `backend/src/db/migrations/006_composite_indexes.sql` — requests(status,date), transactions(status,date), users(role,status,deleted_at), withdrawals(status,user_id)
- [x] T033 [US3] Refactor `client/src/ui/Requests/RequestsTable.jsx` for server-side pagination — pass page/limit to hook, use meta.total for pagination controls, use module-level EMPTY constant
- [x] T034 [P] [US3] Refactor `client/src/ui/Providers/ProvidersTable.jsx` for server-side pagination
- [x] T035 [P] [US3] Refactor `client/src/ui/Patients/PatientTable.jsx` for server-side pagination
- [x] T036 [P] [US3] Refactor `client/src/ui/Billing/TransactionsView.jsx` for server-side pagination
- [x] T037 [P] [US3] Refactor `client/src/ui/Billing/WithdrawalsView.jsx` for server-side pagination
- [x] T038 [P] [US3] Refactor `client/src/ui/Billing/WalletsView.jsx` for server-side pagination
- [x] T039 [US3] Add column sorting to `client/src/ui/common/BaseTable.jsx` — add sortKey/sortOrder/onSort props, clickable column headers with sort arrows
- [x] T040 [US3] Add URL state sync using `useSearchParams` in `client/src/pages/Providers.jsx` — status, search, page persist in URL
- [x] T041 [P] [US3] Add URL state sync in `client/src/pages/Patient.jsx`
- [x] T042 [P] [US3] Add URL state sync in `client/src/pages/Requests.jsx`

---

## Phase 5: US4 — Accessible Interface

**Goal**: Screen-reader accessible forms, focus trapping, keyboard navigation
**Test**: Every form input has htmlFor/id. Dialog traps focus. Table rows keyboard-navigable.

- [x] T043 [P] [US4] Add `htmlFor`/`id` to form labels in `client/src/pages/Requests.jsx`
- [x] T044 [P] [US4] Add `htmlFor`/`id` to form labels in `client/src/pages/Providers.jsx`
- [x] T045 [P] [US4] Add `htmlFor`/`id` to form labels in `client/src/pages/Patient.jsx`
- [x] T046 [P] [US4] Add `htmlFor`/`id` to form labels in `client/src/ui/Admins Management/AdminForm.jsx`
- [x] T047 [US4] Add focus trap to `client/src/ui/Admins Management/ConfirmationDialog.jsx` — trap Tab/Shift+Tab, restore focus on close
- [x] T048 [P] [US4] Add keyboard navigation to `client/src/ui/Requests/RequestsTable.jsx` rows — tabIndex=0, role="link", onKeyDown for Enter/Space
- [x] T049 [P] [US4] Add keyboard navigation to `client/src/ui/Billing/TransactionsView.jsx` rows
- [x] T050 [US4] Create `client/src/components/AccessDenied.jsx` (new) — 403 message with link to dashboard
- [x] T051 [US4] Update `client/src/components/RoleGuard.jsx` — render AccessDenied instead of Navigate to /dashboard
- [x] T052 [US4] Add `min` date to request creation form in `client/src/pages/Requests.jsx` — `min={new Date().toISOString().split('T')[0]}`
- [x] T053 [US4] Replace loading text with Skeleton in `client/src/ui/Requests/RequestDetails.jsx`

---

## Phase 6: US5 — Robust Data Fetching

**Goal**: Auto-redirect on 401, no duplicate fetches, consistent cache invalidation
**Test**: Expired token redirects to login. No double-fetch on Requests page. No refreshKey pattern.

- [x] T054 [US5] Add global 401 handler to QueryClient in `client/src/main.jsx` — on query/mutation 401 error, redirect to login
- [x] T055 [US5] Remove duplicate token registration in `client/src/components/ProtectedRoute.jsx` — delete setTokenProvider useEffect (ApiProvider already does it)
- [x] T056 [US5] Fix cache invalidation in `client/src/pages/Patient.jsx` — replace refreshKey pattern with queryClient.invalidateQueries({ queryKey: ['patients'] })
- [x] T057 [US5] Fix Requests double-fetch in `client/src/pages/Requests.jsx` — compute tab counts from single fetch or derive from filtered data
- [x] T058 [US5] Fix array identity in table components — use module-level `const EMPTY = []` in RequestsTable, ProvidersTable, PatientTable

---

## Phase 7: US6 — Audit Trail Coverage

**Goal**: All data mutations logged in audit_log
**Test**: Creating request, changing status, updating provider profile — all write audit_log entries.

- [x] T059 [P] [US6] Add audit logging to `backend/src/routes/requests.js` — on create, status change (PATCH), and delete
- [x] T060 [P] [US6] Add audit logging to `backend/src/routes/transactions.js` — on create
- [x] T061 [P] [US6] Add audit logging to `backend/src/routes/withdrawals.js` — on status change
- [x] T062 [P] [US6] Add audit logging to `backend/src/routes/admins.js` — on role change (PATCH)

---

## Phase 8: US7 — Missing Features

**Goal**: Global search, wallet CRUD, CSV export
**Test**: `GET /api/search?q=term` returns grouped results. Wallet POST/PATCH/DELETE work.

- [x] T063 [US7] Create global search endpoint in `backend/src/routes/search.js` (new) — `GET /api/search?q=term`, UNION across patients/providers/requests/transactions, max 5 per type
- [x] T064 [US7] Mount search route in `backend/src/index.js`
- [x] T065 [US7] Add wallet CRUD schemas to `backend/src/middleware/validate.js` — createWallet, patchWallet
- [x] T066 [US7] Add `POST /api/wallets` in `backend/src/routes/wallets.js` — admin only, audit log
- [x] T067 [US7] Add `PATCH /api/wallets/:id` in `backend/src/routes/wallets.js` — admin only, audit log
- [x] T068 [US7] Add `DELETE /api/wallets/:id` in `backend/src/routes/wallets.js` — admin only, soft-delete, audit log

---

## Phase 9: Polish & Code Quality

- [x] T069 [P] Remove dead `navLinks` export from `client/src/data/content.js`
- [x] T070 [P] Rename `useIsAdmin` to `useHasAdminAccess` in `client/src/context/UserContext.jsx` and all 10+ consumers
- [x] T071 [P] Rename directory `client/src/ui/Admins Management/` to `client/src/ui/AdminsManagement/` — update all imports
- [x] T072 [P] Fix import in `client/src/pages/AppLayout.jsx` — change `react-router` to `react-router-dom`
- [x] T073 [P] Add `manualChunks` to `client/vite.config.js` — split recharts into separate chunk
- [x] T074 [P] Fix `useCallback` dependencies in `client/src/ui/Providers/ProvidersTable.jsx` — add isAdmin, toast, handleToggleStatus to deps

---

## Dependencies

```
Phase 1 (Foundation) → no dependencies, do first
Phase 2 (US1 CRUD) → depends on T001 (password removal)
Phase 3 (US2 Real Data) → depends on T019/T020 (export endpoints)
Phase 4 (US3 Pagination) → depends on T005, T008 (foundation fixes)
Phase 5 (US4 Accessibility) → independent
Phase 6 (US5 Data Fetching) → independent
Phase 7 (US6 Audit) → depends on T001
Phase 8 (US7 Features) → depends on T065 (wallet schemas)
Phase 9 (Polish) → independent, do last
```

## Parallel Opportunities

- Phase 2: T009-T014 all parallel (different files)
- Phase 4: T023-T029 all parallel (different files), T030-T031 parallel, T033-T038 parallel, T040-T042 parallel
- Phase 5: T043-T046 parallel, T048-T049 parallel
- Phase 7: T059-T062 parallel
- Phase 9: T069-T074 all parallel

## Implementation Strategy

**MVP**: Phase 1 + Phase 2 (16 tasks) — foundation + complete CRUD
**Increment 2**: Phase 4 (13 tasks) — server-side pagination + sorting
**Increment 3**: Phase 3 + Phase 7 (10 tasks) — real data + audit trail
**Increment 4**: Phase 5 + Phase 6 (12 tasks) — accessibility + robust fetching
**Increment 5**: Phase 8 + Phase 9 (13 tasks) — features + cleanup
