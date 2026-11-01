import { Router } from 'express';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';
import { auth, roles } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import { isSafeImage, oneOf, pagination, positiveNumber, str } from '../utils/validate.js';

const r = Router();
const STATUSES = ['available', 'accepted', 'picked_up', 'in_transit', 'delivered', 'expired', 'cancelled'];
const UNITS = ['kg', 'litres', 'packs', 'meals'];
const CLOSED = ['delivered', 'cancelled', 'expired'];

const pushHistory = (donation, status, req, note) => {
  donation.history.push({ status, at: new Date(), by: req.user.id, byRole: req.user.role, note });
};

// Marks donations whose expiry instant has passed as expired (idempotent, cheap).
async function expireStale(scope = {}) {
  const now = new Date();
  await Donation.updateMany(
    { ...scope, status: { $in: ['available', 'accepted'] }, expiresAt: { $lt: now } },
    {
      $set: { status: 'expired' },
      $push: { history: { status: 'expired', at: now, byRole: 'system', note: 'Expiry passed' } }
    }
  );
  return now;
}

// ---------------------------------------------------------------------------
// GET /api/donations — paginated, filtered, role-scoped list.
// ---------------------------------------------------------------------------
r.get('/', auth, async (req, res) => {
  try {
    await expireStale(req.user.role === 'donor' ? { donorId: req.user.id } : req.user.role === 'ngo' ? { ngoId: req.user.id } : {});

    const { page, limit, skip } = pagination(req.query);
    const q = {};
    if (oneOf(req.query.status, STATUSES)) q.status = req.query.status;
    if (req.query.category) q.category = String(req.query.category).slice(0, 80);
    if (req.query.search) {
      const term = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      q.$or = [
        { foodName: { $regex: term, $options: 'i' } },
        { pickupLocation: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } }
      ];
    }
    if (req.user.role === 'donor') q.donorId = req.user.id;
    if (req.user.role === 'ngo') {
      if (req.query.mine === 'true') q.ngoId = req.user.id;
      // NGOs browse what is still open, unless they ask for everything.
      if (req.query.available === 'true') q.status = 'available';
    }
    if (req.user.role === 'volunteer' && req.query.mine === 'true') q.volunteerId = req.user.id;

    const [items, total] = await Promise.all([
      Donation.find(q)
        .populate('donorId', 'name email organization location')
        .populate('ngoId', 'name organization')
        .populate('volunteerId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Donation.countDocuments(q)
    ]);

    res.json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) {
    console.error('donations list', e);
    res.status(500).json({ message: 'Could not load donations' });
  }
});

