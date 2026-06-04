const mongoose = require("mongoose");

let connectionPromise;
const defaultTimeoutMs = 5000;
const mongoUriKeys = ["MONGODB_URI", "MONGO_URI", "DATABASE_URL"];

function normalizeMongoUri(value) {
  let uri = String(value || "").trim().replace(/^['"]|['"]$/g, "");
  const assignmentMatch = uri.match(
    /^(?:MONGODB_URI|MONGO_URI|DATABASE_URL)\s*=\s*(.+)$/i,
  );

  if (assignmentMatch) {
    uri = assignmentMatch[1].trim().replace(/^['"]|['"]$/g, "");
  }

  return uri.replace(/[?&]+$/, "");
}

function getMongoDiagnostics(key, uri) {
  if (!uri) {
    return { uriEnvKey: key, uriHost: null, uriDatabase: null };
  }

  try {
    const parsedUrl = new URL(uri);

    return {
      uriEnvKey: key,
      uriHost: parsedUrl.host,
      uriDatabase: parsedUrl.pathname.replace(/^\//, "") || null,
    };
  } catch {
    return { uriEnvKey: key, uriHost: "invalid-uri", uriDatabase: null };
  }
}

function getBoundedTimeoutMs(key, fallback = defaultTimeoutMs) {
  const configuredTimeout = Number(process.env[key]);

  if (!Number.isFinite(configuredTimeout) || configuredTimeout <= 0) {
    return fallback;
  }

  return Math.min(configuredTimeout, defaultTimeoutMs);
}

function getMongoUriConfig() {
  for (const key of mongoUriKeys) {
    const uri = normalizeMongoUri(process.env[key]);

    if (uri) {
      return { key, uri };
    }
  }

  return { key: null, uri: "" };
}

async function connectDB() {
  const { key, uri } = getMongoUriConfig();

  if (!uri) {
    throw new Error(
      `${mongoUriKeys.join(
        " / ",
      )} is missing. Add your MongoDB Atlas connection string to the backend environment variables.`,
    );
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);

  if (!connectionPromise) {
    const timeoutMs = getBoundedTimeoutMs("MONGODB_SERVER_SELECTION_TIMEOUT_MS");

    connectionPromise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB_NAME || undefined,
        serverSelectionTimeoutMS: timeoutMs,
        connectTimeoutMS: getBoundedTimeoutMs("MONGODB_CONNECT_TIMEOUT_MS"),
      })
      .catch((error) => {
        connectionPromise = undefined;
        const diagnostics = getMongoDiagnostics(key, uri);
        const message = [
          "MongoDB connection failed.",
          `URI env key: ${key}.`,
          `URI host: ${diagnostics.uriHost || "missing"}.`,
          "If this is deployed on Vercel, MongoDB Atlas Network Access must allow Vercel's serverless IPs; for most hobby deployments use 0.0.0.0/0.",
          "Also confirm the same MongoDB URI is added to Vercel Production environment variables, then redeploy.",
          `Original error: ${error.message}`,
        ].join(" ");

        const connectionError = new Error(message);
        connectionError.statusCode = 503;
        connectionError.diagnostics = diagnostics;
        throw connectionError;
      });
  }

  await connectionPromise;

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  return mongoose.connection;
}

connectDB.getMongoUriConfig = getMongoUriConfig;

module.exports = connectDB;
