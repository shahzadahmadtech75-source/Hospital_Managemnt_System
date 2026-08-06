

import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema(
  {
    // One-to-one relationship with User model
    // Links doctor-specific professional data to authentication user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true
    },

    // Doctor's full legal name - professional identification
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },

    // Primary department - determines which department the doctor belongs to
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },

    // Medical specialization - defines the doctor's area of expertise
    specialization: {
      type: String,
      trim: true
    },

    // Educational qualifications - medical degrees, certifications, and training
    qualification: {
      type: String,
      trim: true
    },

    // Years of professional experience - indicates expertise level
    experienceYears: {
      type: Number,
      min: [0, 'Experience years cannot be negative'],
      default: 0
    },

    // Contact number - for patient communication and emergency calls
    phone: {
      type: String,
      trim: true
    },

    // Physical address - clinic or hospital location
    address: {
      type: String,
      trim: true
    },

    // Consultation fee - cost per appointment in the local currency
    consultationFee: {
      type: Number,
      min: [0, 'Consultation fee cannot be negative']
    },

    // Professional description - brief bio, expertise areas, and approach
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    // Working hours and schedule - e.g., "Mon-Fri 9:00 AM - 5:00 PM"
    availability: {
      type: String,
      trim: true
    },

    // Current availability status - indicates if doctor is accepting appointments
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Index for department-based queries
doctorProfileSchema.index({ department: 1 });

// Index for specialization-based queries
doctorProfileSchema.index({ specialization: 1 });

// Index for availability status (finding available doctors)
doctorProfileSchema.index({ isAvailable: 1 });

// Compound index for department and availability
doctorProfileSchema.index({ department: 1, isAvailable: 1 });

// Index for search by full name
doctorProfileSchema.index({ fullName: 'text' });

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);

export default DoctorProfile;