r.get('/:id', auth, async (req, res) => {
  try {
    const d = await Donation.findById(req.params.id)
      .populate('donorId', 'name email organization location phone')
      .populate('ngoId', 'name organization')
      .populate('volunteerId', 'name phone')
      .populate('history.by', 'name role')
      .lean();
    if (!d) return res.status(404).json({ message: 'Donation not found' });
    const allowed =
      req.user.role === 'admin' ||
      String(d.donorId?._id || d.donorId) === String(req.user.id) ||
      String(d.ngoId?._id || d.ngoId) === String(req.user.id) ||
      String(d.volunteerId?._id || d.volunteerId) === String(req.user.id) ||
      (req.user.role === 'ngo' && d.status === 'available');
    if (!allowed) return res.status(403).json({ message: 'You cannot view this donation' });
    res.json(d);
  } catch (e) {
    res.status(400).json({ message: 'Invalid donation id' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/donations — create (donor or admin).
// ---------------------------------------------------------------------------
r.post('/', auth, roles('donor', 'admin'), async (req, res) => {
  try {
    const b = req.body || {};
    const settings = (await Setting.findOne({ key: 'platform' }).lean()) || {};
    const foodName = str(b.foodName, 160);
    const quantity = positiveNumber(b.quantity);
    const pickupLocation = str(b.pickupLocation, 240);

    if (!foodName || quantity === null || !pickupLocation) {
      return res.status(400).json({ message: 'Food name, a positive quantity and a pickup location are required' });
    }
    if (b.image && settings.allowDonorImages === false) {
      return res.status(400).json({ message: 'Photo uploads are disabled by the platform' });
    }
    if (b.image && !isSafeImage(b.image)) {
      return res.status(400).json({ message: 'The photo must be a PNG/JPEG/WebP image under 1.5 MB or an https URL' });
    }

    let expiresAt;
    if (b.expiryTime) {
      const parsed = new Date(b.expiryTime);
      if (Number.isNaN(parsed.getTime())) return res.status(400).json({ message: 'Invalid expiry date/time' });
      if (parsed.getTime() <= Date.now()) return res.status(400).json({ message: 'The expiry time must be in the future' });
      expiresAt = parsed;
    } else if (b.pickupDate) {
      const parsed = new Date(`${b.pickupDate}T23:59:00`);
      if (!Number.isNaN(parsed.getTime())) expiresAt = parsed;
    }

    const donation = await Donation.create({
      foodName,
      category: str(b.category, 80) || 'Other',
      quantity,
      unit: oneOf(b.unit, UNITS) || 'kg',
      description: str(b.description, 2000),
      preparationDate: str(b.preparationDate, 40),
      expiryTime: str(b.expiryTime, 40),
      expiresAt,
      pickupLocation,
      pickupDate: str(b.pickupDate, 40),
      pickupTime: str(b.pickupTime, 40),
      image: b.image || undefined,
      notes: str(b.notes, 2000),
      donorId: req.user.role === 'donor' ? req.user.id : b.donorId,
      peopleServed: Math.max(1, Math.round(quantity * 2)),
      co2Saved: quantity,
      status: 'available',
      history: [{ status: 'available', at: new Date(), by: req.user.id, byRole: req.user.role, note: 'Donation posted' }]
    });
    await audit(req, 'donation.create', { entity: 'Donation', entityId: donation._id, meta: { foodName, quantity } });
    res.status(201).json(donation);
  } catch (e) {
    console.error('donation create', e);
    res.status(400).json({ message: 'Could not create donation; check the supplied fields' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/donations/:id — edit while still available (owner or admin).
// ---------------------------------------------------------------------------
r.patch('/:id', auth, async (req, res) => {
  try {
    const d = await Donation.findById(req.params.id);
    if (!d) return res.status(404).json({ message: 'Donation not found' });
    const isOwner = String(d.donorId) === String(req.user.id);
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'You cannot edit this donation' });
    }
    if (!['available'].includes(d.status)) return res.status(409).json({ message: 'Only available donations can be edited' });

    const b = req.body || {};
    if (b.foodName !== undefined) {
      const v = str(b.foodName, 160);
      if (!v) return res.status(400).json({ message: 'Food name cannot be empty' });
      d.foodName = v;
    }
    if (b.quantity !== undefined) {
      const v = positiveNumber(b.quantity);
      if (v === null) return res.status(400).json({ message: 'Quantity must be a positive number' });
      d.quantity = v;
      d.peopleServed = Math.max(1, Math.round(v * 2));
      d.co2Saved = v;
    }
    if (b.category !== undefined) d.category = str(b.category, 80) || 'Other';
    if (b.unit !== undefined && oneOf(b.unit, UNITS)) d.unit = b.unit;
    if (b.description !== undefined) d.description = str(b.description, 2000);
    if (b.notes !== undefined) d.notes = str(b.notes, 2000);
    if (b.pickupLocation !== undefined) {
      const v = str(b.pickupLocation, 240);
      if (!v) return res.status(400).json({ message: 'Pickup location cannot be empty' });
      d.pickupLocation = v;
    }
    if (b.pickupDate !== undefined) d.pickupDate = str(b.pickupDate, 40);
    if (b.pickupTime !== undefined) d.pickupTime = str(b.pickupTime, 40);
    if (b.expiryTime !== undefined) {
      const parsed = new Date(b.expiryTime);
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        return res.status(400).json({ message: 'The expiry time must be a future date/time' });
      }
      d.expiryTime = str(b.expiryTime, 40);
      d.expiresAt = parsed;
    }
    if (b.image !== undefined) {
      if (b.image && !isSafeImage(b.image)) return res.status(400).json({ message: 'Invalid image payload' });
      d.image = b.image || undefined;
    }

    pushHistory(d, d.status, req, 'Donation details edited');
    await d.save();
    await audit(req, 'donation.update', { entity: 'Donation', entityId: d._id });
    res.json(d);
  } catch (e) {
    console.error('donation update', e);
    res.status(400).json({ message: 'Could not update donation' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/donations/:id/status — guarded lifecycle transitions.
// ---------------------------------------------------------------------------
r.patch('/:id/status', auth, async (req, res) => {
  try {
    const d = await Donation.findById(req.params.id);
    if (!d) return res.status(404).json({ message: 'Donation not found' });
    const status = req.body?.status;
    if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const role = req.user.role;
    const ownDonation = String(d.donorId) === String(req.user.id);
    const isAssignedVolunteer = String(d.volunteerId || '') === String(req.user.id);

    const canAccept = role === 'ngo' && status === 'accepted' && d.status === 'available';
    const canDeliver = role === 'volunteer' && ['picked_up', 'in_transit', 'delivered'].includes(status) && !!d.ngoId && !['available', 'cancelled', 'expired'].includes(d.status);
    const canCancel =
      status === 'cancelled' &&
      ['available', 'accepted'].includes(d.status) &&
      ((role === 'donor' && ownDonation) || (role === 'ngo' && String(d.ngoId || '') === String(req.user.id)));
    const canAdmin = role === 'admin';

    if (!canAccept && !canDeliver && !canCancel && !canAdmin) {
      return res.status(403).json({ message: 'Your role cannot perform this status transition' });
    }
    if (canDeliver && d.volunteerId && !isAssignedVolunteer) {
      return res.status(403).json({ message: 'This delivery is assigned to another volunteer' });
    }
    if (status === 'accepted' && canAccept) {
      // Verified NGOs only, when verification is enforced.
      const settings = (await Setting.findOne({ key: 'platform' }).lean()) || {};
      if (settings.requireNgoVerification !== false && req.user.verification !== 'verified') {
        return res.status(403).json({ message: 'Your NGO must be verified before accepting donations' });
      }
    }

    if (canAccept) d.ngoId = req.user.id;
    if (canDeliver) {
      d.volunteerId = d.volunteerId || req.user.id;
      if (status === 'picked_up') d.pickedUpAt = new Date();
      if (status === 'delivered') d.deliveredAt = new Date();
    }
    d.status = status;
    pushHistory(d, status, req);
    await d.save();

    await audit(req, 'donation.status', { entity: 'Donation', entityId: d._id, meta: { status } });
    if (d.donorId) {
      await Notification.create({
        userId: d.donorId,
        title: 'Donation updated',
        message: `${d.foodName} is now ${status.replace('_', ' ')}.`,
        type: status === 'delivered' ? 'success' : 'info',
        dedupeKey: `donation:${d._id}:${status}`
      });
    }
    res.json(d);
  } catch (e) {
    console.error('donation status', e);
    res.status(500).json({ message: 'Could not update donation' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/donations/:id/accept — atomic, duplicate-safe acceptance.
// ---------------------------------------------------------------------------
r.post('/:id/accept', auth, roles('ngo'), async (req, res) => {
  try {
    const settings = (await Setting.findOne({ key: 'platform' }).lean()) || {};
    if (settings.requireNgoVerification !== false && req.user.verification !== 'verified') {
      return res.status(403).json({ message: 'Your NGO must be verified before accepting donations' });
    }
    await expireStale();
    const now = new Date();
    const d = await Donation.findOneAndUpdate(
      { _id: req.params.id, status: 'available', $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }] },
      {
        $set: { status: 'accepted', ngoId: req.user.id },
        $push: { history: { status: 'accepted', at: now, by: req.user.id, byRole: req.user.role, note: 'Accepted by NGO' } }
      },
      { new: true }
    );
    if (!d) {
      const exists = await Donation.findById(req.params.id).select('status').lean();
      if (!exists) return res.status(404).json({ message: 'Donation not found' });
      return res.status(409).json({ message: exists.status === 'expired' ? 'This donation has expired' : 'Donation is no longer available' });
    }
    await audit(req, 'donation.accept', { entity: 'Donation', entityId: d._id });
    await Notification.create({
      userId: d.donorId,
      title: 'Donation accepted',
      message: `${d.foodName} was accepted by an NGO partner.`,
      type: 'success',
      dedupeKey: `donation:${d._id}:accepted`
    });
    res.json(d);
  } catch (e) {
    console.error('donation accept', e);
    res.status(500).json({ message: 'Could not accept donation' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/donations/:id — remove a cancelled/expired donation (owner/admin).
// ---------------------------------------------------------------------------
r.delete('/:id', auth, async (req, res) => {
  try {
    const d = await Donation.findById(req.params.id);
    if (!d) return res.status(404).json({ message: 'Donation not found' });
    const isOwner = String(d.donorId) === String(req.user.id);
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'You cannot delete this donation' });
    }
    if (!['cancelled', 'expired'].includes(d.status) && req.user.role !== 'admin') {
      return res.status(409).json({ message: 'Cancel the donation before deleting it' });
    }
    await d.deleteOne();
    await audit(req, 'donation.delete', { entity: 'Donation', entityId: d._id });
    res.json({ message: 'Donation deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Could not delete donation' });
  }
});

export default r;
