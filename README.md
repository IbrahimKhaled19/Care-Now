# Care Now

Care Now is a full-stack healthcare operations dashboard for clinic and hospital administrators. It centralizes daily workflows like requests, providers, patients, billing, reporting, and analytics.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + React Router + Clerk
- **Backend:** Node.js + Express + PostgreSQL
- **Auth:** Clerk
- **Notifications:** Novu

## Main Features

- Role-based dashboard (admin and moderator flows)
- Requests management and detailed request views
- Providers and patients management
- Billing module (transactions, withdrawals, wallets)
- Reports and analytics views
- Clerk-based authentication and protected routes

## Project Structure

```text
Care-Now/
├── client/      # React frontend (Vite)
├── backend/     # Express API
├── docs/        # Project documentation
├── PRODUCT.md   # Product vision and UX direction
└── DESIGN.md    # Design system
```

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL

## Environment Variables

### Backend (`backend/.env`)

Copy from `backend/.env.example` and update values:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `NOVU_API_KEY`
- `PORT`
- `FRONTEND_URL`

### Frontend (`client/.env`)

Copy from `client/.env.example` and update values:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_NOVU_APP_ID`
- `VITE_API_URL`

## Local Setup

### 1) Install dependencies

```bash
cd backend && npm install
cd ../client && npm install
```

### 2) Run database migrations and seed data

```bash
cd backend
npm run migrate
npm run seed
```

### 3) Start backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3001` by default.

### 4) Start frontend

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Available Scripts

### Backend

- `npm run dev` — start backend in watch mode
- `npm run start` — start backend in production mode
- `npm run migrate` — run DB migrations
- `npm run seed` — seed sample data
- `npm run test` — run backend tests

### Frontend

- `npm run dev` — start Vite dev server
- `npm run build` — build production bundle
- `npm run lint` — run ESLint
- `npm run preview` — preview production build

## Screenshots

> Existing UI assets from the project:

### Landing / Home

![Landing Page](client/public/assets/landing_page/hero.png)

### Login / Auth Related

![Forget Password](client/public/assets/landing_page/Forget_Password.png)
![Verification Code](client/public/assets/landing_page/Verification_Code.png)

### User Roles

![Provider View](client/public/provider.jpg)
![Patient View](client/public/patient.jpg)
