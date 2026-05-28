# Implementation Plan: Codebase Hardening Fixes

**Spec**: [spec.md](./spec.md)
**Created**: 2026-05-26
**Total Issues**: 5 critical, 14 high, 13 medium, 7 low (39 total)

---

## Technical Context

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Caching layer | React Query (already installed) | `@tanstack/react-query` in `package.json` but unused. Replace custom `useApi` hook. |
| Error boundaries | `react-error-boundary` or hand-rolled | Simple wrapper component, no new dep needed |
| ID validation | Zod `z.string().uuid()` in middleware | Already using Zod for body validation. Extend to params. |
| Pagination | `page` + `limit` with `COUNT(*)` window | PostgreSQL `COUNT(*) OVER()` or separate count query |
| Soft-delete | `deleted_at` timestamp column | Standard pattern, enables 30-day retention |
| Filter utility | Shared `buildQuery(params, conditions)` | Eliminate copy-paste across 8 route files |
| Code splitting | `React.lazy()` + `Suspense` | Built-in React, no new deps |

### Files Requiring Changes

**Backend (critical/high)**:
- `backend/src/middleware/validate.js` — add UUID/ID param validation schemas
- `backend/src/middleware/auth.js` — add ownership check helper
- `backend/src/routes/providers.js` — ownership on GET /:id, fix avatar alias, PATCH
- `backend/src/routes/patients.js` — ownership on GET /:id, PATCH
- `backend/src/routes/requests.js` — ownership on GET /:id, PATCH, 204 for DELETE
- `backend/src/routes/wallets.js` — ownership on GET /:id
- `backend/src/routes/users.js` — TOCTOU fix, soft-delete
- `backend/src/routes/clerk-webhook.js` — soft-delete, startup secret check
- `backend/src/routes/analytics.js` — real avgResponseTime, parallel queries, shared filter
- `backend/src/routes/transactions.js` — remove client ID, pagination envelope
- `backend/src/routes/withdrawals.js` — pagination envelope
- `backend/src/routes/admins.js` — pagination envelope, soft-delete
- `backend/src/config/db.js` — pool config
- `backend/src/index.js` — CORS multi-origin, rate limit always, trust proxy, NODE_ENV, startup checks
- `backend/src/db/migrations/001_initial.sql` — safe DDL
- `backend/src/db/migrations/002_hardening.sql` (new) — indexes, soft-delete columns, audit table

**Frontend (critical/high)**:
- `client/src/App.jsx` — lazy loading, error boundary
- `client/src/main.jsx` — root error boundary
- `client/src/components/ErrorBoundary.jsx` (new) — reusable error boundary
- `client/src/components/ProtectedRoute.jsx` — use api module, remove console.error
- `client/src/hooks/useApi.js` — replace with React Query hooks
- `client/src/hooks/useDebounce.js` (new) — debounce hook
- `client/src/lib/api.js` — add PATCH method, handle new response envelope
- `client/src/ui/common/BaseTable.jsx` — server-side pagination
- `client/src/ui/common/SearchFilterBar.jsx` — debounce integration
- `client/src/pages/Dashboard.jsx` — delete
- `client/src/pages/Requests.jsx` — lazy patient/provider fetch, debounce
- `client/src/pages/Providers.jsx` — replace refreshKey with query invalidation
- All page components — error state handling

**Shared utility (new)**:
- `backend/src/lib/query-builder.js` — filter/pagination helpers

---

## Phase 1: Critical Security & Safety (FR-1.1 through FR-1.6)

### Task 1.1: Add ID parameter validation middleware
**FR**: FR-1.2
**Files**: `backend/src/middleware/validate.js`

Add Zod schemas for route params:
```js
const paramSchemas = {
  uuidParam: z.object({ id: z.string().uuid("Invalid ID format") }),
  intParam: z.object({ id: z.string().regex(/^\d+$/, "ID must be a positive integer").transform(Number) }),
  textParam: z.object({ id: z.string().min(1) }),
};
```

Add `validateParam(schemaName)` middleware factory:
```js
function validateParam(schemaName) {
  return (req, res, next) => {
    const schema = paramSchemas[schemaName];
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid ID format", details: result.error.issues });
    }
    req.params = result.data;
    next();
  };
}
```

Apply to routes:
- `uuidParam`: providers/:id, patients/:id, wallets/:id, admins/:id
- `intParam`: requests/:id
- `textParam`: transactions/:id, withdrawals/:id

### Task 1.2: Add ownership check middleware
**FR**: FR-1.1
**Files**: `backend/src/middleware/auth.js`

