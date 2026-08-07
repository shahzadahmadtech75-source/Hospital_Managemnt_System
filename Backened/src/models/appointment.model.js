

import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    // Reference to the patient requesting the appointment
    // Links to PatientProfile for patient-specific medical history and demographics
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: [true, 'Patient reference is required']
    },

    // Reference to the doctor who will attend to the patient
    // Links to DoctorProfile for doctor's specialization and availability
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: [true, 'Doctor reference is required']
    },

    // Date of the appointment - essential for scheduling and calendar management
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required']
    },

    // Time of the appointment - allows scheduling specific slots during the day
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      // Store as string to handle various time formats (e.g., "09:00 AM", "14:30")
      validate: {
        validator: function(v) {
          // Basic validation for common time formats (HH:MM AM/PM or HH:MM)
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](?:\s?(?:AM|PM))?$/i.test(v);
        },
        message: props => `${props.value} is not a valid time format`
      }
    },

    // Reason for the appointment - captures patient's concerns for the doctor
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },

    
createdBy: {
  type: String,
  enum: ['patient', 'receptionist', 'doctor', 'admin'],
  required: true,
  default: 'patient'
},




createdByUser: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
},

    // Current status of the appointment - tracks the appointment lifecycle
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending'
    },


    // Additional notes - captures medical notes, special requests, or follow-up details
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    caseHistory: {
  type: String,
  trim: true,
  maxlength: [2000, 'Case history cannot exceed 2000 characters']
},
medications: {
  type: String,
  trim: true,
  maxlength: [1000, 'Medications cannot exceed 1000 characters']
},

consultationNotes: {
  type: String,
  trim: true,
  maxlength: [1000, 'Consultation notes cannot exceed 1000 characters']
},
consultationDate: {
  type: Date,
  default: null
}
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Compound index to prevent duplicate appointments for the same patient and doctor at the same time
appointmentSchema.index(
  { patient: 1, doctor: 1, appointmentDate: 1, appointmentTime: 1 },
  { unique: true }
);

// Index for querying appointments by patient
appointmentSchema.index({ patient: 1, status: 1 });

// Index for querying appointments by doctor
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });

// Index for querying appointments by date (for calendar views)
appointmentSchema.index({ appointmentDate: 1 });

// Index for filtering appointments by status
appointmentSchema.index({ status: 1 });

// Index for time-based queries (e.g., upcoming appointments)
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;