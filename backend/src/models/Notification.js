import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    link: { type: String, maxlength: 240 },
    read: { type: Boolean, default: false, index: true },
    // Prevents duplicate notifications for the same event.
    dedupeKey: { type: String, index: true }
  },
  { timestamps: true }
);

schema.index({ userId: 1, createdAt: -1 });
schema.index({ userId: 1, dedupeKey: 1 }, { unique: true, sparse: true });

export default mongoose.model('Notification', schema);
