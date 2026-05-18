const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const cors = require("cors");
const express = require("express");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const ensureDatabaseReady = require("./config/runtime");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowVercelPreviews =
  process.env.ALLOW_VERCEL_PREVIEWS === "true" ||
  (process.env.ALLOW_VERCEL_PREVIEWS !== "false" && process.env.VERCEL === "1");

function isOriginAllowed(origin) {
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isVercelPreview =
      allowVercelPreviews && protocol === "https:" && hostname.endsWith(".vercel.app");

    return isLocalhost || isVercelPreview;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "8mb" }));

app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.get("/", (_req, res) => {
  res.json({
    name: "Satkhirar Amm API",
    status: "running",
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/health/db", async (_req, res, next) => {
  try {
    await ensureDatabaseReady();
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.use(async (_req, _res, next) => {
  try {
    await ensureDatabaseReady();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate data already exists.",
      fields: error.keyValue,
    });
  }

  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || "Server error",
  });
});

module.exports = app;
