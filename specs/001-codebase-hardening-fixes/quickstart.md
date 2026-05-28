# Quickstart: Implementing Codebase Hardening Fixes

**Spec**: [spec.md](../spec.md)
**Plan**: [plan.md](../plan.md)

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (Neon cloud or local)
- Clerk account with webhook configured
- Access to Railway (backend) and Netlify (frontend) deployments

---

## Step 1: Create Migration File

Create `backend/src/db/migrations/002_hardening.sql`:

```sql
-- Soft-delete columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_requests_date ON requests(date);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_transactions_patient ON transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_providers_rating ON providers(rating DESC);

-- FK safety (optional, soft-delete makes this less critical)
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_patient_id_fkey;
ALTER TABLE requests ADD CONSTRAINT requests_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_provider_id_fkey;
ALTER TABLE requests ADD CONSTRAINT requests_provider_id_fkey
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE SET NULL;
```

Run: `npm run migrate`

---

## Step 2: Backend — Create Shared Utilities

### `backend/src/lib/query-builder.js`

```js
function buildWhere(conditions) {
  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function paginatedQuery(db, dataQuery, dataParams, countQuery, countParams, page, limit) {
  const [data, countResult] = await Promise.all([
    db.query(dataQuery, dataParams),
    db.query(countQuery, countParams),
  ]);
  const total = parseInt(countResult.rows[0].count);
  return {
    data: data.rows,
    meta: { total, page, limit, hasMore: page * limit < total },
  };
}

function buildFilters({ status, search, searchFields, roleFilter, paramStart = 1 }) {
  const conditions = [];
  const params = [];
  let idx = paramStart;

  if (roleFilter) {
    conditions.push(`${roleFilter.column} = $${idx++}`);
    params.push(roleFilter.value);
  }

  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  if (search && searchFields?.length) {
    const clauses = searchFields.map(f => `${f} ILIKE $${idx}`);
    conditions.push(`(${clauses.join(" OR ")})`);
    params.push(`%${search}%`);
    idx++;
  }

  return { conditions, params, nextIdx: idx };
}

module.exports = { buildWhere, parsePagination, paginatedQuery, buildFilters };
```

---

## Step 3: Backend — Add Middleware

### `backend/src/middleware/validate.js` — add param validation

```js
const paramSchemas = {
  uuid: z.object({ id: z.string().uuid("Invalid ID format") }),
  integer: z.object({ id: z.string().regex(/^\d+$/, "ID must be a positive integer").transform(Number) }),
  text: z.object({ id: z.string().min(1, "ID required") }),
};

function validateParam(schemaName) {
  return (req, res, next) => {
    const schema = paramSchemas[schemaName];
    if (!schema) return next();
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid ID format", details: result.error.issues });
    }
    req.params = result.data;
    next();
  };
}
```

### `backend/src/middleware/auth.js` — add ownership check

```js
function requireOwnership(getOwnerId) {
  return async (req, res, next) => {
    if (req.user?.role === "admin" || req.user?.role === "moderator") return next();
    const ownerId = await getOwnerId(req);
    if (!ownerId || ownerId !== req.user?.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}
```

---

## Step 4: Backend — Update Routes

For each route file:
1. Add `validateParam` to `/:id` routes
2. Add `requireOwnership` to GET `/:id` routes
3. Replace raw arrays with `{ data, meta }` envelope using `paginatedQuery`
4. Add `WHERE deleted_at IS NULL` to user queries
5. Change `router.put` to `router.patch` for partial updates
6. Return 204 for DELETE endpoints

Example for `providers.js` GET /:
```js
const { buildWhere, parsePagination, paginatedQuery, buildFilters } = require("../lib/query-builder");
const { validateParam } = require("../middleware/validate");
const { requireOwnership } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res, next) => {
  const { status, search } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  const { conditions, params, nextIdx } = buildFilters({
    status, search,
    searchFields: ["u.full_name", "p.specialty", "p.credentials"],
    paramStart: 1,
  });

  conditions.push("u.deleted_at IS NULL");
  const where = buildWhere(conditions);

  const dataQuery = `
    SELECT u.id, u.full_name AS name, p.specialty, p.visits, p.credentials,
           p.accept_rate, p.rating, u.status,
           COALESCE(u.avatar_url, p.avatar) AS avatar
    FROM providers p JOIN users u ON p.id = u.id
    ${where} ORDER BY u.full_name LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`;
  const dataParams = [...params, limit, offset];

  const countQuery = `
    SELECT COUNT(*) FROM providers p JOIN users u ON p.id = u.id ${where}`;

  const result = await paginatedQuery(db, dataQuery, dataParams, countQuery, params, page, limit);
  res.json(result);
});
```

---

## Step 5: Frontend — React Query Setup

