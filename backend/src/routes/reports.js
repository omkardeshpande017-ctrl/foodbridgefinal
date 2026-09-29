import { Router } from 'express';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import { auth, roles } from '../middleware/auth.js';

const r = Router();

r.get(
  '/summary',
  auth,
  roles('admin', 'ngo', 'donor', 'volunteer'),
  async (req, res) => {
    const [donations, users] = await Promise.all([
      Donation.find(),
      User.countDocuments(),
    ]);

    res.json({
      generatedAt: new Date().toISOString(),
      users,
      donations: donations.length,
      totalFood: donations.reduce(
        (s, d) => s + d.quantity,
        0
      ),
      peopleServed: donations.reduce(
        (s, d) => s + d.peopleServed,
        0
      ),
      co2Saved: donations.reduce(
        (s, d) => s + d.co2Saved,
        0
      ),
    });
  }
);

export default r;