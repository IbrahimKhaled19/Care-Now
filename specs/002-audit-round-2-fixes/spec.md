# Specification: Audit Round 2 Fixes

**Short name**: audit-round-2-fixes
**Created**: 2026-05-27
**Status**: Draft

---

## Overview

Fix all remaining weaknesses and missing features identified in the second codebase audit (2026-05-27). The audit found 6 critical, 13 high, 26 medium, and 18 low/INFO severity issues across the Care-Now healthcare operations platform — covering backend API gaps, frontend UX problems, missing production features, accessibility, and code quality.

User confirmed no secrets were leaked (`.env` not in git history). Secrets finding excluded from scope.

This specification covers the complete remediation of all actionable findings, organized into logical work phases.

---

## User Scenarios & Testing

### Scenario 1: Complete CRUD on All Entities

**As an** admin user
**I want** to create, read, update, and delete patients, providers, transactions, and withdrawals
**So that** I can manage all healthcare operations from the dashboard

**Acceptance Criteria**:
- `GET /api/transactions/:id` returns a single transaction
- `GET /api/withdrawals/:id` returns a single withdrawal
- `DELETE /api/patients/:id` soft-deletes a patient (sets `deleted_at`, audit logged)
- `DELETE /api/providers/:id` soft-deletes a provider (sets `deleted_at`, audit logged)
- `POST /api/patients/:id/restore` restores a soft-deleted patient
- `POST /api/providers/:id/restore` restores a soft-deleted provider
- All delete/restore operations write to audit_log

### Scenario 2: Real Data on All Pages

**As a** dashboard user
**I want** every page to show real data from the database
**So that** I can trust the information I see

**Acceptance Criteria**:
- RequestDetails page shows actual distance/ETA from database or "N/A" — no hardcoded values
- Reports page download button generates and downloads a CSV/PDF report
- CredentialsList download buttons download actual credential files or show "No file attached"
- No page displays fabricated placeholder data alongside real data

### Scenario 3: Efficient List Navigation

**As a** user browsing large datasets
**I want** lists to load fast with server-side pagination and sorting
**So that** I don't wait for unnecessary data

**Acceptance Criteria**:
- All list endpoints return `{ data, meta: { total, page, limit, hasMore } }` envelope
- All table components use server-side pagination (page + limit params sent to API)
- Column headers are clickable to sort ascending/descending
- Filter state persists in URL (refreshing preserves filters)
- Maximum 100 items per page enforced server-side

### Scenario 4: Accessible Interface

**As a** user with disabilities
**I want** forms to be screen-reader accessible and dialogs to trap focus
**So that** I can use the application with assistive technology

**Acceptance Criteria**:
- All form inputs have associated `<label>` with `htmlFor`/`id` binding
- ConfirmationDialog traps keyboard focus and restores it on close
- All table rows are keyboard navigable (tabindex, role, onKeyDown)
- RoleGuard shows "Access Denied" page instead of silent redirect

### Scenario 5: Robust Data Fetching

**As a** user with an expired session
**I want** the app to redirect me to login automatically
**So that** I don't see confusing error messages

**Acceptance Criteria**:
- Global 401 handler on QueryClient redirects to login
- Token provider registered once (not duplicated across components)
- Cache invalidation uses `queryClient.invalidateQueries()` consistently (no `refreshKey` pattern)
- `RequestDetails` does not fetch full provider/patient lists just for avatars

### Scenario 6: Audit Trail Coverage

**As a** compliance officer
**I want** all data mutations logged in the audit trail
**So that** I can trace who changed what and when

**Acceptance Criteria**:
- Request creation, status change, and deletion are audit logged
- Transaction creation is audit logged
- Provider/patient profile updates are audit logged
- Withdrawal status changes are audit logged
- Role changes are audit logged

### Scenario 7: Missing API Endpoints

**As a** developer integrating with the API
**I want** consistent REST endpoints for all entities
**So that** I can build reliable integrations

**Acceptance Criteria**:
- `GET /api/transactions/:id` exists with ownership check
- `GET /api/withdrawals/:id` exists with ownership check
- `DELETE /api/patients/:id` and `DELETE /api/providers/:id` exist (admin only, soft-delete)
- `POST /api/patients/:id/restore` and `POST /api/providers/:id/restore` exist
- PUT semantics are correct (full replace) or PUT is removed in favor of PATCH only

---

## Functional Requirements

### Phase 1: Critical Fixes

**FR-1.1**: Remove `password` field from `createAdmin` and `patchAdmin` validation schemas. Auth is handled by Clerk — no password column exists in the database.

