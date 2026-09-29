import { Router } from 'express';
import { auth } from '../middleware/auth.js';

const r = Router();

r.get('/insights', auth, async (req, res) =>
  res.json({
    isDemo: true,
    confidence: 0.86,

    insights: [
      {
        title: 'Demand rising',
        text: 'Meal demand is projected to rise 14% in the next 7 days.',
        severity: 'medium',
      },
      {
        title: 'Surplus detected',
        text: 'Cooked meals show the largest short-term surplus opportunity.',
        severity: 'high',
      },
      {
        title: 'NGO matching',
        text: 'Three nearby NGO profiles match the current donation category.',
        severity: 'low',
      },
    ],

    forecast: [
      { day: 'Mon', demand: 120 },
      { day: 'Tue', demand: 135 },
      { day: 'Wed', demand: 150 },
      { day: 'Thu', demand: 164 },
      { day: 'Fri', demand: 172 },
      { day: 'Sat', demand: 181 },
      { day: 'Sun', demand: 176 },
    ],
  })
);

export default r;