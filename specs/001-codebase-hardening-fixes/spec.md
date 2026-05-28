# Specification: Codebase Hardening Fixes

**Short name**: codebase-hardening-fixes
**Created**: 2026-05-26
**Status**: Draft

---

## Overview

Fix all known security vulnerabilities, code quality issues, performance problems, and architectural weaknesses identified in the 2026-05-26 codebase audit. The audit found 5 critical, 14 high, 13 medium, and 7 low severity issues across the Care-Now healthcare operations platform — a fullstack application with a Node.js/Express/PostgreSQL backend and React frontend.

This specification covers the complete remediation of all 39 findings, organized into logical work phases that respect dependencies between fixes.

---

## User Scenarios & Testing

### Scenario 1: Secure Resource Access

**As a** patient user  
**I want** to only see my own data (requests, wallet, profile)  
**So that** other patients cannot view or modify my healthcare information

**Acceptance Criteria**:
- A patient who guesses another patient's UUID receives a 403 or 404 on `/patients/:id`, `/requests/:id`, `/wallets/:id`
- A provider who guesses another provider's UUID receives a 403 or 404 on `/providers/:id`
- Admin users retain full read access to all resources
- All `/:id` endpoints validate that the ID is a valid UUID format before querying

### Scenario 2: Resilient Frontend Experience

**As a** dashboard user  
**I want** the application to recover gracefully from errors  
**So that** a single component failure does not crash the entire application

**Acceptance Criteria**:
- When any component throws a render error, an error boundary catches it and shows a recovery UI
- The user can retry the failed operation or navigate to a working page
- API failures display user-friendly error messages instead of infinite loading skeletons
- Page navigation does not cause visible loading flicker for cached data

### Scenario 3: Reliable Analytics Data

**As an** admin user  
**I want** the analytics dashboard to show real data  
**So that** I can make informed operational decisions

**Acceptance Criteria**:
- Average response time is calculated from actual request timestamps, not hardcoded to "28 min"
- Patient satisfaction is derived from real feedback data or clearly marked as unavailable
- All analytics queries use indexed columns for performance
- Analytics data loads within 2 seconds for datasets under 10,000 records

### Scenario 4: Efficient Data Loading

**As a** user browsing lists  
**I want** pages to load quickly and data to persist between tab switches  
**So that** I don't wait for the same data repeatedly

**Acceptance Criteria**:
- Switching between Providers, Patients, and Requests tabs does not re-fetch data already loaded
- Search inputs debounce before triggering API calls (maximum 1 API call per 300ms of typing)
- Lists support server-side pagination with total counts displayed
- Initial page load completes within 3 seconds on a standard broadband connection

### Scenario 5: Safe Data Deletion

**As a** system administrator  
**I want** user deletions to be reversible and auditable  
**So that** accidental Clerk deletions do not permanently destroy healthcare records

**Acceptance Criteria**:
- User deletion uses soft-delete (marks as deleted, does not cascade destroy)
- An audit log records who was deleted, when, and by what trigger
- Soft-deleted users are excluded from normal queries but recoverable by admin action
- The destructive `DROP TABLE IF EXISTS CASCADE` migration SQL is replaced with safe, idempotent DDL

### Scenario 6: Production-Ready Infrastructure

**As a** DevOps engineer  
**I want** the application to have proper configuration, caching, and monitoring  
**So that** the system is reliable and observable in production

**Acceptance Criteria**:
- Database connection pool has explicit max, idle timeout, and connection timeout settings
- Frequently queried columns have database indexes
- API responses include appropriate cache headers for semi-static data
- No unused dependencies in either package.json

---

## Functional Requirements

### Phase 1: Critical Security & Safety Fixes

**FR-1.1**: All `/:id` endpoints must verify the authenticated user owns the requested resource or is an admin. Return 403 for unauthorized access attempts.

**FR-1.2**: All `/:id` parameters must be validated as valid UUIDs (for user/provider/patient/wallet tables) or positive integers (for requests/transactions/withdrawals) before database queries. Return 400 for malformed IDs.

**FR-1.3**: Replace the initial migration's `DROP TABLE IF EXISTS CASCADE` with safe idempotent DDL using `CREATE TABLE IF NOT EXISTS` and conditional column/constraint additions.

