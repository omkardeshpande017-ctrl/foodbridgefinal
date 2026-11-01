import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { connectDB, connectDBWithRetry, describeMongoUri, isDbConnected } from './config/db.js';
import { securityHeaders } from './middleware/security.js';
import Setting from './models/Setting.js';

import auth from './routes/auth.js';
import donations from './routes/donations.js';
import users from './routes/users.js';
import analytics from './routes/analytics.js';
import notifications from './routes/notifications.js';
import deliveries from './routes/deliveries.js';
import ai from './routes/ai.js';
import reports from './routes/reports.js';

// ---------------------------------------------------------------------------
// Fail fast on an unsafe secret. There is no default and no demo fallback:
// a misconfigured deployment must crash instead of silently degrading.
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || '';
if (
  JWT_SECRET.length < 32 ||
  JWT_SECRET === 'foodbridge_change_this_secret' ||
  JWT_SECRET.startsWith('REPLACE_WITH') ||
  JWT_SECRET.includes('change_me')
) {
  console.error('JWT_SECRET must be a unique random secret of at least 32 characters.');
  process.exit(1);
}

// Initial administrator provisioning. Runs only when a token is supplied, so a
// fresh database can be bootstrapped once without a shell: POST /api/setup/admin
// with { token, email, password } where token === SETUP_TOKEN. After the first
// administrator exists the endpoint refuses every further call.
async function provisionAdminIfRequested() {
  const { SETUP_TOKEN, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!SETUP_TOKEN || !ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  const User = (await import('./models/User.js')).default;
  const bcrypt = (await import('bcryptjs')).default;
  const existing = await User.findOne({ role: 'admin' }).lean();
  if (existing) return;
  await User.create({
    name: 'FoodBridge Administrator',
    email: ADMIN_EMAIL.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
    role: 'admin',
    status: 'active',
    location: 'Pune',
    verification: { status: 'not_required' }
  });
  console.log('Initial administrator provisioned from environment variables');
}

const app = express();
app.disable('x-powered-by');

// CLIENT_URL may be a comma separated list of allowed origins.
// Loopback origins (localhost / 127.0.0.1 / [::1]) are always allowed: they are
// the developer's own machine, so a dev server on another port, a Docker-hosted
// frontend on :8080 or a Vite dev server on :5173 can never break the API. This
// does NOT widen exposure — a browser on the public internet cannot send an
// Origin of localhost, and every other origin still has to be listed.
const isLoopbackOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // No Origin header = curl, server-to-server or same-origin request.
      if (
        !origin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        isLoopbackOrigin(origin)
      ) {
        return cb(null, true);
      }
      // Never break a Vercel preview deployment of this project.
      if (/^https:\/\/[a-z0-9-]+(\.vercel\.app)$/i.test(origin)) return cb(null, true);
      return cb(new Error(`CORS: ${origin} is not allowed`));
    },
    credentials: true
  })
);

app.use(securityHeaders);
app.use(express.json({ limit: '5mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Lightweight in-process rate limit for the auth endpoints (brute force guard).
const attempts = new Map();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX = 40;
app.use('/api/auth', (req, res, next) => {
  if (req.method !== 'POST') return next();
  const key = `${req.ip}|${String(req.body?.email || '').toLowerCase()}`;
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, reset: now + AUTH_WINDOW_MS };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + AUTH_WINDOW_MS;
  }
  entry.count += 1;
  attempts.set(key, entry);
  if (entry.count > AUTH_MAX) {
    return res.status(429).json({ message: 'Too many attempts. Try again later.' });
  }
  if (attempts.size > 5000) attempts.clear();
  return next();
});

// Readiness: reports 503 while the database is unreachable, so orchestrators and
// uptime monitors can distinguish "process up" from "able to serve traffic".
app.get('/api/ready', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, database: ready ? 'connected' : 'disconnected' });
});

