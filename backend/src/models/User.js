import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, maxlength: 30 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['donor', 'ngo', 'volunteer', 'admin'], required: true, index: true },
    location: { type: String, trim: true, maxlength: 160 },
    organization: { type: String, trim: true, maxlength: 160 },
    registrationNumber: { type: String, trim: true, maxlength: 80 },
    skills: [{ type: String, trim: true, maxlength: 60 }],
    // NGO verification: NGOs start pending until an administrator approves them.
    verification: {
      status: { type: String, enum: ['not_required', 'pending', 'verified', 'rejected'], default: 'not_required' },
      reviewedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      note: { type: String, maxlength: 400 }
    },
    // Volunteer availability toggles.
    available: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    lastLoginAt: Date,
    // SHA-256 of the emailed reset token; the raw token is never stored.
    resetTokenHash: { type: String, index: true, select: false },
    resetTokenExpires: { type: Date, select: false }
  },
  { timestamps: true }
);

schema.index({ role: 1, status: 1 });
schema.index({ createdAt: -1 });

export default mongoose.model('User', schema);
