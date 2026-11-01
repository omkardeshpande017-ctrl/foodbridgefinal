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

// Retry with exponential backoff. A cold container, a database still starting or
// a serverless cold start all benefit from a few attempts before giving up.
export async function connectDBWithRetry({ attempts = 4, baseDelayMs = 400 } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (isDbConnected()) return true;
    try {
      const ok = await connectDB();
      if (ok) return true;
    } catch (e) {
      lastError = e;
    }
    if (attempt < attempts) {
      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(`MongoDB attempt ${attempt}/${attempts} failed, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  if (lastError) console.error('MongoDB connection failed:', lastError.message);
  return isDbConnected();
}

// Never echo credentials. Only the scheme, host list and database name.
export function describeMongoUri(uri = process.env.MONGO_URI) {
  if (!uri) return 'not set';
  try {
    const parsed = new URL(uri);
    const hosts = (parsed.host || '').replace(/:[^@]*@/, '@');
    return `${parsed.protocol}//${parsed.username ? '***@' : ''}${hosts}${parsed.pathname || ''}`;
  } catch {
    return 'set (unparseable)';
  }
}
