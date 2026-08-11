import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Department description is required'],
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);



const Department = mongoose.model('Department', departmentSchema);

export default Department;