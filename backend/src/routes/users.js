import { Router } from 'express';
import User from '../models/User.js';
import { auth, roles } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import { pagination, str } from '../utils/validate.js';

const r = Router();

// ---------------------------------------------------------------------------
// Admin: user directory with search, role/status filters and pagination.
// ---------------------------------------------------------------------------
r.get('/', auth, roles('admin'), async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query, { defaultLimit: 50, maxLimit: 200 });
    const q = {};
    if (['donor', 'ngo', 'volunteer', 'admin'].includes(req.query.role)) q.role = req.query.role;
    if (['active', 'suspended'].includes(req.query.status)) q.status = req.query.status;
    if (req.query.search) {
      const term = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      q.$or = [{ name: { $regex: term, $options: 'i' } }, { email: { $regex: term, $options: 'i' } }];
    }
    const [items, total] = await Promise.all([
      User.find(q).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(q)
    ]);
    res.json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) {
    res.status(500).json({ message: 'Could not load users' });
  }
});

// Volunteers who are available, for NGO assignment dropdowns.
r.get('/volunteers', auth, roles('admin', 'ngo'), async (req, res) => {
  try {
    const items = await User.find({ role: 'volunteer', status: 'active', available: true })
      .select('name email phone location')
      .sort({ name: 1 })
      .limit(200)
      .lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: 'Could not load volunteers' });
  }
});

r.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'Could not load profile' });
  }
});

r.patch('/me', auth, async (req, res) => {
  try {
    const update = {};
    for (const key of ['name', 'phone', 'location', 'organization', 'registrationNumber']) {
      if (req.body && Object.hasOwn(req.body, key)) update[key] = str(req.body[key], 160);
    }
    if (req.body?.skills !== undefined) {
      if (!Array.isArray(req.body.skills) || req.body.skills.some((x) => typeof x !== 'string')) {
        return res.status(400).json({ message: 'Skills must be a list of text values' });
      }
      update.skills = req.body.skills.slice(0, 10).map((s) => str(s, 60)).filter(Boolean);
    }
    if (typeof req.body?.available === 'boolean') update.available = req.body.available;
    if (update.name !== undefined && !update.name) return res.status(400).json({ message: 'Name cannot be empty' });

    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true, runValidators: true })
      .select('-passwordHash')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    await audit(req, 'user.profile_update', { entity: 'User', entityId: user._id, meta: { fields: Object.keys(update) } });
    res.json(user);
  } catch (e) {
    res.status(400).json({ message: 'Could not update profile' });
  }
});

// ---------------------------------------------------------------------------
// Admin: activate / suspend an account (administrators are protected).
// ---------------------------------------------------------------------------
r.patch('/:id/status', auth, roles('admin'), async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['active', 'suspended'].includes(status)) return res.status(400).json({ message: 'Status must be active or suspended' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role === 'admin') return res.status(403).json({ message: 'Administrator accounts cannot be changed here' });
    target.status = status;
    await target.save();
    await audit(req, 'user.status', { entity: 'User', entityId: target._id, meta: { status } });
    res.json(await User.findById(target._id).select('-passwordHash').lean());
  } catch (e) {
    res.status(400).json({ message: 'Could not update user status' });
  }
});

// ---------------------------------------------------------------------------
// Admin: NGO verification workflow.
// ---------------------------------------------------------------------------
r.patch('/:id/verification', auth, roles('admin'), async (req, res) => {
  try {
    const { status, note } = req.body || {};
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Verification status must be pending, verified or rejected' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role !== 'ngo') return res.status(400).json({ message: 'Only NGO accounts require verification' });

    target.verification = { status, note: str(note, 400), reviewedAt: new Date(), reviewedBy: req.user.id };
    await target.save();
    await audit(req, 'ngo.verification', { entity: 'User', entityId: target._id, meta: { status } });
    res.json(await User.findById(target._id).select('-passwordHash').lean());
  } catch (e) {
    res.status(400).json({ message: 'Could not update verification' });
  }
});

export default r;
