import mongoose from 'mongoose';
const s = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'donor', 'requester'], default: 'donor' },
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  district: String, phone: String,
  lastDonation: Date,
  available: { type: Boolean, default: true },
  reported: { type: Boolean, default: false },
  reports: { type: Number, default: 0 },
  donations: [{ date: Date, place: String }],
}, { timestamps: true });
export default mongoose.model('User', s);
