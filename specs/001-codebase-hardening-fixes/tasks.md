# Tasks: Codebase Hardening Fixes

**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Created**: 2026-05-26
**Total Tasks**: 59

---

## Phase 1: Setup

- [x] T001 Create migration file `backend/src/db/migrations/002_hardening.sql` with soft-delete columns (users, providers, patients), audit_log table, performance indexes (requests.date, transactions.date, transactions.provider_id, transactions.patient_id, users.email, providers.rating), and FK constraint changes (ON DELETE SET NULL for requests.patient_id, requests.provider_id)
- [x] T002 Create shared query utility `backend/src/lib/query-builder.js` with buildWhere(), parsePagination(), paginatedQuery(), and buildFilters() functions

---

## Phase 2: Foundational — Secure Resource Access (US1)

**Goal**: Any authenticated user can only access their own resources. Invalid IDs return 400. Non-owners get 403.
**Test**: `GET /api/providers/invalid-uuid` returns 400. Patient A `GET /api/providers/{patient-B-uuid}` returns 403. Admin `GET /api/providers/{any-uuid}` returns 200.

- [x] T003 Add param validation schemas (uuid, integer, text) and validateParam() middleware factory in `backend/src/middleware/validate.js`
- [x] T004 Add requireOwnership(getOwnerId) middleware in `backend/src/middleware/auth.js` — admins/moderators bypass, others must match owner ID
- [x] T005 Apply validateParam("uuid") to GET /:id and PATCH /:id in `backend/src/routes/providers.js`
- [x] T006 Apply requireOwnership to GET /:id in `backend/src/routes/providers.js` — owner = providers.id
- [x] T007 Apply validateParam("uuid") and requireOwnership to GET /:id in `backend/src/routes/patients.js` — owner = patients.id
- [x] T008 Apply validateParam("integer") and requireOwnership to GET /:id in `backend/src/routes/requests.js` — owner = patient_id OR provider_id
- [x] T009 Apply validateParam("text") and requireOwnership to GET /:id in `backend/src/routes/wallets.js` — owner = wallets.user_id
- [x] T010 Apply validateParam("uuid") to GET /:id, PATCH /:id, DELETE /:id in `backend/src/routes/admins.js`

---

## Phase 3: Safe Data Deletion (US5)

**Goal**: User deletions are reversible. Clerk webhook does soft-delete, not hard delete. Audit log records all deletions.
**Test**: Clerk sends `user.deleted` webhook → user has `deleted_at` set, audit_log row created, user excluded from all list queries. Admin can restore.

- [x] T011 Fix TOCTOU race condition in `backend/src/routes/users.js` — replace SELECT COUNT(*) with pg_advisory_xact_lock for first-admin bootstrap
- [x] T012 Fix TOCTOU race condition in `backend/src/routes/clerk-webhook.js` — wrap user.created handler in advisory lock transaction
- [x] T013 Change webhook user.deleted handler in `backend/src/routes/clerk-webhook.js` — UPDATE users SET deleted_at = NOW() instead of DELETE, insert audit_log row
- [x] T014 Add WHERE deleted_at IS NULL to providers list query in `backend/src/routes/providers.js`
- [x] T015 Add WHERE deleted_at IS NULL to patients list query in `backend/src/routes/patients.js`
- [x] T016 Add WHERE u.deleted_at IS NULL to requests user joins in `backend/src/routes/requests.js`
- [x] T017 Add WHERE u.deleted_at IS NULL to transactions user joins in `backend/src/routes/transactions.js`
- [x] T018 Add WHERE u.deleted_at IS NULL to wallets user joins in `backend/src/routes/wallets.js`
- [x] T019 Add WHERE deleted_at IS NULL to admins list query in `backend/src/routes/admins.js`
- [x] T020 Add POST /api/admins/:id/restore endpoint in `backend/src/routes/admins.js` — sets deleted_at = NULL, inserts audit_log row
- [x] T020b Change DELETE /:id in `backend/src/routes/admins.js` to soft-delete (SET deleted_at = NOW()) instead of hard DELETE, insert audit_log row with action "soft_delete" and entity_type "user"

---

## Phase 4: Reliable Analytics Data (US3)

**Goal**: avgResponseTime calculated from real data (or null with insufficient_data flag). patientSatisfaction from real data or marked "coming_soon". Analytics queries parallelized.
**Test**: `GET /api/analytics/stats` returns avgResponseTime with numeric value or insufficient_data flag. No hardcoded "28 min" string.

