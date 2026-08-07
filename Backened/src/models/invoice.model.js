// src/models/invoice.model.js

import mongoose from 'mongoose';


const invoiceItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    }
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: [true, 'Patient reference is required']
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: false
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: false
    },
    admission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
      required: false
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true, // MongoDB automatically creates a unique index here
      trim: true,
      uppercase: true
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: false,
      default: null
    },
    items: {
      type: [invoiceItemSchema],
      required: [true, 'At least one item is required'],
      validate: {
        validator: function(items) {
          return items && items.length > 0;
        },
        message: 'Invoice must have at least one item'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
      default: 0
    },
    discount: {
      type: Number,
      required: true,
      min: [0, 'Discount cannot be negative'],
      default: 0
    },
    tax: {
      type: Number,
      required: true,
      min: [0, 'Tax cannot be negative'],
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
      default: 0
    },
    paidAmount: {
      type: Number,
      required: true,
      min: [0, 'Paid amount cannot be negative'],
      default: 0,
      validate: {
        validator: function(value) {
          return value <= this.totalAmount;
        },
        message: 'Paid amount cannot exceed total amount'
      }
    },
    dueAmount: {
      type: Number,
      required: true,
      min: [0, 'Due amount cannot be negative'],
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['unpaid', 'partially_paid', 'paid', 'cancelled'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'unpaid'
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'card', 'bank_transfer', 'online'],
        message: '{VALUE} is not a valid payment method'
      },
      required: false,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: ''
    }
  },
  {
    timestamps: true 
  }
);

// ============================================
// CLEANED INDEXES
// ============================================


// ✅ CORRECT - Use invoiceSchema
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ doctor: 1 });
invoiceSchema.index({ appointment: 1 });
invoiceSchema.index({ admission: 1 });
invoiceSchema.index({ paymentStatus: 1 });

// PERFECT COMPOUND INDEXES (These replace your individual patient & status indexes)
// 1. Handles: find({patient, paymentStatus}) AND find({patient})
invoiceSchema.index({ patient: 1, paymentStatus: 1 });

// 2. Handles: find({patient, issueDate}) AND find({patient}) due to left prefix rule
invoiceSchema.index({ patient: 1, issueDate: -1 });


// ============================================
// PRE-VALIDATE MIDDLEWARE (Fixes Mongoose Validation Errors)
// ============================================

invoiceSchema.pre('validate', function(next) {
  // 1. Calculate item amounts and invoice subtotal
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      item.amount = (item.quantity || 1) * (item.unitPrice || 0);
    });
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  }

  // 2. Calculate totals
  this.totalAmount = Math.max(0, this.subtotal - this.discount + this.tax);
  this.dueAmount = Math.max(0, this.totalAmount - this.paidAmount);

  // 3. Update payment status safely before standard validation rules kick in
  if (this.paymentStatus !== 'cancelled') {
    if (this.totalAmount === 0 || this.paidAmount >= this.totalAmount) {
      this.paymentStatus = 'paid';
      this.dueAmount = 0;
    } else if (this.paidAmount === 0) {
      this.paymentStatus = 'unpaid';
    } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
      this.paymentStatus = 'partially_paid';
    }
  } else {
    this.paymentMethod = null;
  }

  // 4. Auto-generate invoice number if it doesn't exist
  if (!this.invoiceNumber) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDateoperation()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // Guarantees exactly 4 digits
    this.invoiceNumber = `INV-${year}${month}${day}-${random}`;
  }

  next();
});


// ============================================
// VIRTUAL PROPERTIES
// ============================================

invoiceSchema.virtual('isPaid').get(function() {
  return this.paymentStatus === 'paid';
});

invoiceSchema.virtual('isPartiallyPaid').get(function() {
  return this.paymentStatus === 'partially_paid';
});

invoiceSchema.virtual('isUnpaid').get(function() {
  return this.paymentStatus === 'unpaid';
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
