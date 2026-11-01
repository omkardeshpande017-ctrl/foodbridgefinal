import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';

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

const app = express();
app.disable('x-powered-by');

// CLIENT_URL may be a comma separated list of allowed origins.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // No Origin header = curl, server-to-server or same-origin request.
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      // Never break a Vercel preview deployment of this project.
      if (/^https:\/\/[a-z0-9-]+(\.vercel\.app)$/i.test(origin)) return cb(null, true);
      return cb(new Error(`CORS: ${origin} is not allowed`));
    },
    credentials: true
  })
);

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

app.get('/api/health', async (req, res) => {
  // On a serverless host the connection is opened on demand, so probe it here.
  if (process.env.VERCEL && mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {
      console.error('DB connection failed', e.message);
    }
  }
  res.json({
    status: 'ok',
    service: 'FoodBridge API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// In a serverless environment the MongoDB connection is established per
// invocation (and cached across warm ones) before any route runs. Locally the
// connection is opened once at boot, so this is a no-op there.
if (process.env.VERCEL) {
  app.use(async (req, res, next) => {
    try {
      await connectDB();
    } catch (e) {
      console.error('DB connection failed', e.message);
    }
    next();
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

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const message = /^CORS:/.test(err?.message || '') ? err.message : 'Server error';
  res.status(500).json({ message });
});

if (!process.env.VERCEL) {
  const connected = await connectDB();
  if (!connected) {
    console.error('MongoDB is required. Set MONGO_URI and retry.');
    process.exit(1);
  }
  const port = process.env.PORT || 5001;
  app.listen(port, () => console.log(`FoodBridge API running on http://localhost:${port}`));
  process.on('unhandledRejection', (r) => console.error('[unhandledRejection]', r));
  process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));
}

export default app;
