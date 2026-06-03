require("./config/env");

const app = require("./app");
const ensureDatabaseReady = require("./config/runtime");

const port = process.env.PORT || 5000;

function bootstrap() {
  if (!process.env.MONGODB_URI) {
    console.warn(
      "Database initialization skipped: MONGODB_URI is missing. Add it to Satkhirar-Amm---backend/.env when you want live database data.",
    );
  } else {
    ensureDatabaseReady().catch((error) => {
      console.error("Database initialization failed:", error.message);
    });
  }

  const server = app.listen(port, () => {
    console.log(`Satkhirar Amm API listening on http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Stop the running server or set PORT to a different value.`,
      );
      return;
    }

    console.error("Server startup failed:", error.message);
  });
}

bootstrap();