**FR-1.2**: Add test framework (Vitest for frontend, Jest or Vitest for backend) with basic integration tests for the 5 most critical endpoints: auth sync, provider list, request list, analytics stats, health check.

**FR-1.3**: Add `DELETE /api/patients/:id` endpoint — admin only, soft-delete with `deleted_at = NOW()`, audit log entry.

**FR-1.4**: Add `DELETE /api/providers/:id` endpoint — admin only, soft-delete with `deleted_at = NOW()`, audit log entry.

**FR-1.5**: Add `POST /api/patients/:id/restore` endpoint — admin only, sets `deleted_at = NULL`, audit log entry.

**FR-1.6**: Add `POST /api/providers/:id/restore` endpoint — admin only, sets `deleted_at = NULL`, audit log entry.

**FR-1.7**: Add `GET /api/transactions/:id` endpoint with ownership check (patient or provider on the transaction).

**FR-1.8**: Add `GET /api/withdrawals/:id` endpoint with ownership check (user who owns the withdrawal).

### Phase 2: API Consistency

**FR-2.1**: Migrate all list endpoints to use `paginatedQuery()` from `query-builder.js` — returns `{ data, meta: { total, page, limit, hasMore } }` envelope.

**FR-2.2**: Add `page` and `limit` query params to all list endpoints, replacing raw `offset`. Enforce max limit of 100.

**FR-2.3**: Add optional `sort` and `order` query params to list endpoints — `sort` accepts allowed column names, `order` accepts `asc` or `desc`.

**FR-2.4**: Adopt `buildFilters()` and `buildWhere()` from `query-builder.js` across all route files — eliminate duplicated filter-building logic in 7 files.

**FR-2.5**: Remove PUT endpoints on providers, patients, requests, admins. PATCH is the correct method for partial updates. Update frontend `api.js` to use `patch()` instead of `put()` for all update calls.

**FR-2.6**: Add audit logging to all data mutation endpoints:
- Request creation, status change, deletion
- Transaction creation
- Provider/patient profile updates
- Withdrawal status changes
- Role changes (admin PUT/PATCH)

**FR-2.7**: Add composite indexes: `requests(status, date)`, `transactions(status, date)`, `users(role, status, deleted_at)`, `withdrawals(status, user_id)`.

**FR-2.8**: Add `error` event handler to database pool in `config/db.js` — log error, don't crash.

**FR-2.9**: Add `WHERE u.deleted_at IS NULL` to withdrawals list query join (currently missing).

**FR-2.10**: Fix migration naming conflict — rename `002_services_medical.sql` to `003_services_medical.sql` and renumber subsequent migrations.

**FR-2.11**: Wrap migration SQL in transactions in `migrate.js` — if a migration file fails partway through, roll back.

**FR-2.12**: Improve `/api/health` endpoint — check database connectivity, return `{ status, db, timestamp }`.

**FR-2.13**: Clamp `days` analytics param to 1-365 range.

### Phase 3: Frontend Data Fetching

**FR-3.1**: Refactor all table components to use server-side pagination — pass `page` and `limit` to hooks, use `meta` from response for pagination controls.

**FR-3.2**: Fix `RequestDetails` — remove `useProviders()` and `usePatients()` fetches. Use `patient_name`/`provider_name` from the request object, or fetch individual records by ID.

**FR-3.3**: Fix cache invalidation — replace all `refreshKey` pattern usage (Patient.jsx) with `queryClient.invalidateQueries()`. Ensure all mutation callbacks invalidate the correct query keys.

**FR-3.4**: Add global 401 handler to QueryClient — on 401 error, redirect to login. Register token provider once in `ApiProvider` only, remove duplicate from `ProtectedRoute`.

**FR-3.5**: Fix `Requests.jsx` double-fetch — compute tab counts from a single API endpoint or from the already-fetched filtered data.

**FR-3.6**: Fix array identity instability — use module-level `const EMPTY = []` constant instead of inline `|| []` in table components.

### Phase 4: UX & Accessibility

**FR-4.1**: Fix RequestDetails page — remove all hardcoded placeholder data. Show real distance/ETA from database or "N/A". Remove fake notes. Fix map link.

**FR-4.2**: Implement Reports page — wire download button to backend export endpoint. Generate CSV report.

**FR-4.3**: Wire CredentialsList download buttons — download actual credential files or show "No file attached" state.

**FR-4.4**: Add `htmlFor`/`id` associations to all form labels in Requests, Providers, Patient, and AdminForm pages.