- [x] T021 Replace hardcoded avgResponseTime in `backend/src/routes/analytics.js` — calculate from requests.created_at to requests.date difference, return null with insufficient_data flag if < 10 completed requests
- [x] T022 Replace patientSatisfaction in `backend/src/routes/analytics.js` — return { value: null, status: "coming_soon", change: null }
- [x] T023 Parallelize /stats queries in `backend/src/routes/analytics.js` — wrap current, previous, provider count in Promise.all
- [x] T024 Replace requestFilter/transactionFilter/walletFilter/withdrawalFilter helpers in `backend/src/routes/analytics.js` with calls to shared buildFilters() from query-builder.js
- [x] T025 Add cache headers to semi-static analytics endpoints in `backend/src/routes/analytics.js` — Cache-Control: public, max-age=300 to /analytics/top-providers, /analytics/transaction-types, and /analytics/earnings-over-time; Cache-Control: public, max-age=60 to /analytics/billing-summary and /analytics/status-distribution

---

## Phase 5: Efficient Data Loading (US4)

**Goal**: Pages load fast, data cached between navigation, search debounced, server-side pagination with total counts.
**Test**: Navigate Providers → Patients → back to Providers = no refetch in Network tab. Type "John" = max 2 API calls. `GET /api/requests?page=1&limit=20` returns `{ data, meta }`.

- [x] T026 Rewrite `client/src/hooks/useApi.js` — replace useApi with React Query hooks (useQuery for all list/detail hooks), handle response envelope: list hooks extract `.data` and `.meta` from response, detail hooks extract `.data` from response, return { data, isLoading, error } shape to consumers
- [x] T027 Add QueryClientProvider in `client/src/main.jsx` wrapping App with staleTime: 30000 default
- [x] T028 Create debounce hook `client/src/hooks/useDebounce.js` — useState + useEffect with setTimeout, 300ms default
- [x] T029 Integrate debounce in `client/src/ui/common/SearchFilterBar.jsx` — useDebounce on search input before calling onSearch
- [x] T030 Add server-side pagination to `client/src/ui/common/BaseTable.jsx` — accept data.meta.total, data.meta.page, data.meta.limit, remove client-side slice; show "No data" empty state when meta.total is 0; disable Next button when meta.hasMore is false; update "Showing X to Y of Z" to use meta.total instead of data.length
- [x] T031 [P] Add lazy patient/provider fetch in `client/src/pages/Requests.jsx` — gate usePatients/useProviders behind enabled: showForm
- [x] T032 [P] Replace refreshKey with queryClient.invalidateQueries in `client/src/pages/Providers.jsx`

---

## Phase 6: Resilient Frontend Experience (US2)

**Goal**: Error boundary catches render errors. API failures show error messages with retry. No infinite loading skeletons.
**Test**: Throw error in a component → error boundary shows "Try Again" + "Go to Dashboard". API failure shows error + retry button.

- [x] T034 Create error boundary component `client/src/components/ErrorBoundary.jsx` — catches render errors, shows recovery UI with Try Again button (resets state) and Go to Dashboard link
- [x] T035 Wrap root routes in ErrorBoundary in `client/src/App.jsx` — outer boundary around Routes, inner boundary around AppLayout children via Outlet
- [x] T036 [P] Add error state handling to `client/src/pages/Analytics.jsx` and DashboardStatistics — render error message with refetch button when useQuery returns error
- [x] T037 [P] Add error state handling to `client/src/pages/Providers.jsx` — render error + retry on query error
- [x] T038 [P] Add error state handling to `client/src/pages/Requests.jsx` — render error + retry on query error
- [x] T039 [P] Add error state handling to `client/src/pages/Patient.jsx` — render error + retry on query error
- [x] T040 [P] Add error state handling to billing views (`client/src/ui/Billing/TransactionsView.jsx`, WithdrawalsView.jsx, WalletsView.jsx) — render error + retry on query error

---

## Phase 7: Production-Ready Infrastructure (US6)

**Goal**: DB pool configured, indexes exist, no unused deps, code-split bundle, NODE_ENV set, rate limiting always on.
**Test**: `npm run build` shows code-split chunks. `depcheck` shows zero unused. `EXPLAIN ANALYZE` shows index usage.

