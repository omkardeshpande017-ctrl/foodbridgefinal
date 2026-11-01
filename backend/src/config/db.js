import mongoose from 'mongoose';

// Mongoose keeps one connection per process; reuse it across requests so a
// serverless invocation does not open a new pool every time.
let cached = global.__foodbridgeMongoose;
if (!cached) {
  cached = global.__foodbridgeMongoose = { conn: null, promise: null };
}

// The process is a long-running server (not a serverless function) when there is
// no VERCEL marker. In that mode a missing or unreachable database is fatal at
// boot, which is handled in server.js; here it must simply report failure.
export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('MongoDB unavailable: no MONGO_URI configured');
    return false;
  }
  if (cached.conn && mongoose.connection.readyState === 1) return true;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10
      })
      .then((m) => m)
      .catch((e) => {
        cached.promise = null;
        throw e;
      });
  }
  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connected');
    return true;
  } catch (e) {
    console.warn('MongoDB unavailable:', e.message);
    return false;
  }
}

// True only when a usable connection exists. Routes use this to fail fast with a
// 503 instead of letting a query hang until the platform times out.
export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