**FR-4.5**: Add focus trap to ConfirmationDialog — trap Tab/Shift+Tab within dialog, restore focus to trigger on close.

**FR-4.6**: Add keyboard navigation to RequestsTable and TransactionsView rows — `tabIndex={0}`, `role="link"`, `onKeyDown` for Enter/Space.

**FR-4.7**: Add "Access Denied" page for RoleGuard — show 403 message instead of silent redirect to `/dashboard`.

**FR-4.8**: Add consistent loading states — use `Skeleton` component in RequestDetails and ProviderDetails instead of plain text.

**FR-4.9**: Add `min` date attribute to request creation form to prevent past-date selection.

### Phase 5: Missing Features

**FR-5.1**: Add URL state sync — use `useSearchParams` for filter state (status, search, page) on all table pages. Refreshing preserves filters.

**FR-5.2**: Add column sorting to `BaseTable` — clickable column headers toggle ascending/descending sort. Pass sort state to API via `sort` and `order` query params.

**FR-5.3**: Add server-side CSV export endpoints — `GET /api/requests/export`, `GET /api/transactions/export`, `GET /api/providers/export`, `GET /api/patients/export`. Accept same filters as list endpoints.

**FR-5.4**: Add global search endpoint — `GET /api/search?q=term` searches across patients, providers, requests, transactions. Returns grouped results.

**FR-5.5**: Add wallet CRUD endpoints — `POST /api/wallets`, `PATCH /api/wallets/:id`, `DELETE /api/wallets/:id` (admin only).

### Phase 6: Code Quality

**FR-6.1**: Remove dead code — `navLinks` export in `data/content.js`.

**FR-6.2**: Rename `useIsAdmin` to `useHasAdminAccess` across all consumers (10+ files). Update function name in `UserContext.jsx`.

**FR-6.3**: Rename "Admins Management" directory to "AdminsManagement" (no space). Update all imports.

**FR-6.4**: Standardize imports — use `react-router-dom` consistently (not `react-router`).

**FR-6.5**: Add `manualChunks` to Vite config — split recharts into separate chunk.

**FR-6.6**: Add `onError` global handler to QueryClient for consistent error handling.

**FR-6.7**: Fix `ProvidersTable` useCallback dependencies — add `isAdmin`, `toast`, `handleToggleStatus` to dependency array.

---

## Success Criteria

**SC-1**: All entities have complete CRUD endpoints — zero 404s on standard REST operations.

**SC-2**: All list endpoints return paginated envelopes — zero raw array responses.

**SC-3**: All data mutation endpoints write audit log entries — zero unlogged mutations.

**SC-4**: No page displays hardcoded placeholder data — all data sourced from database or shows "N/A".

**SC-5**: All forms are screen-reader accessible — every input has an associated label.

**SC-6**: Filter state persists across page refreshes — URL contains filter parameters.

**SC-7**: Tables support column sorting — users can sort by any column ascending/descending.

**SC-8**: Expired sessions redirect to login automatically — zero confusing error messages on 401.

**SC-9**: Reports page generates downloadable reports — zero dead download buttons.

**SC-10**: Basic test coverage exists — at least 5 integration tests for critical endpoints.

---

## Key Entities

| Entity | Changes |
|--------|---------|
| **Transaction** | Add GET /:id endpoint |
| **Withdrawal** | Add GET /:id endpoint, fix soft-delete filter |
| **Patient** | Add DELETE and restore endpoints |
| **Provider** | Add DELETE and restore endpoints |
| **Wallet** | Add POST, PATCH, DELETE endpoints |
| **AuditLog** | Expand logging to cover all mutations |
| **Report** | New — CSV/PDF export capability |

---

## Assumptions

1. **PUT removal acceptable** — Frontend controls all API consumers, so removing PUT and using PATCH only is safe.
2. **Test framework is Vitest** — Already has Vite, Vitest is the natural choice for both frontend and backend.
3. **Reports are CSV** — PDF generation adds complexity. CSV is sufficient for regulatory reporting.
4. **No dark mode this round** — Deferred to separate initiative.
5. **No real-time/WebSocket** — Polling with React Query cache is sufficient for now.
6. **No file upload** — Avatar URLs and credential management deferred to separate feature.
7. **No bulk actions** — Deferred to separate feature.
8. **Migration renaming safe** — All migrations already applied, renaming files in `migrations/` directory only affects future runs.

---

## Out of Scope

- Dark mode
- Real-time/WebSocket updates
- File upload (documents, credentials)
- Bulk actions on tables
- Mobile app
- CI/CD pipeline
- TypeScript migration