**FR-1.4**: Wrap the root application and each page route in React Error Boundaries with a recovery UI that offers retry and navigation options.

**FR-1.5**: Remove the TOCTOU race condition on first-admin creation by using a database-level unique constraint or advisory lock instead of `SELECT COUNT(*)`.

**FR-1.6**: Implement soft-delete for user records — add `deleted_at` timestamp column, update all queries to filter `WHERE deleted_at IS NULL`, and log deletion events to an audit table.

### Phase 2: High-Priority Fixes

**FR-2.1**: Create a standardized API response envelope: `{ data: ..., meta: { total, page, limit, hasMore } }` for list endpoints and `{ data: ... }` for single-resource endpoints.

**FR-2.2**: Add server-side pagination to all list endpoints — accept `page` and `limit` parameters, return total count, enforce a maximum limit of 100.

**FR-2.3**: Replace the custom `useApi` hook with React Query (already installed) for data fetching, caching, deduplication, and background refetching.

**FR-2.4**: Implement code splitting — lazy load all page routes using dynamic imports.

**FR-2.5**: Remove all unused dependencies: `@reduxjs/toolkit`, `react-redux`, `flowbite-react`, `react-icons`, `react-hook-form`.

**FR-2.6**: Calculate real `avgResponseTime` from request creation-to-completion timestamps. If insufficient data exists, return `null` with a "not enough data" indicator.

**FR-2.7**: Calculate real `patientSatisfaction` from actual feedback data or remove the metric and mark it as "coming soon".

**FR-2.8**: Add database indexes on: `requests.date`, `transactions.date`, `transactions.provider_id`, `transactions.patient_id`, `users.email`, `providers.rating`.

**FR-2.9**: Configure database connection pool with explicit limits: max 20 connections, idle timeout 30 seconds, connection timeout 10 seconds.

**FR-2.10**: Extract duplicated filter-building logic (conditions/params/paramIndex pattern) into a shared utility function used by all route files.

**FR-2.11**: Parallelize analytics queries using `Promise.all` where queries are independent (current stats, previous stats, provider count).

**FR-2.12**: Validate webhook secret at startup, not at request time — fail fast if `CLERK_WEBHOOK_SECRET` is missing in production.

**FR-2.13**: Add `max` cap (100) to all `limit` query parameters. Return 400 if limit exceeds max.

**FR-2.14**: Remove or redirect the dead `Dashboard.jsx` component.

### Phase 3: Medium-Priority Fixes

**FR-3.1**: Add error state handling to all data-fetching components — show error messages with retry buttons instead of infinite skeletons.

**FR-3.2**: Lazy-load the Requests page's patient and provider data — only fetch when the "New Request" form is opened.

**FR-3.3**: Add debounce (300ms) to all search/filter inputs before triggering API calls.

**FR-3.4**: Replace the `refreshKey` remount pattern with proper React Query cache invalidation.

**FR-3.5**: Add `PATCH` endpoints for partial updates that allow setting fields to `null`. Keep existing `PUT` endpoints unchanged for backward compatibility.

**FR-3.6**: Standardize HTTP status codes: 201 for resource creation, 204 for successful deletion, 422 for validation errors.

**FR-3.7**: Add HTTP cache headers (`Cache-Control`, `ETag`) to semi-static endpoints like `top-providers` and `transaction-types`.

**FR-3.8**: Update `ProtectedRoute.jsx` to use the shared `api` module instead of raw `fetch`.

**FR-3.9**: Remove duplicate `avatar` column alias in providers SELECT query.

**FR-3.10**: Remove leftover `console.error` from `ProtectedRoute.jsx` and sanitize error messages shown to users.

**FR-3.11**: Update the role-based filtering in `analytics.js` to use the same shared utility as the route files (from FR-2.10).

**FR-3.12**: Replace `motion/react` animations with CSS transitions for toast and stat card components.

**FR-3.13**: Set `NODE_ENV` in production scripts and ensure stack traces are suppressed in production.

### Phase 4: Low-Priority Fixes

**FR-4.1**: Make `trust proxy` value configurable via environment variable instead of hardcoding `1`.

