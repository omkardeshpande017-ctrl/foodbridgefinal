import { Router } from 'express';
import mongoose from 'mongoose';
import Delivery from '../models/Delivery.js';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import { audit } from '../utils/audit.js';
import { auth, roles } from '../middleware/auth.js';

const r = Router();
const STATUSES = ['assigned', 'picked_up', 'in_transit', 'delivered'];
const isId = (v) => typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);

r.get('/', auth, async (req, res) => {
  try {
    // Volunteers only ever see their own assignments; NGOs see the ones they created.
    const q = {};
    if (req.user.role === 'volunteer') q.volunteerId = req.user.id;
    if (req.user.role === 'ngo') q.ngoId = req.user.id;
    const data = await Delivery.find(q)
      .populate('donationId')
      .populate('volunteerId', 'name email phone')
      .populate('ngoId', 'name organization')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(data);
  } catch (e) {
    console.error('deliveries list', e);
    res.status(500).json({ message: 'Could not load deliveries' });
  }
});

r.post('/', auth, roles('admin', 'ngo'), async (req, res) => {
  try {
    const { donationId, volunteerId, pickup, dropoff, distanceKm, etaMinutes } = req.body || {};
    if (!isId(donationId)) return res.status(400).json({ message: 'A valid donation is required' });
    if (volunteerId && !isId(volunteerId)) return res.status(400).json({ message: 'Invalid volunteer' });

    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (req.user.role === 'ngo' && String(donation.ngoId || '') !== String(req.user.id)) {
      return res.status(403).json({ message: 'This donation is not assigned to your NGO' });
    }
    if (['delivered', 'cancelled', 'expired'].includes(donation.status)) {
      return res.status(409).json({ message: 'This donation can no longer be delivered' });
    }

    const delivery = await Delivery.create({
      donationId,
      volunteerId: volunteerId || donation.volunteerId || undefined,
      ngoId: req.user.role === 'ngo' ? req.user.id : donation.ngoId || undefined,
      pickup: String(pickup || donation.pickupLocation || '').slice(0, 240),
      dropoff: String(dropoff || '').slice(0, 240),
      distanceKm: Number.isFinite(Number(distanceKm)) ? Number(distanceKm) : 4.2,
      etaMinutes: Number.isFinite(Number(etaMinutes)) ? Number(etaMinutes) : 24,
      status: 'assigned'
    });

    if (delivery.volunteerId) {
      donation.volunteerId = delivery.volunteerId;
      if (donation.status === 'available') donation.status = 'accepted';
      await donation.save();
      await Notification.create({
        userId: delivery.volunteerId,
        title: 'New pickup assigned',
        message: `${donation.foodName} — pickup at ${delivery.pickup || 'the donor location'}.`,
        type: 'info',
        dedupeKey: `delivery:${delivery._id}:assigned`
      });
    }
    await audit(req, 'delivery.create', { entity: 'Delivery', entityId: delivery._id, meta: { donationId } });
    res.status(201).json(delivery);
  } catch (e) {
    console.error('delivery create', e);
    res.status(500).json({ message: 'Could not create delivery' });
  }
});

r.patch('/:id', auth, roles('volunteer', 'admin', 'ngo'), async (req, res) => {
  try {
    const { status, pickup, dropoff, routeOptimized } = req.body || {};
    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
    }
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    if (req.user.role === 'volunteer' && String(delivery.volunteerId || '') !== String(req.user.id)) {
      return res.status(403).json({ message: 'This delivery is not assigned to you' });
    }

    if (status !== undefined) delivery.status = status;
    if (typeof pickup === 'string') delivery.pickup = pickup.slice(0, 240);
    if (typeof dropoff === 'string') delivery.dropoff = dropoff.slice(0, 240);
    if (typeof routeOptimized === 'boolean') delivery.routeOptimized = routeOptimized;
    await delivery.save();

    if (delivery.donationId && status) {
      // Delivery progress drives the donation status so both views stay in sync.
      const donation = await Donation.findById(delivery.donationId);
      if (donation) {
        const nextStatus = status === 'assigned' ? 'accepted' : status;
        if (donation.status !== nextStatus) {
          donation.history.push({ status: nextStatus, at: new Date(), by: req.user.id, byRole: req.user.role, note: 'Updated from delivery' });
        }
        donation.status = nextStatus;
        if (status === 'picked_up') donation.pickedUpAt = new Date();
        if (status === 'delivered') donation.deliveredAt = new Date();
        if (!donation.volunteerId && delivery.volunteerId) donation.volunteerId = delivery.volunteerId;
        await donation.save();
        if (donation.donorId) {
          await Notification.create({
            userId: donation.donorId,
            title: 'Delivery updated',
            message: `${donation.foodName}: ${status.replace('_', ' ')}.`,
            type: status === 'delivered' ? 'success' : 'info',
            dedupeKey: `delivery:${delivery._id}:${status}`
          });
        }
      }
    }
    await audit(req, 'delivery.update', { entity: 'Delivery', entityId: delivery._id, meta: { status } });
    res.json(delivery);
  } catch (e) {
    console.error('delivery update', e);
    res.status(500).json({ message: 'Could not update delivery' });
  }
});

export default r;
