import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: [true, 'Patient is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: [true, 'Doctor is required'],
    },
    type: {
      type: String,
      required: [true, 'Report type is required'],
      enum: {
        values: ['operation', 'birth', 'death'],
        message: 'Report type must be operation, birth, or death',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    reportDate: {
      type: Date,
      required: [true, 'Report date is required'],
    },
    pdfUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


reportSchema.index({ type: 1 });


reportSchema.index({ reportDate: -1 });


reportSchema.index({ doctor: 1, type: 1 });


reportSchema.index({ patient: 1, type: 1 });


reportSchema.index({ doctor: 1, reportDate: -1 });


const Report = mongoose.model('Report', reportSchema);

export default Report;
