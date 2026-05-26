require("dotenv").config();
const express = require("express");

// Startup validation: fail fast if webhook secret missing in production
if (process.env.MODE === "production" && !process.env.CLERK_WEBHOOK_SECRET) {
  console.error("FATAL: CLERK_WEBHOOK_SECRET is required in production");
  process.exit(1);
}
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { clerkMiddleware } = require("@clerk/express");

const usersRouter = require("./routes/users");
const requestsRouter = require("./routes/requests");
const providersRouter = require("./routes/providers");
const patientsRouter = require("./routes/patients");
const transactionsRouter = require("./routes/transactions");
const withdrawalsRouter = require("./routes/withdrawals");
const walletsRouter = require("./routes/wallets");
const adminsRouter = require("./routes/admins");
const analyticsRouter = require("./routes/analytics");
const clerkWebhookRouter = require("./routes/clerk-webhook");

const app = express();
const PORT = process.env.PORT || 3001;

// --- Security middleware ---

// Helmet: CSP, HSTS, X-Frame-Options, etc.
app.use(helmet());

// CORS: support multiple origins via comma-separated FRONTEND_URL
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Rate limiting: always enabled, higher limits in dev
const maxReq = process.env.MODE === "production" ? 100 : 1000;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: maxReq,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Math.min(maxReq, 20),
  message: { error: "Too many attempts, please try again later" },
});
app.use("/api/users/sync", authLimiter);

// Body parsing with size limit
app.use(express.json({ limit: "10kb" }));

// Trust proxy (configurable via env for different deployment topologies)
app.set("trust proxy", parseInt(process.env.TRUST_PROXY) || 1);

// Clerk auth middleware
app.use(clerkMiddleware());

// --- Routes ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Clerk webhooks (raw body needed for signature verification)
app.use(
  "/api/clerk/webhook",
  express.raw({ type: "application/json" }),
  clerkWebhookRouter,
);

// All other routes (auth enforced per-route)
app.use("/api/users", usersRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/providers", providersRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/api/wallets", walletsRouter);
app.use("/api/admins", adminsRouter);
app.use("/api/analytics", analyticsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler: never leak stack traces in production
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? "Internal server error" : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Care Now API running on port ${PORT}`);
});
