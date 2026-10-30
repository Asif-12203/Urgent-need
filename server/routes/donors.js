import { Router } from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
const r = Router();
const DAY = 864e5;
r.get('/', async (req, res) => {
  const { bloodGroup, district, available } = req.query;
  const q = { role: 'donor', reported: false };
  if (bloodGroup) q.bloodGroup = bloodGroup;
  if (district) q.district = new RegExp(district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (available === 'true') {
    q.available = true;
    q.$or = [{ lastDonation: null }, { lastDonation: { $lte: new Date(Date.now() - 90 * DAY) } }];
  }
  res.json(await User.find(q).select('name bloodGroup district phone lastDonation available').sort('-updatedAt'));
});
r.post('/:id/report', auth, async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, { $inc: { reports: 1 } }, { new: true });
  if (u && u.reports >= 3) { u.reported = true; await u.save(); }
  res.json({ message: 'Report sent to admins' });
});
export default r;
