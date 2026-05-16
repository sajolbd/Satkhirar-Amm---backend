require("dotenv").config();

const app = require("./app");
const ensureDatabaseReady = require("./config/runtime");

const port = process.env.PORT || 5000;

async function bootstrap() {
  await ensureDatabaseReady();

  app.listen(port, () => {
    console.log(`Satkhirar Amm API listening on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
