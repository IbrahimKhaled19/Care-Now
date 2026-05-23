require("dotenv").config();
const express = require("express");
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

// CORS: restrict to frontend origin (trim trailing slash for safety)
const allowedOrigin = (
  process.env.FRONTEND_URL || "http://localhost:5173"
).replace(/\/+$/, "");
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

// Rate limiting: disabled in development
if (process.env.MODE === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  });
  app.use("/api", limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many attempts, please try again later" },
  });
  app.use("/api/users/sync", authLimiter);
}

// Body parsing with size limit
app.use(express.json({ limit: "10kb" }));

// Trust proxy (for rate limiter behind load balancer)
app.set("trust proxy", 1);

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
