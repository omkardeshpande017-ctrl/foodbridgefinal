import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

import auth from './routes/auth.js';
import donations from './routes/donations.js';
import users from './routes/users.js';
import analytics from './routes/analytics.js';
import notifications from './routes/notifications.js';
import deliveries from './routes/deliveries.js';
import ai from './routes/ai.js';
import reports from './routes/reports.js';

const app = express();

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      'http://localhost:5173',
  })
);

app.use(express.json({ limit: '5mb' }));

app.use(morgan('dev'));

app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    service: 'FoodBridge API',
    timestamp: new Date().toISOString(),
  })
);

app.use('/api/auth', auth);
app.use('/api/donations', donations);
app.use('/api/users', users);
app.use('/api/analytics', analytics);
app.use('/api/notifications', notifications);
app.use('/api/deliveries', deliveries);
app.use('/api/ai', ai);
app.use('/api/reports', reports);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: 'Server error',
  });
});

const port = process.env.PORT || 5000;

await connectDB();

app.listen(port, () =>
  console.log(
    `FoodBridge API running on http://localhost:${port}`
  )
);