import mongoose from 'mongoose';

// Single-document platform settings (key = 'platform').
const schema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'platform' },
    platformName: { type: String, default: 'FoodBridge', maxlength: 120 },
    supportEmail: { type: String, default: '', maxlength: 160 },
    autoExpireHours: { type: Number, default: 24, min: 1, max: 720 },
    requireNgoVerification: { type: Boolean, default: true },
    allowDonorImages: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Setting', schema);