### `client/src/main.jsx`

```jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

### `client/src/hooks/useApi.js` — rewrite with React Query

```js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

function useListQuery(key, path, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", filters.page);
  if (filters.limit) params.set("limit", filters.limit);
  const qs = params.toString() ? `?${params.toString()}` : "";

  return useQuery({
    queryKey: [key, filters],
    queryFn: () => api.get(`${path}${qs}`),
  });
}

export function useRequests(filters) { return useListQuery("requests", "/requests", filters); }
export function useProviders(filters) { return useListQuery("providers", "/providers", filters); }
export function usePatients(filters) { return useListQuery("patients", "/patients", filters); }
export function useTransactions(filters) { return useListQuery("transactions", "/transactions", filters); }
export function useWithdrawals(filters) { return useListQuery("withdrawals", "/withdrawals", filters); }
export function useWallets(filters) { return useListQuery("wallets", "/wallets", filters); }
export function useAdmins(filters) { return useListQuery("admins", "/admins", filters); }

export function useResource(key, path, id) {
  return useQuery({
    queryKey: [key, id],
    queryFn: () => api.get(`${path}/${id}`),
    enabled: !!id,
  });
}

export function useProvider(id) { return useResource("provider", "/providers", id); }
export function usePatient(id) { return useResource("patient", "/patients", id); }
export function useRequest(id) { return useResource("request", "/requests", id); }

// Analytics hooks (unchanged path, just useQuery)
export function useAnalyticsStats(days = 30) {
  return useQuery({
    queryKey: ["analytics-stats", days],
    queryFn: () => api.get(`/analytics/stats?days=${days}`),
    staleTime: 60_000,
  });
}
// ... similar for other analytics hooks
```

---

## Step 6: Frontend — Error Boundary

### `client/src/components/ErrorBoundary.jsx`

```jsx
import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-4">{this.state.error.message}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => this.setState({ error: null })} className="text-sm text-teal-600 underline">
                Try Again
              </button>
              <Link to="/dashboard" className="text-sm text-gray-500 underline">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Wrap in `App.jsx`:
```jsx
import ErrorBoundary from "./components/ErrorBoundary";

<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route element={<ErrorBoundary><Outlet /></ErrorBoundary>}>
    {/* all child routes */}
  </Route>
</Route>
```

---

## Step 7: Frontend — Lazy Loading

```jsx
import { lazy, Suspense } from "react";

const Analytics = lazy(() => import("./pages/Analytics"));
const Requests = lazy(() => import("./pages/Requests"));
// ... other pages

function PageSkeleton() {
  return <div className="animate-pulse bg-gray-100 rounded-xl h-[400px] m-6" />;
}

// In Routes:
<Route path="dashboard" element={<Suspense fallback={<PageSkeleton />}><Analytics /></Suspense>} />
```

---

## Step 8: Frontend — Debounce Hook

### `client/src/hooks/useDebounce.js`

```js
import { useState, useEffect } from "react";

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

Use in search components:
```jsx
const [searchInput, setSearchInput] = useState("");
const debouncedSearch = useDebounce(searchInput);
const { data } = useProviders({ search: debouncedSearch });
```

---

## Step 9: Cleanup

```bash
# Remove unused deps
cd client
npm uninstall @reduxjs/toolkit react-redux flowbite-react react-icons react-hook-form

# Delete dead file
rm src/pages/Dashboard.jsx

# Verify
npm run build
```

---

## Step 10: Backend Config Updates

### `backend/src/index.js`

```js
// Startup validation
if (process.env.MODE === "production" && !process.env.CLERK_WEBHOOK_SECRET) {
  console.error("FATAL: CLERK_WEBHOOK_SECRET required in production");
  process.exit(1);
}

// Multi-origin CORS
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",").map(o => o.trim().replace(/\/+$/, ""));

app.use(cors({
  origin: (origin, cb) => !origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error("CORS")),
  credentials: true,
}));

// Rate limiting — always enabled
const maxReq = process.env.MODE === "production" ? 100 : 1000;
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: maxReq }));

// Configurable trust proxy
app.set("trust proxy", parseInt(process.env.TRUST_PROXY) || 1);
```

### `backend/package.json`

```json
"start": "NODE_ENV=production node src/index.js"
```

---

## Verification

```bash
# Backend
cd backend
npm run migrate
npm run dev

# Test IDOR fix
curl http://localhost:3001/api/providers/invalid-uuid
# Should return 400

# Test pagination
curl http://localhost:3001/api/requests?page=1&limit=5
# Should return { data: [...], meta: { total, page, limit, hasMore } }

# Frontend
cd client
npm run dev
# Navigate between pages — should not see refetch in Network tab
# Type in search — should debounce (max 1 call per 300ms)
```
