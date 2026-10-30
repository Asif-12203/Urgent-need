import { Router } from 'express';
import nodemailer from 'nodemailer';
import Request from '../models/Request.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
const r = Router();
const esc = s => s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function notify(rq) {
  const donors = await User.find({ role: 'donor', reported: false, available: true, bloodGroup: rq.bloodGroup,
    district: new RegExp(`^${esc(rq.district)}$`, 'i'),
    $or: [{ lastDonation: null }, { lastDonation: { $lte: new Date(Date.now() - 90 * 864e5) } }] });
  if (!donors.length) return;
  const text = `${rq.urgency.toUpperCase()}: ${rq.bloodGroup} blood needed for ${rq.patientName} at ${rq.hospital || rq.district}. Contact: ${rq.contact}`;
  if (!process.env.SMTP_HOST) return console.log('[email skipped, no SMTP]', donors.length, 'donors ->', text);
  const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: +process.env.SMTP_PORT,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  await t.sendMail({ from: process.env.SMTP_USER, bcc: donors.map(d => d.email), subject: `LifeDrop: ${rq.bloodGroup} needed`, text });
}
const rank = { critical: 0, urgent: 1, normal: 2 };
r.get('/', async (req, res) => {
  const { bloodGroup, district } = req.query;
  const q = { status: 'open' };
  if (bloodGroup) q.bloodGroup = bloodGroup;
  if (district) q.district = new RegExp(esc(district), 'i');
  const list = await Request.find(q).populate('requester', 'name').sort('-createdAt');
  res.json(list.sort((a, b) => rank[a.urgency] - rank[b.urgency]));
});
r.post('/', auth, async (req, res) => {
  try {
    const { patientName, bloodGroup, district, hospital, contact, note, urgency, neededBy } = req.body;
    const rq = await Request.create({ patientName, bloodGroup, district, hospital, contact, note, urgency,
      neededBy: neededBy || undefined, requester: req.user._id });
    notify(rq).catch(console.error);
    res.status(201).json(rq);
  } catch (e) { res.status(400).json({ message: e.message }); }
});
r.patch('/:id/fulfill', auth, async (req, res) => {
  const rq = await Request.findById(req.params.id);
  if (!rq) return res.status(404).json({ message: 'Not found' });
  if (String(rq.requester) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed' });
  rq.status = 'fulfilled'; await rq.save(); res.json(rq);
});
export default r;
