import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import auth from './routes/auth.js';
import donors from './routes/donors.js';
import requests from './routes/requests.js';
import admin from './routes/admin.js';

const app = express();
app.use(cors(), express.json());

// Connect once and reuse (works on serverless and normal servers)
let ready;
const connect = () => ready ||= (async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  await mongoose.connect(process.env.MONGO_URI);
  if (!(await User.findOne({ role: 'admin' })))
    await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL, role: 'admin',
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10) });
})().catch(e => { ready = null; throw e; });

app.use('/api', async (req, res, next) => {
  try { await connect(); next(); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/', (_, res) => res.json({ status: 'LifeDrop API running' }));
app.use('/api/auth', auth);
app.use('/api/donors', donors);
app.use('/api/requests', requests);
app.use('/api/admin', admin);

if (!process.env.VERCEL) {
  await connect();
  app.listen(process.env.PORT || 5000, () => console.log('LifeDrop API running'));
}
export default app;
