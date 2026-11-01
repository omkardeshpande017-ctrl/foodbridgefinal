import { Router } from 'express';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const r = Router();

// ---------------------------------------------------------------------------
// GET /api/ai/insights
// Deterministic, data-derived decision support. Every figure below is computed
// from the live collections; nothing is hard-coded, and the response is flagged
// so the UI never presents it as a machine-learning model.
// ---------------------------------------------------------------------------
r.get('/insights', auth, async (req, res) => {
  try {
    const [donations, users] = await Promise.all([Donation.find().lean(), User.find().lean()]);

    const totalFood = donations.reduce((s, d) => s + (d.quantity || 0), 0);
    const byCategory = {};
    donations.forEach((d) => {
      const k = d.category || 'Other';
      byCategory[k] = (byCategory[k] || 0) + (d.quantity || 0);
    });
    const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

    const open = donations.filter((d) => ['available', 'accepted'].includes(d.status));
    const stale = open.filter((d) => {
      const t = new Date(d.pickupDate || d.createdAt).getTime();
      return Date.now() - t > 2 * 24 * 60 * 60 * 1000;
    });
    const ngoCount = users.filter((u) => u.role === 'ngo' && u.status === 'active').length;
    const volunteerCount = users.filter((u) => u.role === 'volunteer' && u.status === 'active').length;

    const insights = [];
    if (categories[0]) {
      insights.push({
        title: `Largest supply: ${categories[0][0]}`,
        text: `${Math.round(categories[0][1])} kg of ${categories[0][0]} has been donated — ${Math.round(
          (categories[0][1] / (totalFood || 1)) * 100
        )}% of all rescued food.`,
        severity: 'low'
      });
    }
    if (stale.length) {
      insights.push({
        title: 'Pickup risk',
        text: `${stale.length} donation${stale.length === 1 ? '' : 's'} have been open for more than 48 hours. Prioritise a partner match.`,
        severity: 'high'
      });
    } else {
      insights.push({
        title: 'Pickups on schedule',
        text: 'No donation has been waiting more than 48 hours for a partner.',
        severity: 'low'
      });
    }
    insights.push({
      title: 'Partner capacity',
      text: `${ngoCount} active NGO partner${ngoCount === 1 ? '' : 's'} and ${volunteerCount} volunteer${
        volunteerCount === 1 ? '' : 's'
      } are available for ${open.length} open donation${open.length === 1 ? '' : 's'}.`,
      severity: open.length > Math.max(1, ngoCount * 3) ? 'medium' : 'low'
    });

    // Simple 7-day projection: average daily volume of the last 14 days, with
    // the same weekday weighting, so the forecast reflects actual activity.
    const now = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
      const start = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      const qty = donations
        .filter((d) => {
          const t = new Date(d.createdAt).getTime();
          return t >= start.getTime() && t < end.getTime();
        })
        .reduce((s, d) => s + (d.quantity || 0), 0);
      return { date: start, qty };
    });
    const avg = days.reduce((s, d) => s + d.qty, 0) / (days.length || 1);
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const sameWeekday = days.filter((d) => d.date.getDay() === date.getDay());
      const baseline = sameWeekday.length
        ? sameWeekday.reduce((s, d) => s + d.qty, 0) / sameWeekday.length
        : avg;
      return {
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        demand: Math.round(baseline)
      };
    });

    const dataPoints = donations.length + users.length;
    const confidence = Math.min(0.95, 0.35 + dataPoints / 200);

    res.json({
      isDemo: false,
      method: 'rule-based',
      confidence: Number(confidence.toFixed(2)),
      generatedAt: new Date().toISOString(),
      insights,
      forecast
    });
  } catch (e) {
    console.error('ai insights', e);
    res.status(500).json({ message: 'Could not build insights' });
  }
});

export default r;
