import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pickup: String,
    dropoff: String,
    status: {
      type: String,
      enum: ['assigned', 'picked_up', 'in_transit', 'delivered'],
      default: 'assigned'
    },
    distanceKm: { type: Number, default: 4.2 },
    etaMinutes: { type: Number, default: 24 },
    routeOptimized: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
schema.index({ volunteerId: 1, createdAt: -1 });
schema.index({ donationId: 1 });
export default mongoose.model('Delivery', schema);
