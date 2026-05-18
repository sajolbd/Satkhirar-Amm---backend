const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("../src/app");
const ensureDatabaseReady = require("../src/config/runtime");

// Initialize database on server startup for Vercel
ensureDatabaseReady().catch((error) => {
  console.error("Database initialization failed:", error);
});

module.exports = app;
