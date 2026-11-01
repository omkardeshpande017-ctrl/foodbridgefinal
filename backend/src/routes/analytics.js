import { Router } from 'express';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Delivery from '../models/Delivery.js';
import Report from '../models/Report.js';
import AuditLog from '../models/AuditLog.js';
import Setting from '../models/Setting.js';
import { auth, roles } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import { pagination } from '../utils/validate.js';

const r = Router();
const DAY = 24 * 60 * 60 * 1000;

const dayName = (d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

// ---------------------------------------------------------------------------
// GET /api/analytics/summary — scoped to the caller's role, from real records.
// ---------------------------------------------------------------------------
r.get('/summary', auth, async (req, res) => {
  try {
    const base =
      req.user.role === 'donor'
        ? { donorId: req.user.id }
        : req.user.role === 'ngo'
        ? { ngoId: req.user.id }
        : req.user.role === 'volunteer'
        ? { volunteerId: req.user.id }
        : {};
    const ds = await Donation.find(base).lean();
    const total = ds.reduce((s, d) => s + (d.quantity || 0), 0);
    const delivered = ds.filter((d) => d.status === 'delivered');
    const pending = ds.filter((d) => ['available', 'accepted', 'picked_up', 'in_transit'].includes(d.status));
    res.json({
      totalFood: Math.round(total),
      totalDonations: ds.length,
      active: pending.length,
      completed: delivered.length,
      pending: pending.length,
      expired: ds.filter((d) => d.status === 'expired').length,
      cancelled: ds.filter((d) => d.status === 'cancelled').length,
      peopleServed: ds.reduce((s, d) => s + (d.peopleServed || 0), 0),
      co2Saved: Math.round(ds.reduce((s, d) => s + (d.co2Saved || 0), 0)),
      efficiency: ds.length ? Math.round((delivered.length / ds.length) * 100) : 0
    });
  } catch (e) {
    console.error('analytics summary', e);
    res.status(500).json({ message: 'Could not load summary' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/analytics/overview — network-wide dashboard data.
// ---------------------------------------------------------------------------
r.get('/overview', auth, async (req, res) => {
  try {
    const [donations, users, deliveries, openReports] = await Promise.all([
      Donation.find().lean(),
      User.find().select('role status verification').lean(),
      Delivery.countDocuments(),
      Report.countDocuments({ status: { $in: ['open', 'investigating'] } })
    ]);

    const byCat = {};
    const byStatus = {};
    donations.forEach((d) => {
      byCat[d.category || 'Other'] = (byCat[d.category || 'Other'] || 0) + (d.quantity || 0);
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    });

    const today = new Date();
    const trend = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(today.getTime() - (6 - i) * DAY);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + DAY);
      const within = (t) => t >= start.getTime() && t < end.getTime();
      const posted = donations
        .filter((d) => within(new Date(d.createdAt).getTime()))
        .reduce((s, d) => s + (d.quantity || 0), 0);
      const delivered = donations
        .filter((d) => d.status === 'delivered' && within(new Date(d.deliveredAt || d.updatedAt).getTime()))
        .reduce((s, d) => s + (d.quantity || 0), 0);
      return { name: dayName(start), food: Math.round(posted), demand: Math.round(delivered) };
    });

    // Monthly donation trend for the last 6 months.
    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      const start = d.getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const inMonth = donations.filter((x) => {
        const t = new Date(x.createdAt).getTime();
        return t >= start && t < end;
      });
      return {
        month: d.toLocaleString('en-US', { month: 'short' }),
        donations: inMonth.length,
        delivered: inMonth.filter((x) => x.status === 'delivered').length,
        quantity: Math.round(inMonth.reduce((s, x) => s + (x.quantity || 0), 0))
      };
    });

    const delivered = donations.filter((d) => d.status === 'delivered');
    const roleCount = (role, extra = () => true) => users.filter((u) => u.role === role && extra(u)).length;

    res.json({
      users: users.length,
      donors: roleCount('donor'),
      activeDonors: roleCount('donor', (u) => u.status === 'active'),
      ngos: roleCount('ngo'),
      verifiedNgos: roleCount('ngo', (u) => u.verification?.status === 'verified'),
      volunteers: roleCount('volunteer'),
      activeVolunteers: roleCount('volunteer', (u) => u.status === 'active'),
      donations: donations.length,
      deliveries,
      openReports,
      pending: donations.filter((d) => ['available', 'accepted', 'picked_up', 'in_transit'].includes(d.status)).length,
      expired: donations.filter((d) => d.status === 'expired').length,
      successRate: donations.length ? Math.round((delivered.length / donations.length) * 100) : 0,
      efficiency: donations.length ? Math.round((delivered.length / donations.length) * 100) : 0,
      totalFood: Math.round(donations.reduce((s, d) => s + (d.quantity || 0), 0)),
      peopleServed: donations.reduce((s, d) => s + (d.peopleServed || 0), 0),
      co2Saved: Math.round(donations.reduce((s, d) => s + (d.co2Saved || 0), 0)),
      byCategory: Object.entries(byCat)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value),
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      trend,
      monthly
    });
  } catch (e) {
    console.error('analytics overview', e);
    res.status(500).json({ message: 'Could not load analytics' });
  }
});

// ---------------------------------------------------------------------------
// Admin: audit log browser.
// ---------------------------------------------------------------------------
r.get('/audit', auth, roles('admin'), async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query, { defaultLimit: 50, maxLimit: 200 });
    const q = {};
    if (req.query.action) q.action = String(req.query.action).slice(0, 80);
    if (req.query.entity) q.entity = String(req.query.entity).slice(0, 40);
    const [items, total] = await Promise.all([
      AuditLog.find(q).populate('actorId', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(q)
    ]);
    res.json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) {
    res.status(500).json({ message: 'Could not load audit log' });
  }
});

// ---------------------------------------------------------------------------
// Admin: platform settings.
// ---------------------------------------------------------------------------
r.get('/settings', auth, roles('admin'), async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate(
      { key: 'platform' },
      { $setOnInsert: { key: 'platform' } },
      { upsert: true, new: true }
    ).lean();
    res.json(settings);
  } catch (e) {
    res.status(500).json({ message: 'Could not load settings' });
  }
});

r.patch('/settings', auth, roles('admin'), async (req, res) => {
  try {
    const allowed = ['platformName', 'supportEmail', 'autoExpireHours', 'requireNgoVerification', 'allowDonorImages', 'maintenanceMode'];
    const update = {};
    for (const key of allowed) if (req.body && Object.hasOwn(req.body, key)) update[key] = req.body[key];
    const settings = await Setting.findOneAndUpdate(
      { key: 'platform' },
      { $set: update, $setOnInsert: { key: 'platform' } },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    await audit(req, 'settings.update', { entity: 'Setting', entityId: settings._id, meta: update });
    res.json(settings);
  } catch (e) {
    res.status(400).json({ message: 'Could not update settings' });
  }
});

export default r;
