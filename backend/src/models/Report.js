import mongoose from 'mongoose';

// Reports and disputes raised by any signed-in user, triaged by administrators.
const schema = new mongoose.Schema(
  {
    subject: { type: String, required: true, maxlength: 160 },
    description: { type: String, required: true, maxlength: 4000 },
    category: { type: String, enum: ['donation', 'account', 'delivery', 'other'], default: 'other' },
    donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'dismissed'], default: 'open', index: true },
    resolution: { type: String, maxlength: 2000 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date
  },
  { timestamps: true }
);

schema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Report', schema);
