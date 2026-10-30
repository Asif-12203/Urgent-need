import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
const r = Router();
const token = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const safe = u => { const o = u.toObject(); delete o.password; return o; };

r.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, bloodGroup, district, phone } = req.body;
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a 6+ character password are required' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already registered' });
    if (role === 'donor' && (!bloodGroup || !district)) return res.status(400).json({ message: 'Donors need blood group and district' });
    const u = await User.create({ name, email, password: await bcrypt.hash(password, 10),
      role: role === 'requester' ? 'requester' : 'donor', bloodGroup: bloodGroup || undefined, district, phone });
    res.status(201).json({ token: token(u), user: safe(u) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
r.post('/login', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(400).json({ message: 'Wrong email or password' });
  res.json({ token: token(u), user: safe(u) });
});
r.get('/me', auth, (req, res) => res.json(req.user));
r.put('/me', auth, async (req, res) => {
  const { name, phone, district, bloodGroup, available } = req.body;
  Object.assign(req.user, { name, phone, district, bloodGroup, available });
  await req.user.save(); res.json(req.user);
});
r.post('/me/donations', auth, async (req, res) => {
  const date = new Date(req.body.date || Date.now());
  req.user.donations.push({ date, place: req.body.place });
  if (!req.user.lastDonation || date > req.user.lastDonation) req.user.lastDonation = date;
  await req.user.save(); res.json(req.user);
});
export default r;
