import { Router } from 'express';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import { auth, roles } from '../middleware/auth.js';
const r = Router();
r.get('/', auth, async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.category) q.category = req.query.category;
    if (req.query.search) q.foodName = { $regex: String(req.query.search).slice(0, 100), $options: 'i' };
    if (req.user.role === 'donor') q.donorId = req.user.id;
    if (req.user.role === 'ngo' && req.query.mine === 'true') q.ngoId = req.user.id;
    if (req.user.role === 'volunteer' && req.query.mine === 'true') q.volunteerId = req.user.id;
    const data = await Donation.find(q).populate('donorId', 'name email').populate('ngoId', 'name organization').populate('volunteerId', 'name').sort({ createdAt: -1 }).limit(200);
    res.json(data);
  } catch (e) { res.status(500).json({ message: 'Could not load donations' }); }
});
r.post('/', auth, roles('donor', 'admin'), async (req, res) => {
  try {
    const b = req.body || {};
    if (typeof b.foodName !== 'string' || !b.foodName.trim() || !Number.isFinite(Number(b.quantity)) || Number(b.quantity) <= 0 || typeof b.pickupLocation !== 'string' || !b.pickupLocation.trim()) return res.status(400).json({ message: 'Food name, positive quantity, and pickup location are required' });
    const payload = {
      foodName: b.foodName.trim().slice(0, 160), category: String(b.category || 'Other').slice(0, 80), quantity: Number(b.quantity),
      unit: ['kg', 'litres', 'packs', 'meals'].includes(b.unit) ? b.unit : 'kg', description: String(b.description || '').slice(0, 2000),
      preparationDate: b.preparationDate || undefined, expiryTime: b.expiryTime || undefined,
      pickupLocation: b.pickupLocation.trim().slice(0, 240), pickupDate: b.pickupDate || undefined, pickupTime: b.pickupTime || undefined,
      notes: String(b.notes || '').slice(0, 2000), donorId: req.user.role === 'donor' ? req.user.id : undefined,
      peopleServed: Math.max(1, Math.round(Number(b.quantity) * 2)), co2Saved: Number(b.quantity), status: 'available'
    };
    const d = await Donation.create(payload); res.status(201).json(d);
  } catch (e) { res.status(400).json({ message: 'Could not create donation; check the supplied fields' }); }
});
r.patch('/:id/status', auth, async (req, res) => {
  try {
    const d = await Donation.findById(req.params.id);
    if (!d) return res.status(404).json({ message: 'Donation not found' });
    const status = req.body?.status;
    const allowed = ['available', 'accepted', 'picked_up', 'in_transit', 'delivered', 'expired', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const role = req.user.role;
    const ownDonation = String(d.donorId) === String(req.user.id);
    const canAccept = role === 'ngo' && status === 'accepted' && d.status === 'available';
    const canDeliver = role === 'volunteer' && ['picked_up', 'in_transit', 'delivered'].includes(status) && d.status !== 'available' && String(d.ngoId || '') !== '';
    // A donor may withdraw their own donation, and an NGO may release one it accepted.
    const canCancel =
      status === 'cancelled' &&
      ['available', 'accepted'].includes(d.status) &&
      ((role === 'donor' && ownDonation) ||
        (role === 'ngo' && String(d.ngoId || '') === String(req.user.id)));
    const canAdmin = role === 'admin';
    if (!canAccept && !canDeliver && !canCancel && !canAdmin) return res.status(403).json({ message: 'Your role cannot perform this status transition' });
    if (canAccept) d.ngoId = req.user.id;
    if (canDeliver) d.volunteerId = req.user.id;
    d.status = status; await d.save();
    if (d.donorId) await Notification.create({ userId: d.donorId, title: 'Donation updated', message: `${d.foodName} is now ${d.status.replace('_', ' ')}.`, type: 'success' });
    res.json(d);
  } catch (e) { res.status(500).json({ message: 'Could not update donation' }); }
});
r.post('/:id/accept', auth, roles('ngo'), async (req, res) => {
  try {
    const d = await Donation.findById(req.params.id);
    if (!d) return res.status(404).json({ message: 'Donation not found' });
    if (d.status !== 'available') return res.status(409).json({ message: 'Donation is no longer available' });
    d.status = 'accepted'; d.ngoId = req.user.id; await d.save();
    await Notification.create({ userId: d.donorId, title: 'Donation accepted', message: `${d.foodName} was accepted by your NGO partner.`, type: 'success' });
    res.json(d);
  } catch (e) { res.status(500).json({ message: 'Could not accept donation' }); }
});
export default r;
