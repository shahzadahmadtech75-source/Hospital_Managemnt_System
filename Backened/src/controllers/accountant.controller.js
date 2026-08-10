import Invoice from '../models/invoice.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import DoctorProfile from '../models/doctorProfile.model.js';
import Appointment from '../models/appointment.model.js';
import Admission from '../models/admission.models.js';

// Create invoice
export const createInvoice = async (req, res) => {
  try {
    const {
      title,
      invoiceNumber,
      patient,
      doctor,
      appointment,
      admission,
      issueDate,
      dueDate,
      items,
      discount,
      tax,
      paidAmount,
      paymentMethod,
      notes,
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number is required',
      });
    }

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: 'Patient reference is required',
      });
    }

    if (!issueDate) {
      return res.status(400).json({
        success: false,
        message: 'Issue date is required',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required',
      });
    }

    // Validate items have required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description || item.description.trim() === '') {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} description is required`,
        });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} quantity must be at least 1`,
        });
      }
      if (item.unitPrice === undefined || item.unitPrice < 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1} unit price is required and cannot be negative`,
        });
      }
    }

    // Verify patient exists
    const patientProfile = await PatientProfile.findById(patient);
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Verify doctor if provided
    if (doctor) {
      const doctorProfile = await DoctorProfile.findById(doctor);
      if (!doctorProfile) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }
    }

    // Verify appointment if provided
    if (appointment) {
      const appointmentExists = await Appointment.findById(appointment);
      if (!appointmentExists) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }
    }

    // Verify admission if provided
    if (admission) {
      const admissionExists = await Admission.findById(admission);
      if (!admissionExists) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found',
        });
      }
    }

    // Validate discount if provided
    if (discount !== undefined && discount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount cannot be negative',
      });
    }

    // Validate tax if provided
    if (tax !== undefined && tax < 0) {
      return res.status(400).json({
        success: false,
        message: 'Tax cannot be negative',
      });
    }

    // Validate paidAmount if provided
    if (paidAmount !== undefined && paidAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount cannot be negative',
      });
    }

    // Validate paymentMethod if provided
    if (paymentMethod) {
      const validMethods = ['cash', 'card', 'bank_transfer', 'online'];
      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method. Must be cash, card, bank_transfer, or online',
        });
      }
    }

    // Check if invoice number is unique
    const existingInvoice = await Invoice.findOne({ invoiceNumber });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: `Invoice number ${invoiceNumber} already exists`,
      });
    }

    // Calculate item amounts
    const processedItems = items.map(item => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));

    // Calculate subtotal
    const subtotal = processedItems.reduce((sum, item) => sum + item.amount, 0);

    // Create invoice
    const invoice = await Invoice.create({
      title,
      invoiceNumber,
      patient,
      doctor: doctor || null,
      appointment: appointment || null,
      admission: admission || null,
      issueDate,
      dueDate: dueDate || null,
      items: processedItems,
      subtotal,
      discount: discount || 0,
      tax: tax || 0,
      totalAmount: Math.max(0, subtotal - (discount || 0) + (tax || 0)),
      paidAmount: paidAmount || 0,
      dueAmount: Math.max(0, (subtotal - (discount || 0) + (tax || 0)) - (paidAmount || 0)),
      paymentStatus: 'unpaid', // Default, will be auto-calculated by pre-save
      paymentMethod: paymentMethod || null,
      notes: notes || '',
    });

    // Populate response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('patient', '_id fullName phone profileImage')
      .populate('doctor', '_id fullName department specialization')
      .populate('appointment', '_id appointmentDate appointmentTime status')
      .populate('admission', '_id bedNumber bedType admissionDate dischargeDate status');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populatedInvoice,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message,
    });
  }
};