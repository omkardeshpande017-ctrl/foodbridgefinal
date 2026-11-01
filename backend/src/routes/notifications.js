import { Router } from 'express';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const r = Router();

r.get('/', auth, async (req, res) => {
  try {
    const [items, unread] = await Promise.all([
      Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100).lean(),
      Notification.countDocuments({ userId: req.user.id, read: false })
    ]);
    res.json({ items, unread });
  } catch (e) {
    res.status(500).json({ message: 'Could not load notifications' });
  }
});

r.patch('/:id/read', auth, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    res.json(n);
  } catch (e) {
    res.status(400).json({ message: 'Could not update notification' });
  }
});

r.post('/read-all', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ updated: result.modifiedCount });
  } catch (e) {
    res.status(500).json({ message: 'Could not update notifications' });
  }
});

export default r;
