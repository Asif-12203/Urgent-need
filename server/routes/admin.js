import { Router } from 'express';
import User from '../models/User.js';
import Request from '../models/Request.js';
import { auth, admin } from '../middleware/auth.js';
const r = Router();
r.use(auth, admin);
r.get('/stats', async (_, res) => res.json({
  users: await User.countDocuments(), donors: await User.countDocuments({ role: 'donor' }),
  open: await Request.countDocuments({ status: 'open' }), fulfilled: await Request.countDocuments({ status: 'fulfilled' }) }));
r.get('/users', async (_, res) => res.json(await User.find().select('-password').sort('-reports -createdAt')));
r.patch('/users/:id/flag', async (req, res) => {
  const u = await User.findById(req.params.id); u.reported = !u.reported; if (!u.reported) u.reports = 0;
  await u.save(); res.json(u);
});
r.delete('/users/:id', async (req, res) => { await User.findByIdAndDelete(req.params.id); res.json({ ok: true }); });
r.get('/requests', async (_, res) => res.json(await Request.find().populate('requester', 'name').sort('-createdAt')));
r.delete('/requests/:id', async (req, res) => { await Request.findByIdAndDelete(req.params.id); res.json({ ok: true }); });
export default r;
