// src/models/prescription.model.js

import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    // Reference to the patient this prescription belongs to
    // Links to PatientProfile for patient demographics and medical history
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: [true, 'Patient reference is required']
    },

    // Reference to the doctor who prescribed the medication
    // Links to DoctorProfile for doctor's specialization and credentials
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: [true, 'Doctor reference is required']
    },

    // Reference to the appointment during which this prescription was created
    // Links to Appointment for consultation context and history
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required']
    },

    // Detailed medical history and patient condition documented during consultation
    // Provides context for why medications were prescribed
    caseHistory: {
      type: String,
      trim: true,
      maxlength: [2000, 'Case history cannot exceed 2000 characters']
    },

    // Array of prescribed medications with detailed instructions
    // Each medication entry contains specific dosage and administration guidelines
    medications: [
      {
        medicineName: {
          type: String,
          required: [true, 'Medicine name is required'],
          trim: true
        },
        dosage: {
          type: String,
          required: [true, 'Dosage is required'],
          trim: true,
          // Example: "500mg", "10ml", "2 tablets"
        },
        frequency: {
          type: String,
          required: [true, 'Frequency is required'],
          trim: true,
          // Example: "Twice daily", "Every 6 hours", "Once daily"
        },
        duration: {
          type: String,
          required: [true, 'Duration is required'],
          trim: true,
          // Example: "7 days", "2 weeks", "1 month"
        },
        instructions: {
          type: String,
          trim: true,
          maxlength: [500, 'Instructions cannot exceed 500 characters'],
          // Example: "Take after meals", "Avoid alcohol", "With plenty of water"
        }
      }
    ],

    // Additional notes, warnings, or special instructions for the patient
    
    extraNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Extra notes cannot exceed 1000 characters']
    },

    // Date when the prescription was issued
    // Defaults to current date/time when the prescription is created
    prescriptionDate: {
      type: Date,
      required: [true, 'Prescription date is required'],
      default: Date.now
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);


prescriptionSchema.index({ patient: 1 });


prescriptionSchema.index({ doctor: 1 });


prescriptionSchema.index({ appointment: 1 });


prescriptionSchema.index({ patient: 1, prescriptionDate: -1 });


prescriptionSchema.index({ doctor: 1, prescriptionDate: -1 });


prescriptionSchema.index({ prescriptionDate: 1 });


prescriptionSchema.index({ 'medications.medicineName': 'text' });



prescriptionSchema.virtual('medicationCount').get(function() {
  return this.medications?.length || 0;
});


prescriptionSchema.virtual('hasCaseHistory').get(function() {
  return !!(this.caseHistory && this.caseHistory.trim().length > 0);
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;