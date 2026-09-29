import { Router } from 'express';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import { auth, roles } from '../middleware/auth.js';

const r = Router();

r.get('/summary', auth, async (req, res) => {
  const base =
    req.user.role === 'donor'
      ? { donorId: req.user.id }
      : req.user.role === 'ngo'
        ? { ngoId: req.user.id }
        : {};

  const ds = await Donation.find(base);

  const total = ds.reduce((s, d) => s + d.quantity, 0);

  const delivered = ds.filter(
    (d) => d.status === 'delivered'
  );

  res.json({
    totalFood: Math.round(total),

    active: ds.filter(
      (d) =>
        !['delivered', 'cancelled', 'expired'].includes(d.status)
    ).length,

    completed: delivered.length,

    peopleServed: ds.reduce(
      (s, d) => s + d.peopleServed,
      0
    ),

    co2Saved: Math.round(
      ds.reduce((s, d) => s + d.co2Saved, 0)
    ),

    efficiency: ds.length
      ? Math.round((delivered.length / ds.length) * 100)
      : 0,
  });
});

r.get(
  '/overview',
  auth,
  roles('admin', 'ngo', 'donor', 'volunteer'),
  async (req, res) => {
    const ds = await Donation.find();

    const byCat = {};

    ds.forEach((d) => {
      byCat[d.category] =
        (byCat[d.category] || 0) + d.quantity;
    });

    const byStatus = {};

    ds.forEach((d) => {
      byStatus[d.status] =
        (byStatus[d.status] || 0) + 1;
    });

    const users = await User.countDocuments();

    res.json({
      users,

      donations: ds.length,

      byCategory: Object.entries(byCat).map(
        ([name, value]) => ({
          name,
          value: Math.round(value),
        })
      ),

      byStatus: Object.entries(byStatus).map(
        ([name, value]) => ({
          name,
          value,
        })
      ),

      trend: [
        { name: 'Mon', food: 120, demand: 100 },
        { name: 'Tue', food: 180, demand: 145 },
        { name: 'Wed', food: 150, demand: 165 },
        { name: 'Thu', food: 220, demand: 190 },
        { name: 'Fri', food: 240, demand: 210 },
        { name: 'Sat', food: 280, demand: 250 },
        { name: 'Sun', food: 200, demand: 230 },
      ],
    });
  }
);

export default r;