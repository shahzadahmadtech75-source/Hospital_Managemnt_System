import mongoose from "mongoose";
const emergencyContactSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientProfile',
    required: true,
  },
  patientName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  emergencyType: {
    type: String,
    enum: ['medical', 'accident', 'urgent_care', 'other'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'cancelled'],
    default: 'pending',
  },
  adminNote: {
    type: String,
    default: null,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('EmergencyContact', emergencyContactSchema);