require("dotenv").config();

const cors = require("cors");
const express = require("express");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const seedDatabase = require("./utils/seedDatabase");

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "8mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "Satkhirar Amm API",
    status: "running",
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
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
    return res.status(409).json({ message: "Duplicate data already exists.", fields: error.keyValue });
  }

  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || "Server error",
  });
});

async function bootstrap() {
  await connectDB();
  await seedDatabase();

  app.listen(port, () => {
    console.log(`Satkhirar Amm API listening on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
