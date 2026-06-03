const mongoose = require("mongoose");

let connectionPromise;
<<<<<<< HEAD
const defaultSelectionTimeout = 5000;

function getServerSelectionTimeoutMs() {
  const configuredTimeout = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS);

  if (!Number.isFinite(configuredTimeout) || configuredTimeout <= 0) {
    return defaultSelectionTimeout;
  }

  return Math.min(configuredTimeout, defaultSelectionTimeout);
}
=======
const defaultSelectionTimeout = 10000;
>>>>>>> fc0b854eb8b6c0ba784dd456eca9c797d59dfe21

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to your backend .env file.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB_NAME || undefined,
        serverSelectionTimeoutMS: getServerSelectionTimeoutMs(),
      })
      .catch((error) => {
        connectionPromise = undefined;
        const message = [
          "MongoDB connection failed.",
          "If this is deployed on Vercel, MongoDB Atlas Network Access must allow Vercel's serverless IPs; for most hobby deployments use 0.0.0.0/0.",
          "For local testing, add your current public IP to Atlas Network Access.",
          `Original error: ${error.message}`,
        ].join(" ");

        const connectionError = new Error(message);
        connectionError.statusCode = 503;
        throw connectionError;
      });
  }

  await connectionPromise;

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = connectDB;
