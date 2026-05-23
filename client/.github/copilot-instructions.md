## Purpose

Short, actionable guidance for AI code assistance in this repo (Care Now). Use this file to understand the project layout, conventions, common commands, and concrete examples so suggestions are immediately useful.

## Quick start (commands)

- Install deps: `npm install`
- Dev server: `npm run dev` (Vite)
- Build: `npm run build`
- Preview build: `npm run preview`
- Lint: `npm run lint` (uses ESLint)

## Big picture

- Vite + React single-page app. Entry: `src/main.jsx` -> renders `<App />`.
- Routing lives in `src/App.jsx` (react-router v7). Top-level layout component is `src/pages/AppLayout.jsx` which wraps protected/app pages.
- Page components: `src/pages/*` (Dashboard, Requests, Providers, Billing, Patient, Reports, Login, NotFound).
- Reusable UI pieces: `src/ui/*` (tables, headers, charts). Marketing/static components are under `src/ui/Components`.
- Static / mock content: `src/data/content.js` contains app copy, nav links (`navLinks`), `mockRequests`, and `reportTypes` used across pages.
- Assets: public assets (images) are served from `public/assets/landing_page` and referenced as `/assets/landing_page/...`.

## Key integration points & libraries

- Tailwind CSS configured and referenced via `src/index.css` (includes custom CSS variables and component layers). Follow existing utility classes.
- motion (from `motion/react`) used for animated headers (e.g., `src/ui/ProvidersHeader.jsx`).
- Charts: `recharts` used in `src/ui/*` chart components.
- Maps: `react-leaflet` and `.leaflet-container` styles in `src/index.css`.
- Note: `@reduxjs/toolkit` and `@tanstack/react-query` are in package.json but there is no `store` or react-query setup in `src/` (search before assuming app-wide usage).

## Conventions and observable patterns

- File & component naming: PascalCase for React components (e.g., `ProvidersHeader.jsx`, `AppLayout.jsx`). Pages live in `src/pages` and export default the component.
- Routing: Add pages to `src/pages` and register routes in `src/App.jsx`. Example: routes like `"/providers"` map to `src/pages/Providers`.
- Static content: Prefer updating `src/data/content.js` for copy or mock data rather than hard-coding strings inside components.
- Styling: Tailwind utility classes used everywhere; global variables and layout utilities are in `src/index.css`.

## Concrete examples to follow

- To add a page: create `src/pages/MyPage.jsx`, add a route in `src/App.jsx` and add UI components under `src/ui` if reusable.
- To supply copy for a new section: add entries to `src/data/content.js` (e.g., add a new `featureCards` object and import it where needed).
- To use an asset: put it under `public/assets/landing_page` and reference `/assets/landing_page/<file>`.

## Gotchas and immediate notes discovered

- In `src/App.jsx` the route for patient is `path="Patient"` (capital `P`) while `navLinks` in `src/data/content.js` use `"/patient"` (lowercase). Be careful: routing is case-sensitive and this may create navigation bugs — prefer lowercase paths.
- Redux and react-query are available in package.json but not wired up. If you introduce them, add a clear store/QueryClient in `src/` (convention: `src/store` or `src/query`) and wrap `<App />` in `src/main.jsx`.

## What to do when adding features

- Update `src/data/content.js` for any static mock data.
- Add new UI to `src/ui` and prefer small, focused components (many existing UI files follow that pattern: Header, Table, Charts).
- Update `src/pages/AppLayout.jsx` only for app-wide layout changes (sidebar/navigation). Keep page-scoped changes within `src/pages/*`.

## Testing & CI

- There are no test scripts or CI configs in the repo. If adding tests, follow project structure: put tests next to files or in `__tests__` and add `npm test` script.

## Where to look for more context

- Routes / app flow: `src/App.jsx`
- Layout & navigation: `src/pages/AppLayout.jsx` and `src/ui/AsideNav.jsx`
- Static content: `src/data/content.js`
- Global styles and Tailwind: `src/index.css` and project root `vite.config.js`

If anything above is unclear or you'd like the instructions to cover additional workflows (e.g., CI, deployments, tests, or local debug steps), tell me what to add and I'll iterate.
