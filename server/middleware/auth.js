import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export const auth = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    const { id } = jwt.verify(t, process.env.JWT_SECRET);
    req.user = await User.findById(id).select('-password');
    if (!req.user) throw 0;
    next();
  } catch { res.status(401).json({ message: 'Please log in' }); }
};
export const admin = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });
