const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const cors = require("cors");
const express = require("express");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const ensureDatabaseReady = require("./config/runtime");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
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
  if (
    !origin ||
    allowedOrigins.length === 0 ||
    allowedOrigins.includes(origin)
  ) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isVercelPreview =
      allowVercelPreviews &&
      protocol === "https:" &&
      hostname.endsWith(".vercel.app");

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
  }),
);
app.use(express.json({ limit: "12mb" }));

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("JSON parsing error:", err);
    return res.status(400).json({
      message: "Invalid JSON format in request body",
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
  next(err);
});

app.use("/api", (_req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
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
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res
    .status(404)
    .json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  // Duplicate key error
  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate data already exists.",
      fields: error.keyValue,
    });
  }

  // MongoDB connection error
  if (error.name === "MongoServerSelectionError") {
    console.error("MongoDB Connection Error:", error.message);
    return res.status(503).json({
      message: "Database connection failed. Please try again.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : "Check MongoDB Atlas IP whitelist and network access settings.",
    });
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      message: "Validation failed",
      errors: messages,
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid authentication token",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Authentication token expired",
    });
  }

  // CORS errors
  if (error.message.includes("CORS")) {
    return res.status(403).json({
      message: "CORS error: Origin not allowed",
    });
  }

  // Generic error
  console.error("Unhandled Error:", error);
  res.status(error.status || error.statusCode || 500).json({
    message: error.message || "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
});

module.exports = app;