**FR-4.2**: Support multiple CORS origins via comma-separated `FRONTEND_URL` environment variable.

**FR-4.3**: Enable rate limiting in all environments (remove production-only gate), with higher limits for development.

**FR-4.4**: Add `ON DELETE SET NULL` or `ON DELETE RESTRICT` with explicit error handling for foreign key constraints on `requests.patient_id` and `requests.provider_id`.

**FR-4.5**: Use database sequences properly for seed data IDs instead of explicit integer values to avoid collision risks.

**FR-4.6**: Evaluate whether `react-leaflet` + `leaflet` is worth the bundle cost for the single map component. If not critical, replace with a static map image or lighter alternative.

**FR-4.7**: Add PropTypes to all React components as a bridge until TypeScript migration.

---

## Success Criteria

**SC-1**: Zero IDOR vulnerabilities — automated test confirms that a non-admin user cannot access another user's resources by ID enumeration.

**SC-2**: Application recovers from any single component error without a full-page crash — error boundary test confirms retry and navigation work.

**SC-3**: All analytics metrics are derived from real data or explicitly marked as unavailable — no hardcoded values in analytics responses.

**SC-4**: Page navigation between major sections (Providers, Patients, Requests, Billing) does not trigger redundant API calls — confirmed by network tab inspection.

**SC-5**: Initial page load completes within 3 seconds on broadband — measured by Lighthouse performance audit.

**SC-6**: User deletion is reversible — soft-deleted users can be restored by admin action. (30-day auto-purge is a future enhancement, out of scope for this fix plan.)

**SC-7**: Database queries on indexed columns execute in under 100ms for datasets under 50,000 rows.

**SC-8**: Zero unused dependencies in both `package.json` files — confirmed by `depcheck` or equivalent tool.

**SC-9**: Search inputs trigger a maximum of 1 API call per 300ms of typing — confirmed by network tab inspection.

**SC-10**: All list endpoints return paginated results with total counts — no endpoint returns unbounded result sets.

---

## Key Entities

| Entity | Description | Changes |
|--------|-------------|---------|
| **User** | System user (admin, provider, patient) | Add `deleted_at` column, soft-delete support |
| **AuditLog** (new) | Records sensitive operations | Tracks deletions, role changes, access denials |
| **Request** | Patient care request | Add indexes on `date`, `patient_id`, `provider_id` |
| **Transaction** | Financial transaction | Add indexes on `date`, `provider_id`, `patient_id` |
| **Provider** | Healthcare provider profile | Add index on `rating` |
| **Wallet** | User financial wallet | Ownership validation on access |

---

## Assumptions

1. **React Query is the caching layer** — already installed (`@tanstack/react-query`), will replace custom `useApi` hook rather than introducing a new dependency.

2. **Soft-delete retention is 30 days** — deleted user records are purged after 30 days. This is standard for healthcare applications and can be adjusted.

3. **Maximum API page size is 100** — prevents accidental full-table dumps while supporting reasonable batch operations.

4. **Debounce delay is 300ms** — standard for search inputs, balances responsiveness with API call reduction.

5. **Error boundaries are per-route, not per-component** — wrapping at the route level provides meaningful recovery (navigate away) without over-engineering individual component boundaries.

6. **TypeScript migration is out of scope** — this spec addresses the 39 audit findings. TypeScript migration is a separate, larger initiative.

7. **Existing Clerk auth flow is preserved** — fixes build on top of the current Clerk integration, not replacing it.

8. **Neon PostgreSQL is the production database** — all index and pool configurations target PostgreSQL-compatible settings.

---

## Dependencies

- No new npm dependencies required — React Query, Lucide icons, and existing tooling cover all needs
- Requires database migration access to add indexes, columns, and constraints
- Clerk webhook configuration may need updates for soft-delete behavior
- Frontend deployment (Netlify) and backend deployment (Railway) must be coordinated for phased rollout

---

## Out of Scope

- TypeScript migration (separate initiative)
- New features or UI redesigns
- CI/CD pipeline setup
- Comprehensive test suite (follow-up to this fix plan)
- Mobile app development
- Third-party integrations beyond Clerk
