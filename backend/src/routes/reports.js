import { Router } from 'express';
import mongoose from 'mongoose';
import Report from '../models/Report.js';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Delivery from '../models/Delivery.js';
import { auth, roles } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import { pagination, str } from '../utils/validate.js';

const r = Router();

// Platform impact summary (admin reports page).
r.get('/summary', auth, roles('admin'), async (req, res) => {
  try {
    const [donations, users, deliveries, openReports] = await Promise.all([
      Donation.find().lean(),
      User.countDocuments(),
      Delivery.countDocuments(),
      Report.countDocuments({ status: { $in: ['open', 'investigating'] } })
    ]);
    const delivered = donations.filter((d) => d.status === 'delivered');
    res.json({
      generatedAt: new Date().toISOString(),
      users,
      donations: donations.length,
      deliveries,
      openReports,
      delivered: delivered.length,
      totalFood: Math.round(donations.reduce((s, d) => s + (d.quantity || 0), 0)),
      peopleServed: donations.reduce((s, d) => s + (d.peopleServed || 0), 0),
      co2Saved: Math.round(donations.reduce((s, d) => s + (d.co2Saved || 0), 0)),
      successRate: donations.length ? Math.round((delivered.length / donations.length) * 100) : 0
    });
  } catch (e) {
    res.status(500).json({ message: 'Could not build report' });
  }
});

// Any signed-in user can raise a report/dispute.
r.post('/', auth, async (req, res) => {
  try {
    const subject = str(req.body?.subject, 160);
    const description = str(req.body?.description, 4000);
    if (!subject || !description) return res.status(400).json({ message: 'A subject and description are required' });
    const category = ['donation', 'account', 'delivery', 'other'].includes(req.body?.category) ? req.body.category : 'other';
    const report = await Report.create({
      subject,
      description,
      category,
      donationId: mongoose.isValidObjectId(req.body?.donationId) ? req.body.donationId : undefined,
      reportedUserId: mongoose.isValidObjectId(req.body?.reportedUserId) ? req.body.reportedUserId : undefined,
      raisedBy: req.user.id
    });
    await audit(req, 'report.create', { entity: 'Report', entityId: report._id, meta: { category } });
    res.status(201).json(report);
  } catch (e) {
    res.status(400).json({ message: 'Could not create report' });
  }
});

// A user sees the reports they raised.
r.get('/mine', auth, async (req, res) => {
  try {
    res.json(await Report.find({ raisedBy: req.user.id }).sort({ createdAt: -1 }).limit(100).lean());
  } catch (e) {
    res.status(500).json({ message: 'Could not load reports' });
  }
});

// Admin: triage queue.
r.get('/', auth, roles('admin'), async (req, res) => {
  try {
    const { page, limit, skip } = pagination(req.query, { defaultLimit: 50, maxLimit: 200 });
    const q = {};
    if (['open', 'investigating', 'resolved', 'dismissed'].includes(req.query.status)) q.status = req.query.status;
    const [items, total] = await Promise.all([
      Report.find(q)
        .populate('raisedBy', 'name email role')
        .populate('reportedUserId', 'name email role')
        .populate('donationId', 'foodName status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(q)
    ]);
    res.json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) {
    res.status(500).json({ message: 'Could not load reports' });
  }
});

r.patch('/:id', auth, roles('admin'), async (req, res) => {
  try {
    const { status, resolution } = req.body || {};
    if (!['open', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid report status' });
    }
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.status = status;
    if (resolution !== undefined) report.resolution = str(resolution, 2000);
    if (['resolved', 'dismissed'].includes(status)) {
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
    }
    await report.save();
    await audit(req, 'report.update', { entity: 'Report', entityId: report._id, meta: { status } });
    res.json(report);
  } catch (e) {
    res.status(400).json({ message: 'Could not update report' });
  }
});

export default r;