Add `requireOwnership(getOwnerId)` middleware:
```js
function requireOwnership(getOwnerId) {
  return async (req, res, next) => {
    // Admins/moderators bypass ownership check
    if (req.user?.role === "admin" || req.user?.role === "moderator") return next();

    const ownerId = await getOwnerId(req);
    if (!ownerId || ownerId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}
```

Apply to GET /:id routes:
- `providers.js`: GET /:id — owner = provider id
- `patients.js`: GET /:id — owner = patient id
- `requests.js`: GET /:id — owner = patient_id or provider_id
- `wallets.js`: GET /:id — owner = user_id

### Task 1.3: Safe migration DDL
**FR**: FR-1.3
**Files**: `backend/src/db/migrations/001_initial.sql`

Replace `DROP TABLE IF EXISTS CASCADE` with `CREATE TABLE IF NOT EXISTS`. Move destructive drops to a separate `reset.sql` that's never run in production. Use `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object ... END $$` for enum types.

### Task 1.4: React Error Boundaries
**FR**: FR-1.4
**Files**: `client/src/components/ErrorBoundary.jsx` (new), `client/src/App.jsx`, `client/src/main.jsx`

Create `ErrorBoundary` component:
- Catches render errors
- Shows recovery UI with "Try Again" button (resets state) and "Go to Dashboard" link
- Logs error to console in dev

Wrap in `App.jsx`:
- Root boundary around entire `<Routes>`
- Per-route boundary around `<AppLayout />` children

### Task 1.5: Fix TOCTOU race condition on first admin
**FR**: FR-1.5
**Files**: `backend/src/routes/users.js`, `backend/src/routes/clerk-webhook.js`

Replace `SELECT COUNT(*)` pattern with database-level approach:
```sql
-- Add unique partial index for first-admin bootstrap
CREATE UNIQUE INDEX idx_single_bootstrap_admin ON users ((role = 'admin'))
  WHERE role = 'admin' AND clerk_user_id LIKE 'clerk_%';
```

Or use `INSERT ... ON CONFLICT` with advisory lock:
```sql
SELECT pg_advisory_xact_lock(hashtext('bootstrap_admin'));
```

For the webhook handler, use a transaction with the same advisory lock.

### Task 1.6: Implement soft-delete for users
**FR**: FR-1.6
**Files**: `backend/src/db/migrations/002_hardening.sql` (new), `backend/src/routes/clerk-webhook.js`, `backend/src/routes/users.js`, `backend/src/routes/admins.js`

New migration:
```sql
-- Add soft-delete column
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE providers ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE patients ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Audit log table
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
```

Update webhook `user.deleted`:
```js
// Instead of DELETE, soft-delete
await db.query("UPDATE users SET deleted_at = NOW() WHERE clerk_user_id = $1", [id]);
await db.query("INSERT INTO audit_log (action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4)",
  ["soft_delete", "user", id, JSON.stringify({ trigger: "clerk_webhook" })]);
```

Add `WHERE deleted_at IS NULL` to all user queries:
- `providers.js` list and detail queries
- `patients.js` list and detail queries
- `requests.js` user joins
- `transactions.js` user joins
- `wallets.js` user joins
- `admins.js` list query

Add admin endpoint to restore: `POST /api/admins/:id/restore`

---

## Phase 2: High-Priority Fixes (FR-2.1 through FR-2.14)

### Task 2.1: API response envelope + server-side pagination
**FR**: FR-2.1, FR-2.2, FR-2.13
**Files**: `backend/src/lib/query-builder.js` (new), all route files

Create shared utility:
```js
// backend/src/lib/query-builder.js
function buildWhere(conditions) {
  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function paginatedQuery(db, baseQuery, params, countQuery, countParams, page, limit) {
  const [data, countResult] = await Promise.all([
    db.query(baseQuery, params),
    db.query(countQuery, countParams),
  ]);
  const total = parseInt(countResult.rows[0].count);
  return {
    data: data.rows,
    meta: { total, page, limit, hasMore: page * limit < total },
  };
}
```

Update all list endpoints to return `{ data, meta }` instead of raw arrays.
Single-resource GET /:id endpoints return `{ data: resource }` instead of bare resource object.
Update `BaseTable.jsx` and `useApi.js` to consume the envelope.

### Task 2.2: React Query migration
**FR**: FR-2.3
**Files**: `client/src/hooks/useApi.js`, `client/src/App.jsx`, all pages

Replace `useApi` with React Query hooks:
```js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useRequests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString() ? `?${params.toString()}` : "";

  return useQuery({
    queryKey: ["requests", filters],
    queryFn: () => api.get(`/requests${qs}`),
    staleTime: 30_000, // 30 seconds
  });
}
```

