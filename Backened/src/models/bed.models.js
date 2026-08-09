import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema(
  {
    bedNumber: {
      type: String,
      required: [true, 'Bed number is required'],
      trim: true,
      unique: true,
    },
    bedType: {
      type: String,
      required: [true, 'Bed type is required'],
      enum: {
        values: ['general', 'semi-private', 'private', 'ICU'],
        message: 'Bed type must be general, semi-private, private, or ICU',
      },
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'occupied'],
        message: 'Status must be available or occupied',
      },
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
bedSchema.index({ bedNumber: 1 }, { unique: true });
bedSchema.index({ status: 1 });
bedSchema.index({ bedType: 1 });
bedSchema.index({ status: 1, bedType: 1 });

const Bed = mongoose.model('Bed', bedSchema);

export default Bed;