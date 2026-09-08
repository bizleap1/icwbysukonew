require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { pool, initDatabase } = require("./db");
const path = require("path");
const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");
const statsRoutes = require("./routes/stats");
const paymentsRoutes = require("./routes/payments");
const productsRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");
const couponsRoutes = require("./routes/coupons");
const reviewsRoutes = require("./routes/reviews");
const cartRoutes = require("./routes/cart");
const broadcastsRoutes = require("./routes/broadcasts");
const settingsRoutes = require("./routes/settings");

const { securityHeaders, requestLogger } = require("./middleware/security");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();
app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : 0);

// Global Security Headers & Request Logger
app.use(securityHeaders);
app.use(requestLogger);

// CORS: allow local development and storefront domain(s)
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const defaultAllowed = [
  "https://www.indiancorporatewear.com",
  "https://indiancorporatewear.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173"
];

const allowedOrigins = Array.from(new Set([...defaultAllowed, ...configuredOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, mobile, health checks)
      if (!origin) return callback(null, true);
      
      // Allow any localhost / 127.0.0.1 port in development/testing
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      // Allow Vercel deployments and custom domain
      const isVercelOrCustom = origin.endsWith(".vercel.app") || origin.includes("indiancorporatewear.com");
      if (isLocalhost || isVercelOrCustom || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Root health & ping handler (Render health checks & uptime monitors)
app.all("/", (req, res) => {
  res.status(200).json({
    brand: "SUKO Atelier",
    service: "SUKO Luxury E-Commerce & Atelier API",
    status: "online",
    version: "1.0.0",
    health: "/health"
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: pool.isMock ? "connected (local-dev)" : "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// Rate limiting on all /api routes
app.use("/api", apiLimiter);

// Serve static uploaded assets
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/broadcasts", broadcastsRoutes);
app.use("/api/admin/send-email", broadcastsRoutes);
app.use("/api/settings", settingsRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`SUKO backend listening on port ${PORT}`);
  try {
    await initDatabase();
  } catch (err) {
    console.error("Startup database initialization error:", err.message);
  }
});