Wrap app in `QueryClientProvider` in `App.jsx`.

Replace all `refreshKey` patterns with `queryClient.invalidateQueries()`.

### Task 2.3: Code splitting
**FR**: FR-2.4
**Files**: `client/src/App.jsx`

```jsx
import { lazy, Suspense } from "react";

const Analytics = lazy(() => import("./pages/Analytics"));
const Requests = lazy(() => import("./pages/Requests"));
const Providers = lazy(() => import("./pages/Providers"));
const Patient = lazy(() => import("./pages/Patient"));
const Billing = lazy(() => import("./pages/Billing"));
const AdminsManagement = lazy(() => import("./pages/AdminsManagement"));
const Reports = lazy(() => import("./pages/Reports"));

// Wrap routes in <Suspense fallback={<PageSkeleton />}>
```

### Task 2.4: Remove unused dependencies
**FR**: FR-2.5
**Files**: `client/package.json`

```bash
npm uninstall @reduxjs/toolkit react-redux flowbite-react react-icons react-hook-form
```

Verify `react-leaflet` usage — if only `DashboardMap.jsx` uses it and map isn't critical, remove or lazy-load the map component.

### Task 2.5: Fix analytics to use real data
**FR**: FR-2.6, FR-2.7
**Files**: `backend/src/routes/analytics.js`

Replace hardcoded `avgResponseTime`:
```sql
-- Calculate from request created_at to first status change to in_progress
SELECT COALESCE(
  EXTRACT(EPOCH FROM AVG(
    (SELECT MIN(created_at) FROM request_status_history WHERE request_id = r.id AND status = 'in_progress')
    - r.created_at
  )) / 60,
  0
) AS avg_response_minutes
FROM requests r
WHERE r.date >= $1 AND r.status != 'waiting';
```

If no status history table exists, approximate from `requests.date` to `requests.created_at` difference, or return `null` with `insufficient_data: true` flag.

For `patientSatisfaction`, either create a feedback table or mark as `{ value: null, status: "coming_soon" }`.

