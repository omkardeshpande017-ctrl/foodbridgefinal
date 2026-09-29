import { Router } from 'express';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const r = Router();

r.get('/', auth, async (req, res) => {
  res.json(
    await Notification.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(100)
  );
});

r.patch('/:id/read', auth, async (req, res) => {
  res.json(
    await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
      },
      {
        read: true,
      },
      {
        new: true,
      }
    )
  );
});

export default r;