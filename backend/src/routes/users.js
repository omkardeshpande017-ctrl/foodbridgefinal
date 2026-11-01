import { Router } from 'express';
import User from '../models/User.js';
import { auth, roles } from '../middleware/auth.js';
const r = Router();
r.get('/', auth, roles('admin'), async (req, res) => {
  try { res.json(await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(500)); }
  catch (e) { res.status(500).json({ message: 'Could not load users' }); }
});
r.patch('/:id/status', auth, roles('admin'), async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['active', 'suspended'].includes(status)) return res.status(400).json({ message: 'Status must be active or suspended' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role === 'admin') return res.status(403).json({ message: 'Administrator account status cannot be changed here' });
    target.status = status; await target.save(); res.json(await User.findById(target._id).select('-passwordHash'));
  } catch (e) { res.status(500).json({ message: 'Could not update user status' }); }
});
r.get('/me', auth, async (req, res) => {
  try { const user = await User.findById(req.user.id).select('-passwordHash'); if (!user) return res.status(404).json({ message: 'User not found' }); res.json(user); }
  catch (e) { res.status(500).json({ message: 'Could not load profile' }); }
});
r.patch('/me', auth, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'location', 'organization', 'skills'];
    const update = {};
    for (const key of allowed) if (req.body && Object.hasOwn(req.body, key)) update[key] = req.body[key];
    if (typeof update.name === 'string') update.name = update.name.trim().slice(0, 120);
    if (typeof update.phone === 'string') update.phone = update.phone.trim().slice(0, 30);
    if (typeof update.location === 'string') update.location = update.location.trim().slice(0, 160);
    if (typeof update.organization === 'string') update.organization = update.organization.trim().slice(0, 160);
    if (update.skills && (!Array.isArray(update.skills) || update.skills.some(x => typeof x !== 'string'))) return res.status(400).json({ message: 'Skills must be a list of text values' });
    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' }); res.json(user);
  } catch (e) { res.status(400).json({ message: 'Could not update profile' }); }
});
export default r;
