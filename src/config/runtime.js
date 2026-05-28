const connectDB = require("./db");
const seedDatabase = require("../utils/seedDatabase");

let readyPromise;

async function ensureDatabaseReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await connectDB();

      if (process.env.SKIP_DATABASE_SEED !== "true") {
        seedDatabase().catch((error) => {
          console.error("Database seed skipped after startup:", error.message);
        });
      }
    })().catch((error) => {
      readyPromise = undefined;
      throw error;
    });
  }

  return readyPromise;
}

module.exports = ensureDatabaseReady;
