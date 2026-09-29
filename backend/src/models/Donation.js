import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    foodName: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: 'Other',
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      default: 'kg',
    },

    description: String,

    preparationDate: String,

    expiryTime: String,

    pickupLocation: String,

    pickupDate: String,

    pickupTime: String,

    image: String,

    notes: String,

    status: {
      type: String,
      enum: [
        'available',
        'accepted',
        'picked_up',
        'in_transit',
        'delivered',
        'expired',
        'cancelled',
      ],
      default: 'available',
    },

    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    peopleServed: {
      type: Number,
      default: 0,
    },

    co2Saved: {
      type: Number,
      default: 0,
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

export default mongoose.model('Donation', schema);