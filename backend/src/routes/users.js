import { Router } from 'express';
import User from '../models/User.js';
import { auth, roles } from '../middleware/auth.js';

const r = Router();

r.get(
  '/',
  auth,
  roles('admin'),
  async (req, res) =>
    res.json(
      await User.find()
        .select('-passwordHash')
        .sort({ createdAt: -1 })
    )
);

r.patch(
  '/:id/status',
  auth,
  roles('admin'),
  async (req, res) =>
    res.json(
      await User.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
        },
        {
          new: true,
        }
      ).select('-passwordHash')
    )
);

r.get(
  '/me',
  auth,
  async (req, res) =>
    res.json(
      await User.findById(req.user.id)
        .select('-passwordHash')
    )
);

r.patch(
  '/me',
  auth,
  async (req, res) =>
    res.json(
      await User.findByIdAndUpdate(
        req.user.id,
        req.body,
        {
          new: true,
        }
      ).select('-passwordHash')
    )
);

export default r;