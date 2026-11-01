import { Router } from 'express';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Delivery from '../models/Delivery.js';
import { auth, roles } from '../middleware/auth.js';

const r = Router();

const DAY = 24 * 60 * 60 * 1000;
const dayName = (d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

// ---------------------------------------------------------------------------
// GET /api/analytics/summary — scoped to the caller's role.
// ---------------------------------------------------------------------------
r.get('/summary', auth, async (req, res) => {
  try {
    const base =
      req.user.role === 'donor'
        ? { donorId: req.user.id }
        : req.user.role === 'ngo'
        ? { ngoId: req.user.id }
        : req.user.role === 'volunteer'
        ? { volunteerId: req.user.id }
        : {};
    const ds = await Donation.find(base).lean();
    const total = ds.reduce((s, d) => s + (d.quantity || 0), 0);
    const delivered = ds.filter((d) => d.status === 'delivered');
    res.json({
      totalFood: Math.round(total),
      active: ds.filter((d) => !['delivered', 'cancelled', 'expired'].includes(d.status)).length,
      completed: delivered.length,
      peopleServed: ds.reduce((s, d) => s + (d.peopleServed || 0), 0),
      co2Saved: Math.round(ds.reduce((s, d) => s + (d.co2Saved || 0), 0)),
      efficiency: ds.length ? Math.round((delivered.length / ds.length) * 100) : 0
    });
  } catch (e) {
    console.error('analytics summary', e);
    res.status(500).json({ message: 'Could not load summary' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/analytics/overview — network-wide dashboard data, computed from the
// real collections (no hard-coded trend arrays).
// ---------------------------------------------------------------------------
r.get('/overview', auth, roles('admin', 'ngo', 'donor', 'volunteer'), async (req, res) => {
  try {
    const [donations, users, deliveries] = await Promise.all([
      Donation.find().lean(),
      User.countDocuments(),
      Delivery.countDocuments()
    ]);

    const byCat = {};
    donations.forEach((d) => {
      byCat[d.category || 'Other'] = (byCat[d.category || 'Other'] || 0) + (d.quantity || 0);
    });
    const byStatus = {};
    donations.forEach((d) => {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    });

    // Seven-day rolling trend from createdAt: food posted vs. food delivered.
    const today = new Date();
    const trend = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(today.getTime() - (6 - i) * DAY);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + DAY);
      const inRange = (d, fromKey = 'createdAt') => {
        const t = new Date(d[fromKey] || d.createdAt).getTime();
        return t >= start.getTime() && t < end.getTime();
      };
      const posted = donations.filter((d) => inRange(d)).reduce((s, d) => s + (d.quantity || 0), 0);
      const delivered = donations
        .filter((d) => d.status === 'delivered' && inRange(d, 'updatedAt'))
        .reduce((s, d) => s + (d.quantity || 0), 0);
      return { name: dayName(start), food: Math.round(posted), demand: Math.round(delivered) };
    });

    const delivered = donations.filter((d) => d.status === 'delivered');
    const totalFood = donations.reduce((s, d) => s + (d.quantity || 0), 0);

    res.json({
      users,
      donations: donations.length,
      deliveries,
      active: donations.filter((d) => !['delivered', 'cancelled', 'expired'].includes(d.status)).length,
      totalFood: Math.round(totalFood),
      peopleServed: donations.reduce((s, d) => s + (d.peopleServed || 0), 0),
      co2Saved: Math.round(donations.reduce((s, d) => s + (d.co2Saved || 0), 0)),
      efficiency: donations.length ? Math.round((delivered.length / donations.length) * 100) : 0,
      byCategory: Object.entries(byCat)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value),
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      trend
    });
  } catch (e) {
    console.error('analytics overview', e);
    res.status(500).json({ message: 'Could not load analytics' });
  }
});

export default r;
