import mongoose from 'mongoose';

const historySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byRole: String,
    note: { type: String, maxlength: 400 }
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    foodName: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, default: 'Other', maxlength: 80 },
    quantity: { type: Number, required: true, min: 0.01, max: 1000000 },
    unit: { type: String, enum: ['kg', 'litres', 'packs', 'meals'], default: 'kg' },
    description: { type: String, maxlength: 2000 },
    preparationDate: String,
    expiryTime: String,
    // Real expiry instant, used for automatic expiry handling and validation.
    expiresAt: { type: Date, index: true },
    pickupLocation: { type: String, required: true, trim: true, maxlength: 240 },
    pickupDate: String,
    pickupTime: String,
    // Optional food photo. Stored as a data URL up to ~1.5 MB (validated server side).
    image: { type: String },
    notes: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ['available', 'accepted', 'picked_up', 'in_transit', 'delivered', 'expired', 'cancelled'],
      default: 'available',
      index: true
    },
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    peopleServed: { type: Number, default: 0, min: 0 },
    co2Saved: { type: Number, default: 0, min: 0 },
    history: { type: [historySchema], default: [] },
    deliveredAt: Date,
    pickedUpAt: Date
  },
  { timestamps: true }
);

schema.index({ status: 1, createdAt: -1 });
schema.index({ donorId: 1, createdAt: -1 });
schema.index({ ngoId: 1, createdAt: -1 });
schema.index({ volunteerId: 1, createdAt: -1 });
schema.index({ foodName: 'text', description: 'text', pickupLocation: 'text' });

export default mongoose.model('Donation', schema);
