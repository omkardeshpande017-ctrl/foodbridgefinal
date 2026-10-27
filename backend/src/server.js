import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

// DEMO_MODE runs the whole API from an in-memory store (no MongoDB), so the
// app can be deployed anywhere with zero setup. Set DEMO_MODE=0 and a
// MONGO_URI to use the real database instead.
// On a serverless host we always use the in-memory store unless a MONGO_URI is
// configured there, so a local .env file can never break the deployment.
const DEMO_MODE = ['1', 'true', 'yes'].includes(
  String(process.env.DEMO_MODE || '').toLowerCase()
);

import auth from './routes/auth.js';
import donations from './routes/donations.js';
import users from './routes/users.js';
import analytics from './routes/analytics.js';
import notifications from './routes/notifications.js';
import deliveries from './routes/deliveries.js';
import ai from './routes/ai.js';
import reports from './routes/reports.js';

import demo from './demo/routes.js';

const app = express();

// CLIENT_URL may be a comma separated list of origins (local dev + deployment).
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // no Origin header = curl / server-to-server / same-origin
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      // never break a Vercel preview deployment
      if (/\.vercel\.app$/.test(origin)) return cb(null, true);
      return cb(new Error(`CORS: ${origin} is not allowed`));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '5mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    service: 'FoodBridge API',
    mode: DEMO_MODE ? 'demo' : 'database',
    timestamp: new Date().toISOString()
  })
);

if (DEMO_MODE) {
  app.use('/api/auth', demo.authRouter());
  app.use('/api/donations', demo.donationsRouter());
  app.use('/api/users', demo.usersRouter());
  app.use('/api/analytics', demo.analyticsRouter());
  app.use('/api/notifications', demo.notificationsRouter());
  app.use('/api/deliveries', demo.deliveriesRouter());
  app.use('/api/ai', demo.aiRouter());
  app.use('/api/reports', demo.reportsRouter());
} else {
  app.use('/api/auth', auth);
  app.use('/api/donations', donations);
  app.use('/api/users', users);
  app.use('/api/analytics', analytics);
  app.use('/api/notifications', notifications);
  app.use('/api/deliveries', deliveries);
  app.use('/api/ai', ai);
  app.use('/api/reports', reports);
}

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

const port = process.env.PORT || 5000;

if (!DEMO_MODE) await connectDB();
else console.log('DEMO_MODE on — using the in-memory store (no database)');

// On Vercel the app is exported instead of listening on a port.
if (process.env.VERCEL) {
  // exported below as an ES module default
} else {
  app.listen(port, () => console.log(`FoodBridge API running on http://localhost:${port}`));
  process.on('unhandledRejection', (r) => console.error('[unhandledRejection]', r));
  process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));
}

export default app;
