require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { pool } = require("./db");
const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");
const statsRoutes = require("./routes/stats");

const app = express();
app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : 0);

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

app.use(express.json({ limit: "2mb" }));

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: pool.isMock ? "connected (local-dev)" : "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/stats", statsRoutes);

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
app.listen(PORT, () => {
  console.log(`SUKO backend listening on port ${PORT}`);
});
