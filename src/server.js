const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("./app");
const ensureDatabaseReady = require("./config/runtime");

const port = process.env.PORT || 5000;

function bootstrap() {
  ensureDatabaseReady().catch((error) => {
    console.error("Database initialization failed:", error.message);
  });

  app.listen(port, () => {
    console.log(`Satkhirar Amm API listening on http://localhost:${port}`);
  });
}

bootstrap();
