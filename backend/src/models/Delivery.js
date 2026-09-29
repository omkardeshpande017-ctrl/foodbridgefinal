import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
    },

    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    pickup: String,

    dropoff: String,

    status: {
      type: String,
      enum: ['assigned', 'picked_up', 'in_transit', 'delivered'],
      default: 'assigned',
    },

    distanceKm: {
      type: Number,
      default: 4.2,
    },

    etaMinutes: {
      type: Number,
      default: 24,
    },

    routeOptimized: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Delivery', schema);