
import mongoose from 'mongoose';

const patientProfileSchema = new mongoose.Schema(
  {
    // One-to-one relationship with User model
    // This links patient-specific data to the authentication user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    // Patient's full legal name - belongs here as it's medical/administrative data
    fullName: {
      type: String,
      required: [true, 'Full name is required']
    },

    // Contact information - specific to patient's personal reachability
    phone: {
      type: String
    },

    // Physical address - needed for medical records and correspondence
    address: {
      type: String
    },

    // Gender - clinically relevant information for medical history
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },

    // Date of birth - critical for age calculation and medical treatment
    dateOfBirth: {
      type: Date
    },

    // Blood group - essential for emergency medical procedures
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },

    // Emergency contact - separate from patient's own contact for urgent situations
    emergencyContact: {
      type: String
    },

    // Profile image override - allows patient to have different image than user account
    // Falls back to User.profileImage if not set
    profileImage: {
      type: String
    },

    // Tracks if patient has completed their medical profile
    // Used for onboarding and compliance purposes
    isProfileCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);



const PatientProfile = mongoose.model('PatientProfile', patientProfileSchema);

export default PatientProfile;