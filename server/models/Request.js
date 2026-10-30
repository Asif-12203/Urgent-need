import mongoose from 'mongoose';
const s = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  district: { type: String, required: true },
  hospital: String, contact: { type: String, required: true }, note: String,
  urgency: { type: String, enum: ['normal', 'urgent', 'critical'], default: 'normal' },
  neededBy: Date,
  status: { type: String, enum: ['open', 'fulfilled'], default: 'open' },
}, { timestamps: true });
export default mongoose.model('Request', s);