app.get('/api/version', (req, res) => {
  res.json({
    api: 'v1',
    service: 'FoodBridge API',
    version: process.env.npm_package_version || '2.2.0',
    commit: process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', async (req, res) => {
  // On a serverless host the connection is opened on demand, so probe it here.
  if (process.env.VERCEL && !isDbConnected()) {
    try {
      await connectDBWithRetry({ attempts: 3, baseDelayMs: 300 });
    } catch (e) {
      console.error('DB connection failed', e.message);
    }
  }
  // A ping is the only proof the database is really usable; readyState alone can
  // be stale on a serverless host that reused a socket pool.
  let database = 'disconnected';
  if (isDbConnected()) {
    try {
      await mongoose.connection.db.admin().command({ ping: 1 });
      database = 'connected';
    } catch (e) {
      database = 'disconnected';
      console.error('MongoDB ping failed', e.message);
    }
  }
  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'ok' : 'degraded',
    service: 'FoodBridge API',
    database,
    // Never the credentials — scheme, host and database name only.
    mongoTarget: describeMongoUri(),
    timestamp: new Date().toISOString()
  });
});

// In a serverless environment the MongoDB connection is established per
// invocation (and cached across warm ones) before any route runs. Locally the
// connection is opened once at boot, so this is a no-op there.
//
// If the database is unreachable, data routes answer 503 immediately with the
// reason. Without this a query would sit in Mongoose's command buffer until the
// platform's function timeout, and the client would only see a generic error.
if (process.env.VERCEL) {
  app.use(async (req, res, next) => {
    const isDataRoute = req.path !== '/health' && req.path !== '/ready' && req.path !== '/version';
    if (isDataRoute && !isDbConnected()) {
      try {
        await connectDBWithRetry({ attempts: 2, baseDelayMs: 300 });
      } catch (e) {
        console.error('DB connection failed', e.message);
      }
    }
    if (isDataRoute && !isDbConnected()) {
      return res.status(503).json({
        message:
          'The FoodBridge database is not reachable. Check MONGO_URI and the database network access rules.',
        database: 'disconnected'
      });
    }
    return next();
  });
}

app.use('/api/auth', auth);
app.use('/api/donations', donations);
app.use('/api/users', users);
app.use('/api/analytics', analytics);
app.use('/api/notifications', notifications);
app.use('/api/deliveries', deliveries);
app.use('/api/ai', ai);
app.use('/api/reports', reports);

// One-time administrator bootstrap (protected by SETUP_TOKEN).
app.post('/api/setup/admin', async (req, res) => {
  try {
    const setupToken = process.env.SETUP_TOKEN;
    if (!setupToken) return res.status(404).json({ message: 'Route not found' });
    if (req.body?.token !== setupToken) return res.status(403).json({ message: 'Invalid setup token' });
    const User = (await import('./models/User.js')).default;
    const bcrypt = (await import('bcryptjs')).default;
    if (await User.findOne({ role: 'admin' }).lean()) {
      return res.status(409).json({ message: 'An administrator already exists' });
    }
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email.includes('@') || password.length < 12) {
      return res.status(400).json({ message: 'A valid email and a 12+ character password are required' });
    }
    const admin = await User.create({
      name: 'FoodBridge Administrator',
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin',
      status: 'active',
      verification: { status: 'not_required' }
    });
    res.status(201).json({ created: true, email: admin.email });
  } catch (e) {
    console.error('setup admin', e);
    res.status(500).json({ message: 'Could not create the administrator' });
  }
});

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const message = /^CORS:/.test(err?.message || '') ? err.message : 'Server error';
  res.status(500).json({ message });
});

if (!process.env.VERCEL) {
  console.log('Connecting to MongoDB at', describeMongoUri());
  const connected = await connectDBWithRetry({ attempts: 5, baseDelayMs: 500 });
  if (!connected) {
    console.error('MongoDB is required. Set MONGO_URI and retry.');
    process.exit(1);
  }
  try {
    await provisionAdminIfRequested();
  } catch (e) {
    console.error('admin provisioning failed', e.message);
  }
  const port = process.env.PORT || 5001;
  app.listen(port, () => console.log(`FoodBridge API running on http://localhost:${port}`));
  process.on('unhandledRejection', (r) => console.error('[unhandledRejection]', r));
  process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));
}

export default app;
