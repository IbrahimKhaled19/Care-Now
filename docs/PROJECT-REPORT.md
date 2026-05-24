# Care Now — Full Project Report

## Overview

Healthcare operations dashboard for hospital/clinic admins. Centralizes care requests, providers, patients, billing, and analytics. Rejects legacy EHR aesthetic — targets Linear/Stripe-inspired clean design.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite 7 + Tailwind CSS 4 |
| Backend | Express 5 + Node.js |
| Database | PostgreSQL (Neon cloud) |
| Auth | Clerk (frontend + backend + webhooks) |
| Notifications | Novu (REST API + React Inbox) |
| Validation | Zod 4 |
| Charts | Recharts |
| Maps | React Leaflet |
| Animation | Motion (Framer Motion) |
| Icons | Lucide + React Icons |
| UI Kit | Flowbite React |

---

## 3rd Party Integrations

### Clerk Authentication
- `@clerk/clerk-react` (frontend) + `@clerk/express` (backend)
- 3 middleware layers: `requireAuth` → `requireRole` → `attachUser`
- Webhook handler with Svix signature verification for `user.created/updated/deleted`
- First user auto-promoted to admin (bootstrap)
- Suspended users blocked at middleware level
- `UserButton` in sidebar, `ProtectedRoute` + `RoleGuard` on frontend

### Novu Notifications
- Backend: lightweight REST wrapper at `api.novu.co/v1/events/trigger`
- Frontend: `@novu/react` Inbox component, lazy-loaded in sidebar
- 5 notification triggers: `patient-registered`, `new-request`, `request-status-changed`, `new-admin-created`, `withdrawal-status`
- Graceful degradation — never crashes if API key missing or call fails

### Neon PostgreSQL
- Cloud-hosted Postgres via `pg` pool
- Custom migration runner with `_migrations` tracking table
- 3 migrations with full seed data

---

## Key NPM Packages

**Backend:** express@5, pg, @clerk/express, zod@4, helmet, cors, express-rate-limit, svix, dotenv

**Client:** react@19, react-router-dom@7, @clerk/clerk-react, @novu/react, recharts, react-leaflet, motion, react-hook-form, tailwindcss@4, lucide-react, flowbite-react, @reduxjs/toolkit (installed, minimal use)

---

## Main Features (10 Pages)

| Page | Path | Purpose |
|------|------|---------|
| Home | `/` | Landing with Hero, Features, FAQ, About |
| Login/SignUp | `/login`, `/sign-up` | Clerk auth with role picker |
| Dashboard | `/dashboard` | Stats cards, 5 charts, map, date range picker |
| Requests | `/requests` | Care request CRUD, search/filter, status badges |
| Providers | `/providers` | Provider list, detail with services/transactions tabs |
| Patients | `/patients` | Patient list, detail with medical/transactions tabs |
| Billing | `/billing` | Transactions, Withdrawals, Wallets (3 sub-views) |
| Reports | `/report` | Report generation + CSV export |
| Admins | `/admins` | Admin/moderator CRUD (admin-only) |

**Backend: 25+ API endpoints** across 9 route files with full CRUD for all entities.

---

## Database Schema (9 tables)

`users` → `providers` (1:1), `patients` (1:1), `provider_services` (1:N), `patient_medical` (1:N), `requests` (M:N), `transactions`, `withdrawals`, `wallets`

7 enum types for roles, statuses, wallet types. Indexes on clerk_user_id, role, status, and all FKs.

---

## Strengths

1. **Security-first backend** — Helmet, CORS origin lock, rate limiting (separate thresholds for auth), 10kb body limit, no stack traces in prod
2. **Role-based SQL filtering** — every data endpoint filters at DB level, not just client-side hiding
3. **Clean auth architecture** — 3 composable middleware functions, webhook with Svix verification, auto-admin bootstrap
4. **Pragmatic state management** — Context for user profile, custom `useApi` hook for 20+ data-fetch patterns, no over-engineering
5. **Zod validation** — factory pattern `validate("createRequest")`, field-level error responses, empty string sanitization
6. **Novu graceful degradation** — fire-and-forget notifications, never blocks main flow, lazy-loaded inbox
7. **Transaction safety** — BEGIN/COMMIT/ROLLBACK with proper client release for multi-table writes
8. **Reusable component library** — BaseTable, SearchFilterBar, Toast, StatusBadge, Skeleton, PageContainer
9. **Accessibility** — skip-to-content, ARIA labels, keyboard nav, screen reader support, WCAG 2.1 AAA target
10. **Modern stack** — Express 5, React 19, Tailwind 4, Zod 4, Vite 7 — all latest majors
11. **Thoughtful design system** — DESIGN.md with named rules, anti-references, exact component specs
