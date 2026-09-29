import { Router } from 'express';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { auth, roles } from '../middleware/auth.js';

const r = Router();

r.get('/', auth, async (req, res) => {
  try {
    const q = {};

    if (req.query.status) {
      q.status = req.query.status;
    }

    if (req.query.category) {
      q.category = req.query.category;
    }

    if (req.query.search) {
      q.foodName = {
        $regex: req.query.search,
        $options: 'i',
      };
    }

    if (req.user.role === 'donor') {
      q.donorId = req.user.id;
    }

    if (
      req.user.role === 'ngo' &&
      req.query.mine === 'true'
    ) {
      q.ngoId = req.user.id;
    }

    const data = await Donation.find(q)
      .populate('donorId', 'name email')
      .populate('ngoId', 'name organization')
      .populate('volunteerId', 'name')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(data);
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
});

r.post(
  '/',
  auth,
  roles('donor', 'admin'),
  async (req, res) => {
    try {
      const d = await Donation.create({
        ...req.body,
        donorId:
          req.user.role === 'donor'
            ? req.user.id
            : req.body.donorId,
        peopleServed: Math.max(
          1,
          Math.round((Number(req.body.quantity) || 0) * 2)
        ),
        co2Saved: Number(req.body.quantity) || 0,
      });

      res.status(201).json(d);
    } catch (e) {
      res.status(400).json({
        message: e.message,
      });
    }
  }
);

r.patch('/:id/status', auth, async (req, res) => {
  try {
    const d = await Donation.findById(req.params.id);

    if (!d) {
      return res.status(404).json({
        message: 'Donation not found',
      });
    }

    const allowed = [
      'available',
      'accepted',
      'picked_up',
      'in_transit',
      'delivered',
      'expired',
      'cancelled',
    ];

    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({
        message: 'Invalid status',
      });
    }

    d.status = req.body.status;

    if (
      req.user.role === 'ngo' &&
      req.body.status === 'accepted'
    ) {
      d.ngoId = req.user.id;
    }

    if (
      req.user.role === 'volunteer' &&
      ['picked_up', 'in_transit', 'delivered'].includes(
        req.body.status
      )
    ) {
      d.volunteerId = req.user.id;
    }

    await d.save();

    if (d.donorId) {
      await Notification.create({
        userId: d.donorId,
        title: 'Donation updated',
        message: `${d.foodName} is now ${d.status.replace(
          '_',
          ' '
        )}.`,
        type: 'success',
      });
    }

    res.json(d);
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
});

r.post(
  '/:id/accept',
  auth,
  roles('ngo'),
  async (req, res) => {
    req.body.status = 'accepted';
    req.user.role = 'ngo';
    req.params.id = req.params.id;

    const d = await Donation.findById(req.params.id);

    if (!d) {
      return res.status(404).json({
        message: 'Donation not found',
      });
    }

    d.status = 'accepted';
    d.ngoId = req.user.id;

    await d.save();

    await Notification.create({
      userId: d.donorId,
      title: 'Donation accepted',
      message: `${d.foodName} was accepted by your NGO partner.`,
      type: 'success',
    });

    res.json(d);
  }
);

export default r;