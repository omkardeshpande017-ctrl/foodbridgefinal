import { Router } from 'express';
import Delivery from '../models/Delivery.js';
import Donation from '../models/Donation.js';
import { auth, roles } from '../middleware/auth.js';

const r = Router();

r.get('/', auth, async (req, res) => {
  const q =
    req.user.role === 'volunteer'
      ? { volunteerId: req.user.id }
      : {};

  res.json(
    await Delivery.find(q)
      .populate('donationId')
      .populate('volunteerId', 'name email')
      .sort({ createdAt: -1 })
  );
});

r.post(
  '/',
  auth,
  roles('admin', 'ngo'),
  async (req, res) => {
    const d = await Delivery.create(req.body);

    if (req.body.donationId && req.body.volunteerId) {
      await Donation.findByIdAndUpdate(
        req.body.donationId,
        {
          volunteerId: req.body.volunteerId,
          status: 'accepted',
        }
      );
    }

    res.status(201).json(d);
  }
);

r.patch(
  '/:id',
  auth,
  roles('volunteer', 'admin', 'ngo'),
  async (req, res) => {
    const d = await Delivery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!d) {
      return res.status(404).json({
        message: 'Delivery not found',
      });
    }

    if (d.donationId && req.body.status) {
      await Donation.findByIdAndUpdate(
        d.donationId,
        {
          status:
            req.body.status === 'delivered'
              ? 'delivered'
              : req.body.status,
        }
      );
    }

    res.json(d);
  }
);

export default r;