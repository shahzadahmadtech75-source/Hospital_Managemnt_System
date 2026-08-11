import mongoose from 'mongoose';

const accountantProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


const AccountantProfile = mongoose.model('AccountantProfile', accountantProfileSchema);

export default AccountantProfile;