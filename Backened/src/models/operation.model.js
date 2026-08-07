// src/models/operation.model.js

import mongoose from 'mongoose';

const operationSchema = new mongoose.Schema(
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
    description: {
      type: String,
      required: [true, 'Operation description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    operationDate: {
      type: Date,
      required: [true, 'Operation date is required']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid status. Allowed statuses: scheduled, completed, cancelled'
      },
      default: 'completed'
    }
  },
  {
    timestamps: true 
  }
);

// ============================================
// CLEANED INDEXES
// ============================================

// Keeps index for date-only lookups (e.g., broad schedule views or calendars)
operationSchema.index({ operationDate: 1 });

// PERFECT COMPOUND INDEXES (These completely cover your single-field lookups)
// 1. Handles: find({patient, operationDate}) AND find({patient})
operationSchema.index({ patient: 1, operationDate: -1 });

// 2. Handles: find({doctor, operationDate}) AND find({doctor})
operationSchema.index({ doctor: 1, operationDate: -1 });

// 3. Handles: find({status, operationDate}) AND find({status})
operationSchema.index({ status: 1, operationDate: 1 });


// ============================================
// VIRTUAL PROPERTIES
// ============================================

operationSchema.virtual('isScheduled').get(function() {
  return this.status === 'scheduled';
});

operationSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

operationSchema.virtual('isCancelled').get(function() {
  return this.status === 'cancelled';
});

operationSchema.virtual('formattedDate').get(function() {
  if (this.operationDate) {
    return this.operationDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return null;
});


// ============================================
// METHODS
// ============================================

operationSchema.methods.markAsCompleted = function() {
  if (this.status === 'completed') {
    throw new Error('Operation is already completed');
  }
  if (this.status === 'cancelled') {
    throw new Error('Cannot complete a cancelled operation');
  }
  this.status = 'completed';
  return this.save();
};

operationSchema.methods.cancel = function() {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel a completed operation');
  }
  if (this.status === 'cancelled') {
    throw new Error('Operation is already cancelled');
  }
  this.status = 'cancelled';
  return this.save();
};

operationSchema.methods.reschedule = function(newDate) {
  if (this.status === 'completed') {
    throw new Error('Cannot reschedule a completed operation');
  }
  if (this.status === 'cancelled') {
    throw new Error('Cannot reschedule a cancelled operation');
  }
  this.operationDate = newDate;
  this.status = 'scheduled';
  return this.save();
};


// ============================================
// MIDDLEWARE
// ============================================

operationSchema.pre('save', function(next) {
  if (this.status === 'scheduled' && this.operationDate) {
    const now = new Date();
    // Allow a small grace period for network latency (10 seconds)
    if (this.operationDate < new Date(now.getTime() - 10000)) {
      const error = new Error('Cannot schedule an operation in the past');
      error.status = 400;
      return next(error);
    }
  }
  next();
});

const Operation = mongoose.model('Operation', operationSchema);
export default Operation;
