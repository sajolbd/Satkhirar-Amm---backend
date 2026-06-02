const mongoose = require("mongoose");

let connectionPromise;
const defaultSelectionTimeout = 10000;

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
        serverSelectionTimeoutMS: Number(
          process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || defaultSelectionTimeout
        ),
      })
      .catch((error) => {
        connectionPromise = undefined;
        const message = [
          "MongoDB connection failed.",
          "If you use MongoDB Atlas, add your current public IP to Network Access > IP Access List.",
          "For local testing you can temporarily allow 0.0.0.0/0 in Atlas.",
          `Original error: ${error.message}`,
        ].join(" ");

        throw new Error(message);
      });
  }

  await connectionPromise;

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = connectDB;