- [x] T041 Configure database pool in `backend/src/config/db.js` — set max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000
- [x] T042 Remove unused client dependencies — run `npm uninstall @reduxjs/toolkit react-redux flowbite-react react-icons react-hook-form` in `client/`
- [x] T043 Add code splitting in `client/src/App.jsx` — lazy() imports for Analytics, Requests, Providers, Patient, Billing, AdminsManagement, Reports with Suspense fallback
- [x] T044 Delete dead `client/src/pages/Dashboard.jsx`
- [x] T045 Add startup webhook secret check in `backend/src/index.js` — exit(1) if MODE=production and CLERK_WEBHOOK_SECRET missing
- [x] T046 Update production scripts in `backend/package.json` — set NODE_ENV=production in start script

---

## Phase 8: Polish & Low-Priority Fixes

- [x] T047 [P] Fix ProtectedRoute in `client/src/components/ProtectedRoute.jsx` — replace raw fetch with api module, remove console.error, sanitize error messages
- [x] T048 [P] Fix duplicate avatar alias in `backend/src/routes/providers.js` — remove p.avatar from SELECT, keep only COALESCE(u.avatar_url, p.avatar) AS avatar
- [x] T049 [P] Replace motion/react with CSS transitions in components using motion (DashboardStatistics.jsx, Toast.jsx) — add .animate-fade-in keyframe, remove motion imports, npm uninstall motion if unused
- [x] T050 [P] Configurable trust proxy in `backend/src/index.js` — read from TRUST_PROXY env var with default 1
- [x] T051 [P] Multi-origin CORS in `backend/src/index.js` — split FRONTEND_URL by comma, origin callback checks array
- [x] T052 [P] Enable rate limiting in all environments in `backend/src/index.js` — remove MODE=production gate, use maxReq = production ? 100 : 1000
- [x] T053 [P] Add PATCH endpoints alongside PUT in `backend/src/routes/providers.js`, patients.js, requests.js, admins.js — PATCH allows null values, only updates provided fields. Create patch-specific Zod schemas in `backend/src/middleware/validate.js` where all fields are optional and nullable (e.g. updateProviderPatch: z.object({ full_name: z.string().min(1).max(200).nullable().optional(), specialty: z.string().nullable().optional(), ... }))
- [x] T054 [P] Add patch method to `client/src/lib/api.js`
- [x] T055 [P] Standardize DELETE status codes — change 200 { message } to 204 no body in requests.js, admins.js
- [x] T056 [P] Remove client-supplied ID from createTransaction schema in `backend/src/middleware/validate.js` — remove z.string().optional() id field
- [x] T057 [P] Move seed data from `backend/src/db/migrations/001_initial.sql` to separate `backend/src/db/seed.sql` — use INSERT ... ON CONFLICT DO NOTHING for all tables, reset sequences with setval using (SELECT COALESCE(MAX(id), 1) FROM table) instead of hardcoded values, ensure migrate.js does not auto-run seed.sql
- [x] T058 [P] Evaluate react-leaflet bundle cost — kept, already code-split into Analytics chunk, 1 file only — check DashboardMap.jsx usage, remove deps if non-critical or lazy-load
- [x] T059 [P] Add PropTypes to shared components — BaseTable, SearchFilterBar, BaseHeader, PageContainer, Button in `client/src/ui/common/` — define shape for data arrays, callback functions, and string/number props

---

## Dependencies

```
Phase 1 (Setup) → no dependencies
Phase 2 (US1 Security) → depends on T001, T002, T003, T004
Phase 3 (US5 Soft-delete) → depends on T001
Phase 4 (US3 Analytics) → depends on T002
Phase 5 (US4 Data Loading) → depends on T026, T027
Phase 6 (US2 Error Handling) → depends on T026, T027
Phase 7 (US6 Infrastructure) → independent
Phase 8 (Polish) → depends on earlier phases for context
```

## Parallel Opportunities

**Within Phase 2**: T005-T010 can all run in parallel (different files)
**Within Phase 3**: T014-T019 can all run in parallel (different files)
**Within Phase 3**: T020, T020b can run in parallel (different endpoints in same file)
**Within Phase 5**: T031, T032 can run in parallel (different files)
**Within Phase 6**: T036-T040 can all run in parallel (different files)
**Within Phase 8**: All tasks can run in parallel (different files)

## Implementation Strategy

**MVP**: Phases 1-3 (setup + security + soft-delete) — 22 tasks, delivers secure data access
**Increment 2**: Phases 4-5 (analytics + data loading) — 12 tasks, delivers real data + fast UI
**Increment 3**: Phases 6-7 (error handling + infra) — 13 tasks, delivers production readiness
**Increment 4**: Phase 8 (polish) — 12 tasks, delivers code quality
