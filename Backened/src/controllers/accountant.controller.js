import Invoice from '../models/invoice.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import DoctorProfile from '../models/doctorProfile.model.js';
import Appointment from '../models/appointment.model.js';
import Admission from '../models/admission.models.js';
import User from '../models/user.model.js';
import AccountantProfile from '../models/accountantProfile.model.js';
import { uploadToCloudinary } from '../utils/uploadOnCloudinary.js';

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

// Get all patients
export const getPatients = async (req, res) => {
  try {
    const patients = await PatientProfile.find()
      .populate('user', 'email username profileImage')
      .sort({ fullName: 1 });

    const formattedPatients = patients.map(patient => ({
      _id: patient._id,
      fullName: patient.fullName,
      phone: patient.phone,
      email: patient.user?.email || null,
      profileImage: patient.profileImage || patient.user?.profileImage || null,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
    }));

    res.status(200).json({
      success: true,
      count: formattedPatients.length,
      data: formattedPatients,
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message,
    });
  }
};

// Get all doctors
export const getDoctors = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate('user', 'email username profileImage')
      .sort({ fullName: 1 });

    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      fullName: doctor.fullName,
      department: doctor.department,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      phone: doctor.phone,
      email: doctor.user?.email || null,
      profileImage: doctor.profileImage || doctor.user?.profileImage || null,
      consultationFee: doctor.consultationFee,
      isAvailable: doctor.isAvailable,
    }));

    res.status(200).json({
      success: true,
      count: formattedDoctors.length,
      data: formattedDoctors,
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: error.message,
    });
  }
};

// Get patient appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify patient exists
    const patient = await PatientProfile.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const appointments = await Appointment.find({ patient: id })
      .populate('doctor', 'fullName department specialization')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    const formattedAppointments = appointments.map(appointment => ({
      _id: appointment._id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: appointment.status,
      reason: appointment.reason,
      doctor: appointment.doctor ? {
        _id: appointment.doctor._id,
        fullName: appointment.doctor.fullName,
        department: appointment.doctor.department,
        specialization: appointment.doctor.specialization,
      } : null,
    }));

    res.status(200).json({
      success: true,
      count: formattedAppointments.length,
      data: formattedAppointments,
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message,
    });
  }
};

// Get patient admissions
export const getPatientAdmissions = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify patient exists
    const patient = await PatientProfile.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const admissions = await Admission.find({ patient: id })
      .populate('doctor', 'fullName department specialization')
      .sort({ admissionDate: -1 });

    const formattedAdmissions = admissions.map(admission => ({
      _id: admission._id,
      bedNumber: admission.bedNumber,
      bedType: admission.bedType,
      admissionDate: admission.admissionDate,
      dischargeDate: admission.dischargeDate,
      status: admission.status,
      reason: admission.reason,
      doctor: admission.doctor ? {
        _id: admission.doctor._id,
        fullName: admission.doctor.fullName,
        department: admission.doctor.department,
        specialization: admission.doctor.specialization,
      } : null,
    }));

    res.status(200).json({
      success: true,
      count: formattedAdmissions.length,
      data: formattedAdmissions,
    });
  } catch (error) {
    console.error('Error fetching patient admissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admissions',
      error: error.message,
    });
  }
};


// Get all invoices
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('patient', '_id fullName phone profileImage')
      .sort({ creationDate: -1, createdAt: -1 });

    // Format response to match the model structure
    const formattedInvoices = invoices.map(invoice => ({
      _id: invoice._id,
      title: invoice.title,
      invoiceNumber: invoice.invoiceNumber,
      patient: invoice.patient,
      creationDate: invoice.creationDate,
      dueDate: invoice.dueDate,
      taxPercentage: invoice.taxPercentage,
      discountAmount: invoice.discountAmount,
      status: invoice.status,
      entries: invoice.entries,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedInvoices.length,
      data: formattedInvoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message,
    });
  }
};

// Get single invoice
export const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate('patient', '_id fullName phone profileImage address')
      .populate('doctor', '_id fullName department specialization phone')
      .populate('appointment', '_id appointmentDate appointmentTime status')
      .populate('admission', '_id bedNumber bedType admissionDate dischargeDate status');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Format response with all invoice details
    const formattedInvoice = {
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      patient: invoice.patient,
      doctor: invoice.doctor || null,
      appointment: invoice.appointment || null,
      admission: invoice.admission || null,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate || null,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      dueAmount: invoice.dueAmount,
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod || null,
      notes: invoice.notes || null,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedInvoice,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message,
    });
  }
};


// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
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
      paymentStatus,
    } = req.body;

    // Find invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Validate and update patient if provided
    if (patient) {
      const patientExists = await PatientProfile.findById(patient);
      if (!patientExists) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }
      invoice.patient = patient;
    }

    // Validate and update doctor if provided
    if (doctor) {
      const doctorExists = await DoctorProfile.findById(doctor);
      if (!doctorExists) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }
      invoice.doctor = doctor;
    }

    // Validate and update appointment if provided
    if (appointment) {
      const appointmentExists = await Appointment.findById(appointment);
      if (!appointmentExists) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found',
        });
      }
      invoice.appointment = appointment;
    }

    // Validate and update admission if provided
    if (admission) {
      const admissionExists = await Admission.findById(admission);
      if (!admissionExists) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found',
        });
      }
      invoice.admission = admission;
    }

    // Validate invoiceNumber uniqueness if changed
    if (invoiceNumber && invoiceNumber !== invoice.invoiceNumber) {
      const existingInvoice = await Invoice.findOne({
        invoiceNumber,
        _id: { $ne: id },
      });
      if (existingInvoice) {
        return res.status(400).json({
          success: false,
          message: `Invoice number ${invoiceNumber} already exists`,
        });
      }
      invoice.invoiceNumber = invoiceNumber;
    }

    // Update fields if provided
    if (title) invoice.title = title;
    if (issueDate) invoice.issueDate = issueDate;
    if (dueDate !== undefined) invoice.dueDate = dueDate || null;

    // Validate and update discount
    if (discount !== undefined) {
      if (discount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Discount cannot be negative',
        });
      }
      invoice.discount = discount;
    }

    // Validate and update tax
    if (tax !== undefined) {
      if (tax < 0) {
        return res.status(400).json({
          success: false,
          message: 'Tax cannot be negative',
        });
      }
      invoice.tax = tax;
    }

    // Validate and update paidAmount
    if (paidAmount !== undefined) {
      if (paidAmount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Paid amount cannot be negative',
        });
      }
      invoice.paidAmount = paidAmount;
    }

    // Validate and update paymentMethod
    if (paymentMethod) {
      const validMethods = ['cash', 'card', 'bank_transfer', 'online'];
      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method. Must be cash, card, bank_transfer, or online',
        });
      }
      invoice.paymentMethod = paymentMethod;
    }

    // Validate and update paymentStatus
    if (paymentStatus) {
      const validStatuses = ['unpaid', 'partially_paid', 'paid', 'cancelled'];
      if (!validStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment status. Must be unpaid, partially_paid, paid, or cancelled',
        });
      }
      invoice.paymentStatus = paymentStatus;
    }

    // Update notes if provided
    if (notes !== undefined) {
      invoice.notes = notes || '';
    }

    // Update items if provided
    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one item is required',
        });
      }

      // Validate each item
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

      // Process items with calculated amounts
      invoice.items = items.map(item => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
      }));
    }

    // Save invoice (pre-save middleware will recalculate totals)
    await invoice.save();

    // Populate and return updated invoice
    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('patient', '_id fullName phone profileImage address')
      .populate('doctor', '_id fullName department specialization phone')
      .populate('appointment', '_id appointmentDate appointmentTime status')
      .populate('admission', '_id bedNumber bedType admissionDate dischargeDate status');

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice,
    });
  } catch (error) {
    console.error('Error updating invoice:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message,
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Find invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Delete the invoice
    await invoice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message,
    });
  }
};



// Get accountant profile
export const getAccountantProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Get user
    const user = await User.findById(userId).select('-password -refreshToken -passwordChangedAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find accountant profile
    const profile = await AccountantProfile.findOne({ user: userId });

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
        },
        profile: profile,
        isProfileCompleted: profile ? true : false,
      },
    });
  } catch (error) {
    console.error('Error fetching accountant profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accountant profile',
      error: error.message,
    });
  }
};

// Create or update accountant profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { fullName, phone, address } = req.body;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Handle profile image upload if provided
    let profileImageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      profileImageUrl = result;
    }

    // Find or create accountant profile
    let profile = await AccountantProfile.findOne({ user: userId });

    if (!profile) {
      // Create new profile
      profile = new AccountantProfile({
        user: userId,
        fullName: fullName || '',
        phone: phone || null,
        address: address || null,
        profileImage: profileImageUrl,
      });
    } else {
      // Update existing profile
      if (fullName) profile.fullName = fullName;
      if (phone !== undefined) profile.phone = phone || null;
      if (address !== undefined) profile.address = address || null;
      if (profileImageUrl) profile.profileImage = profileImageUrl;
    }

    await profile.save();

    // Update user profileImage if image was uploaded
    if (profileImageUrl) {
      user.profileImage = profileImageUrl;
      await user.save();
    }

    // Get updated user with safe fields
    const updatedUser = await User.findById(userId).select('-password -refreshToken -passwordChangedAt');

    res.status(200).json({
      success: true,
      message: profile.isNew ? 'Accountant profile created successfully' : 'Accountant profile updated successfully',
      data: {
        user: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          profileImage: updatedUser.profileImage,
        },
        profile: profile,
        isProfileCompleted: true,
      },
    });
  } catch (error) {
    console.error('Error upserting accountant profile:', error);

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
      message: 'Failed to save accountant profile',
      error: error.message,
    });
  }
};



// Change accountant password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Validate required fields
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required'
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Confirm password is required'
      });
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    // Check if new password is same as current password
    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as current password'
      });
    }

    // Find user with password field included
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    
    // Update passwordChangedAt if the model has this field
    if (user.schema.path('passwordChangedAt')) {
      user.passwordChangedAt = new Date();
    }

    // Invalidate refresh token
    user.refreshToken = null;

    // Save with validation only for modified fields
    await user.save({ validateModifiedOnly: true });

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again with your new password.'
    });

  } catch (error) {
    console.error('Change password error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: errors,
        requirements: {
          minLength: 8,
          uppercase: 'At least one uppercase letter (A-Z)',
          lowercase: 'At least one lowercase letter (a-z)',
          number: 'At least one number (0-9)',
          specialChar: 'At least one special character (@$!%*?&)'
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};