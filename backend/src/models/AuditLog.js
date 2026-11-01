import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorRole: String,
    action: { type: String, required: true, index: true },
    entity: { type: String, index: true },
    entityId: { type: String, index: true },
    meta: { type: mongoose.Schema.Types.Mixed },
    ip: String,
    userAgent: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

schema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', schema);
