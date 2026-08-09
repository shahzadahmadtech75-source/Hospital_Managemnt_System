// src/models/admission.model.js

import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: [true, 'Patient reference is required']
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: [true, 'Doctor reference is required']
    },
    
    bedNumber: {
      type: String,
      required: [true, 'Bed number is required'],
      trim: true
    },
    bedType: {
      type: String,
      required: [true, 'Bed type is required'],
      enum: {
        values: ['general', 'semi-private', 'private', 'ICU'],
        message: '{VALUE} is not a valid bed type. Allowed types: general, semi-private, private, ICU'
      }
    },
    admissionDate: {
      type: Date,
      required: [true, 'Admission date is required'],
      default: Date.now
    },
    dischargeDate: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['admitted', 'discharged'],
        message: '{VALUE} is not a valid status. Allowed statuses: admitted, discharged'
      },
      default: 'admitted'
    }
  },
  {
    timestamps: true 
  }
);

// --- CLEANED INDEXES ---

// Keeps index for doctor lookups
admissionSchema.index({ doctor: 1 });

// Keeps index for date-range dashboard reporting
admissionSchema.index({ admissionDate: 1 });

// PERFECT COMPOUND INDEXES (These handle your single-field lookups too)
// 1. Handles: find({status, patient}), find({status}), AND find({status, bedNumber}) indirectly via index intersection
admissionSchema.index({ status: 1, patient: 1 });
admissionSchema.index({ status: 1, bedNumber: 1 });

// 2. Handles: find({patient, admissionDate}) AND find({patient}) due to left-bound prefix rule
admissionSchema.index({ patient: 1, admissionDate: -1 });


// --- VIRTUALS ---
admissionSchema.virtual('isCurrentlyAdmitted').get(function() {
  return this.status === 'admitted';
});

admissionSchema.virtual('isDischarged').get(function() {
  return this.status === 'discharged';
});

admissionSchema.virtual('lengthOfStay').get(function() {
  if (this.dischargeDate && this.admissionDate) {
    const diffTime = Math.abs(this.dischargeDate - this.admissionDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});


// --- METHODS & STATICS ---
admissionSchema.methods.discharge = function() {
  if (this.status === 'discharged') {
    throw new Error('Patient is already discharged');
  }
  this.status = 'discharged';
  this.dischargeDate = new Date();
  return this.save();
};

admissionSchema.statics.readmit = async function(patientId, doctorId, bedData) {
  const activeAdmission = await this.findOne({
    patient: patientId,
    status: 'admitted'
  });

  if (activeAdmission) {
    throw new Error('Patient is currently admitted. Please discharge first.');
  }

  return this.create({
    patient: patientId,
    doctor: doctorId,
    bedNumber: bedData.bedNumber,
    bedType: bedData.bedType,
    reason: bedData.reason || ''
  });
};


// --- MIDDLEWARE ---
admissionSchema.pre('save', async function(next) {
  if (this.status === 'admitted' && this.isNew) {
    const existingAdmission = await this.constructor.findOne({
      bedNumber: this.bedNumber,
      status: 'admitted'
    });

    if (existingAdmission) {
      const error = new Error(`Bed number ${this.bedNumber} is currently occupied`);
      error.status = 409;
      return next(error);
    }
  }
  next;
});

const Admission = mongoose.model('Admission', admissionSchema);
export default Admission;