### Task 2.6: Add database indexes
**FR**: FR-2.8
**Files**: `backend/src/db/migrations/002_hardening.sql`

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_date ON requests(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_provider ON transactions(provider_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_patient ON transactions(patient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_rating ON providers(rating DESC);
```

### Task 2.7: Configure database pool
**FR**: FR-2.9
**Files**: `backend/src/config/db.js`

```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

### Task 2.8: Extract filter utility
**FR**: FR-2.10
**Files**: `backend/src/lib/query-builder.js` (new)

```js
function buildFilters({ status, search, searchFields, roleFilter }) {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (roleFilter) {
    conditions.push(`${roleFilter.column} = $${paramIdx++}`);
    params.push(roleFilter.value);
  }

  if (status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(status);
  }

  if (search && searchFields?.length) {
    const searchClauses = searchFields.map(f => `${f} ILIKE $${paramIdx}`);
    conditions.push(`(${searchClauses.join(" OR ")})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  return { conditions, params, paramIdx };
}
```

Use in all route files. Also use in `analytics.js` to eliminate duplicated filter helpers.

### Task 2.9: Parallelize analytics queries
**FR**: FR-2.11
**Files**: `backend/src/routes/analytics.js`

In `/stats`, wrap current + previous + provider count in `Promise.all`:
```js
const [current, previous, providerResult] = await Promise.all([
  db.query(currentQuery, currentParams),
  db.query(prevQuery, prevParams),
  isAdmin ? db.query(providerQuery) : Promise.resolve({ rows: [{ count: "0" }] }),
]);
```

### Task 2.10: Startup webhook secret validation
**FR**: FR-2.12
**Files**: `backend/src/index.js`

```js
if (process.env.MODE === "production" && !process.env.CLERK_WEBHOOK_SECRET) {
  console.error("FATAL: CLERK_WEBHOOK_SECRET required in production");
  process.exit(1);
}
```

### Task 2.11: Remove dead Dashboard.jsx
**FR**: FR-2.14
**Files**: `client/src/pages/Dashboard.jsx` — delete file

Verify no imports reference it (already confirmed — `App.jsx` imports `Analytics` directly for the dashboard route).

---

## Phase 3: Medium-Priority Fixes (FR-3.1 through FR-3.13)

### Task 3.1: Error state handling in components
**FR**: FR-3.1
**Files**: All page components using data fetching

With React Query migration (Task 2.2), `useQuery` returns `{ data, isLoading, error }`. Update all components to render error states:
```jsx
if (error) {
  return (
    <div className="text-center py-8">
      <p className="text-red-500 mb-3">Failed to load data</p>
      <button onClick={refetch} className="text-teal-600 underline">Retry</button>
    </div>
  );
}
```

### Task 3.2: Lazy-load Requests page data
**FR**: FR-3.2
**Files**: `client/src/pages/Requests.jsx`

Move `usePatients` and `useProviders` calls inside the form component or gate behind `showForm`:
```jsx
const { data: patients } = useQuery({
  queryKey: ["patients-list"],
  queryFn: () => api.get("/patients?limit=100"),
  enabled: showForm, // Only fetch when form is open
});
```

### Task 3.3: Search debounce
**FR**: FR-3.3
**Files**: `client/src/hooks/useDebounce.js` (new), `client/src/ui/common/SearchFilterBar.jsx`

Create debounce hook:
```js
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

Use in `SearchFilterBar` and all pages with search.

### Task 3.4: Replace refreshKey with query invalidation
**FR**: FR-3.4
**Files**: `client/src/pages/Providers.jsx`

Replace:
```js
const [refreshKey, setRefreshKey] = useState(0);
// ... setRefreshKey((k) => k + 1);
```

With:
```js
const queryClient = useQueryClient();
// After mutation success:
queryClient.invalidateQueries({ queryKey: ["providers"] });
```

### Task 3.5: PATCH for partial updates
**FR**: FR-3.5
**Files**: `backend/src/routes/providers.js`, `patients.js`, `requests.js`, `admins.js`, `client/src/lib/api.js`

Add `patch` method to `api.js`:
```js
patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
```

Add PATCH routes alongside existing PUT routes. PATCH routes:
- Only update fields explicitly provided in the request body
- Allow setting fields to `null` (unlike PUT which uses COALESCE)
- Use new patch-specific Zod schemas where all fields are optional and nullable

Keep existing PUT routes unchanged for backward compatibility.

### Task 3.6: Standardize HTTP status codes
**FR**: FR-3.6
**Files**: All route files

- POST endpoints returning `200`: change to `201`
- DELETE endpoints returning `200 { message }`: change to `204` with no body
- Validation failures: ensure `422` for business logic validation (keep `400` for format errors)

### Task 3.7: HTTP cache headers
**FR**: FR-3.7
**Files**: `backend/src/routes/analytics.js`

```js
// Semi-static endpoints
router.get("/top-providers", ..., async (req, res) => {
  res.set("Cache-Control", "public, max-age=300"); // 5 minutes
  // ... existing logic
});

router.get("/transaction-types", ..., async (req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  // ... existing logic
});
```

### Task 3.8: Fix ProtectedRoute
**FR**: FR-3.8, FR-3.10
**Files**: `client/src/components/ProtectedRoute.jsx`

Replace raw `fetch` with `api` module:
```js
import { api, setTokenProvider } from "../lib/api";
// In component:
setTokenProvider(getToken);
const data = await api.post("/users/sync", body);
```

Remove `console.error("User sync error:", err)`.
Sanitize error message shown to user.

### Task 3.9: Fix duplicate avatar alias
**FR**: FR-3.9
**Files**: `backend/src/routes/providers.js`

Remove `p.avatar` from SELECT, keep only `COALESCE(u.avatar_url, p.avatar) AS avatar`.

### Task 3.10: Shared analytics filter utility
**FR**: FR-3.11
**Files**: `backend/src/routes/analytics.js`

Replace `requestFilter()`, `transactionFilter()`, `walletFilter()`, `withdrawalFilter()` with calls to the shared `buildFilters()` from Task 2.8.

### Task 3.11: Replace motion/react with CSS
**FR**: FR-3.12
**Files**: Components using `motion` (DashboardStatistics, Toast)

Replace `motion.div` with CSS transitions:
```css
.animate-fade-in {
  animation: fadeIn 0.2s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Check if `motion` is still used elsewhere. If not, `npm uninstall motion`.

### Task 3.12: Set NODE_ENV in production
**FR**: FR-3.13
**Files**: `backend/package.json`, Railway config

Update start script:
```json
"start": "NODE_ENV=production node src/index.js"
```

Or set `NODE_ENV=production` in Railway environment variables.

---

## Phase 4: Low-Priority Fixes (FR-4.1 through FR-4.7)

### Task 4.1: Configurable trust proxy
**FR**: FR-4.1
**Files**: `backend/src/index.js`

```js
app.set("trust proxy", parseInt(process.env.TRUST_PROXY) || 1);
```

### Task 4.2: Multi-origin CORS
**FR**: FR-4.2
**Files**: `backend/src/index.js`

```js
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map(o => o.trim().replace(/\/+$/, ""));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
```

### Task 4.3: Rate limiting in all environments
**FR**: FR-4.3
**Files**: `backend/src/index.js`

Remove `if (process.env.MODE === "production")` gate. Use higher limits in dev:
```js
const maxRequests = process.env.MODE === "production" ? 100 : 1000;
```

### Task 4.4: Foreign key constraints
**FR**: FR-4.4
**Files**: `backend/src/db/migrations/002_hardening.sql`

```sql
-- Update FK constraints to handle user deletion
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_patient_id_fkey;
ALTER TABLE requests ADD CONSTRAINT requests_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_provider_id_fkey;
ALTER TABLE requests ADD CONSTRAINT requests_provider_id_fkey
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE SET NULL;
```

### Task 4.5: Seed data sequence safety
**FR**: FR-4.5
**Files**: `backend/src/db/migrations/001_initial.sql`

Move seed data to separate `seed.sql`. Use `INSERT ... ON CONFLICT DO NOTHING`. Ensure sequence reset uses `(SELECT COALESCE(MAX(id), 1) FROM requests)`.

### Task 4.6: Evaluate leaflet bundle cost
**FR**: FR-4.6
**Files**: Check `DashboardMap.jsx` usage

If map is non-critical: remove `react-leaflet` + `leaflet` deps, replace with static map image or simple placeholder. If critical: lazy-load the map component.

### Task 4.7: Add PropTypes
**FR**: FR-4.7
**Files**: All React components

Add PropTypes to key shared components first:
- `BaseTable`, `SearchFilterBar`, `BaseHeader`, `PageContainer`, `Button`
- Then page-level components

---

## Execution Order

Dependencies between phases:

```
Phase 1 (Critical) — no dependencies, do first
  1.1 ID validation ──┐
  1.2 Ownership check ─┤
  1.3 Safe migration   │
  1.4 Error boundaries │
  1.5 TOCTOU fix       │
  1.6 Soft-delete ─────┘

Phase 2 (High) — depends on Phase 1
  2.1 Response envelope ──┐
  2.2 React Query ────────┤── depends on 2.1 (envelope format)
  2.3 Code splitting      │
  2.4 Remove deps         │
  2.5 Fix analytics       │
  2.6 DB indexes          │
  2.7 Pool config         │
  2.8 Filter utility ─────┤── do before 2.9, 2.10
  2.9 Parallel analytics ─┘
  2.10 Startup validation
  2.11 Remove dead code

Phase 3 (Medium) — depends on Phase 2
  3.1 Error states ──────── depends on 2.2 (React Query)
  3.2 Lazy data ─────────── depends on 2.2
  3.3 Search debounce
  3.4 Query invalidation ── depends on 2.2
  3.5 PATCH semantics ───── depends on 2.1
  3.6 Status codes
  3.7 Cache headers
  3.8 Fix ProtectedRoute
  3.9 Fix avatar alias
  3.10 Shared analytics ─── depends on 2.8
  3.11 Replace motion
  3.12 NODE_ENV

Phase 4 (Low) — independent
  All tasks independent of each other
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Response envelope breaks frontend | High — all pages depend on data shape | Update frontend hooks and backend in same commit |
| React Query migration regression | High — all data fetching changes | Migrate one hook at a time, test each |
| Soft-delete breaks existing queries | High — all user lookups affected | Add `WHERE deleted_at IS NULL` to all queries atomically |
| Migration runs against prod | Critical — data loss | Safe DDL only, separate seed file, migration runner guards |
| COALESCE → null-allowing PATCH | Medium — existing clients may break | Keep PUT as-is, add PATCH as new method alongside |

---

## Verification Checklist

After all phases:
- [ ] `GET /api/providers/:id` returns 403 for non-owner non-admin
- [ ] `GET /api/requests/:id` returns 400 for invalid ID format
- [ ] `GET /api/requests?page=1&limit=20` returns `{ data, meta }` envelope
- [ ] `GET /api/requests?limit=999999` caps at 100
- [ ] React Query caches data across page navigation
- [ ] Error boundary catches render errors and shows recovery UI
- [ ] `avgResponseTime` is computed from real data or returns null
- [ ] Search "John" triggers <= 2 API calls
- [ ] `npm run build` shows code-split chunks
- [ ] `depcheck` shows zero unused dependencies
- [ ] `EXPLAIN ANALYZE` on indexed queries shows index usage
- [ ] Soft-deleted users excluded from all queries
- [ ] Clerk webhook `user.deleted` does soft-delete, not hard delete
- [ ] `DROP TABLE IF EXISTS` removed from production migration
