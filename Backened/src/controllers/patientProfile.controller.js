// src/controllers/patientProfile.controller.js
import PDFDocument from 'pdfkit';
import PatientProfile from '../models/patientProfile.model.js';
import User from '../models/user.model.js';
import Prescription from '../models/prescription.model.js';
import DoctorProfile from '../models/doctorProfile.model.js';
import Appointment from '../models/appointment.model.js';
import Admission from '../models/admission.models.js';
import Operation from '../models/operation.model.js';
import Invoice from '../models/invoice.model.js';
import { uploadToCloudinary } from '../utils/uploadOnCloudinary.js';


// Cancel appointment by patient
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    // Find patient profile
    const patientProfile = await PatientProfile.findOne({ user: userId });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found',
      });
    }

    // Find appointment and verify it belongs to the patient
    const appointment = await Appointment.findOne({
      _id: id,
      patient: patientProfile._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or you are not authorized to cancel it',
      });
    }

    // Check if appointment can be cancelled
    const nonCancellableStatuses = ['completed', 'cancelled'];
    if (nonCancellableStatuses.includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel appointment with status: ${appointment.status}`,
      });
    }

    // Update appointment status to cancelled
    appointment.status = 'cancelled';
    await appointment.save();

    // Populate response
    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName specialization');

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: updatedAppointment,
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message,
    });
  }
};
/**
 * Get authenticated user's patient profile
 * GET /api/v1/patient/profile
 */
export const getPatientProfile = async (req, res) => {
  try {
    // Use req.user.id from authentication middleware
    const userId = req.user.id;
    
    console.log('User ID from token:', userId);

    // Check if user exists
    const user = await User.findById(userId).select('username email profileImage');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find patient profile
    const profile = await PatientProfile.findOne({ user: userId });

    // If no profile exists, return 404
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Convert to object and add user data
    const profileData = profile.toObject();
    profileData.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage
    };

    res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient profile',
      error: error.message
    });
  }
};

/* 
 * Allows patient to update their profile including profile image
 */
export const updatePatientProfile = async (req, res) => {
  try {
    // Use req.user.id from authentication middleware
    const userId = req.user.id;
    
    console.log('User ID for update:', userId);

    // Allowed fields for update
    const allowedUpdates = [
      'fullName',
      'phone',
      'address',
      'gender',
      'dateOfBirth',
      'bloodGroup',
      'emergencyContact'
    ];
    
    // Filter only allowed fields from request body
    const updateData = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    // ============================================
    // Handle Profile Image Upload
    // ============================================
    let profileImageUrl = null;
    
    if (req.file) {
      try {
        // Upload image to Cloudinary
        profileImageUrl = await uploadToCloudinary(req.file.buffer);
        console.log('Profile image uploaded to Cloudinary:', profileImageUrl);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload profile image',
          error: uploadError.message
        });
      }
    }
    
    // Check if at least one field is provided or image is uploaded
    if (Object.keys(updateData).length === 0 && !profileImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'At least one field or profile image must be provided for update'
      });
    }
    
    // Set profile as completed
    updateData.isProfileCompleted = true;
    
    // ============================================
    // Update User Model (for profile image)
    // ============================================
   if (profileImageUrl) {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { profileImage: profileImageUrl } },
    { new: true, runValidators: true }
  );
  
  // ✅ Check if user was actually updated
  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found to update profile image'
    });
  }
  
  // ✅ Log to verify
  console.log('✅ User profile image updated:', updatedUser._id);
  console.log('✅ New image URL:', updatedUser.profileImage);
}
    
    // ============================================
    // Update PatientProfile
    // ============================================
    const profile = await PatientProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );
    
    // ============================================
    // Get Updated User Data
    // ============================================
    const user = await User.findById(userId).select('username email profileImage');
    
    // ============================================
    // Combine for Response
    // ============================================
    const profileData = profile.toObject();
    profileData.user = user ? {
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage
    } : null;
    
    // Calculate age from dateOfBirth if available
    let age = null;
    if (profile.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(profile.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...profileData,
        age: age,
        imageUpdated: !!profileImageUrl
      }
    });
    
  } catch (error) {
    console.error('Update patient profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Get patient's prescriptions
 * GET /api/v1/patient/prescriptions
 */
export const getPatientPrescriptions = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find patient profile
    const patientProfile = await PatientProfile.findOne({ user: userId });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found. Please complete your profile first.'
      });
    }

    // Build filter
    const filter = { patient: patientProfile._id };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get prescriptions with pagination
    const prescriptions = await Prescription.find(filter)
      .populate('doctor', 'fullName department specialization')
      .populate('appointment', 'appointmentDate appointmentTime status')
      .sort({ prescriptionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Prescription.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prescriptions',
      error: error.message
    });
  }
};

/**
 * Get patient's prescription by ID
 * GET /api/v1/patient/prescriptions/:id
 */
export const getPatientPrescriptionById = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find patient profile
    const patientProfile = await PatientProfile.findOne({ user: userId });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found. Please complete your profile first.'
      });
    }

    // Find prescription and verify it belongs to this patient
    const prescription = await Prescription.findById(id)
      .populate('doctor', 'fullName department specialization qualification')
      .populate('appointment', 'appointmentDate appointmentTime status');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Verify prescription belongs to this patient
    if (prescription.patient.toString() !== patientProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this prescription'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });

  } catch (error) {
    console.error('Get patient prescription by ID error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid prescription ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prescription',
      error: error.message
    });
  }
};


/**
 * Get patient's doctors
 * GET /api/v1/patient/doctors
 */
export const getPatientDoctors = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find patient profile
    const patientProfile = await PatientProfile.findOne({ user: userId });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found. Please complete your profile first.'
      });
    }

    // Find all appointments for this patient (excluding rejected)
    const appointments = await Appointment.find({
      patient: patientProfile._id,
      status: { $ne: 'rejected' } // Exclude rejected appointments
    }).select('doctor');

    if (appointments.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Extract unique doctor IDs from appointments
    const doctorIds = [...new Set(appointments.map(app => app.doctor.toString()))];

    // Find all unique doctors
    const doctors = await DoctorProfile.find({
      _id: { $in: doctorIds }
    })
    .populate('user', 'profileImage') // Get profileImage from User
    .select('fullName department specialization qualification description');

    // Format response
    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      fullName: doctor.fullName,
      profileImage: doctor.user?.profileImage || null,
      department: doctor.department,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      description: doctor.description
    }));

    res.status(200).json({
      success: true,
      count: formattedDoctors.length,
      data: formattedDoctors
    });

  } catch (error) {
    console.error('Get patient doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctors',
      error: error.message
    });
  }
};


/*
 * Get doctor profile by ID (Patient)
 * GET /api/v1/patient/doctors/:doctorId
 */
export const getDoctorProfileById = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { doctorId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find doctor profile
    const doctor = await DoctorProfile.findById(doctorId)
      .populate('user', 'profileImage');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Format response
    const doctorData = {
      _id: doctor._id,
      fullName: doctor.fullName,
      profileImage: doctor.user?.profileImage || null,
      department: doctor.department,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experienceYears: doctor.experienceYears,
      phone: doctor.phone,
      address: doctor.address,
      consultationFee: doctor.consultationFee,
      description: doctor.description,
      availability: doctor.availability,
      isAvailable: doctor.isAvailable
    };

    res.status(200).json({
      success: true,
      data: doctorData
    });

  } catch (error) {
    console.error('Get doctor profile by ID error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor profile',
      error: error.message
    });
  }
};


/**
 * Get patient's admission history
 * GET /api/v1/patient/admissions
 */
export const getPatientAdmissions = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find patient profile
    const patientProfile = await PatientProfile.findOne({ user: userId });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found. Please complete your profile first.'
      });
    }

    // Find all admissions for this patient
    const admissions = await Admission.find({ patient: patientProfile._id })
      .populate({
        path: 'doctor',
        select: 'fullName department specialization',
        populate: {
          path: 'user',
          select: 'profileImage'
        }
      })
      .sort({ admissionDate: -1 }); // Newest first

    // Format response
    const formattedAdmissions = admissions.map(admission => ({
      _id: admission._id,
      bedNumber: admission.bedNumber,
      bedType: admission.bedType,
      admissionDate: admission.admissionDate,
      dischargeDate: admission.dischargeDate,
      status: admission.status,
      reason: admission.reason,
      doctor: {
        _id: admission.doctor?._id,
        fullName: admission.doctor?.fullName || null,
        department: admission.doctor?.department || null,
        specialization: admission.doctor?.specialization || null,
        profileImage: admission.doctor?.user?.profileImage || null
      },
      createdAt: admission.createdAt,
      updatedAt: admission.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedAdmissions.length,
      data: formattedAdmissions
    });

  } catch (error) {
    console.error('Get patient admissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admission history',
      error: error.message
    });
  }
};


/**
 * Get patient's operation history
 * GET /api/v1/patient/operations
 */
export const getPatientOperations = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find patient profile
    const patientProfile = await PatientProfile.findOne({ user: userId });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found. Please complete your profile first.'
      });
    }

    // Find all operations for this patient
    const operations = await Operation.find({ patient: patientProfile._id })
      .populate({
        path: 'doctor',
        select: 'fullName department specialization',
        populate: {
          path: 'user',
          select: 'profileImage'
        }
      })
      .sort({ operationDate: -1 }); // Newest first

    // Format response
    const formattedOperations = operations.map(operation => ({
      _id: operation._id,
      description: operation.description,
      operationDate: operation.operationDate,
      status: operation.status,
      notes: operation.notes || null,
      doctor: {
        _id: operation.doctor?._id,
        fullName: operation.doctor?.fullName || null,
        department: operation.doctor?.department || null,
        specialization: operation.doctor?.specialization || null,
        profileImage: operation.doctor?.user?.profileImage || null
      },
      createdAt: operation.createdAt,
      updatedAt: operation.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedOperations.length,
      data: formattedOperations
    });

  } catch (error) {
    console.error('Get patient operations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve operation history',
      error: error.message
    });
  }
};


/**
 * Get patient's invoices
 * GET /api/v1/patient/invoices
 */
export const getPatientInvoices = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find patient profile
    const patientProfile = await PatientProfile.findOne({ user: userId });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found. Please complete your profile first.'
      });
    }

    // Find all invoices for this patient
    const invoices = await Invoice.find({ patient: patientProfile._id })
      .populate({
        path: 'doctor',
        select: 'fullName department specialization'
      })
      .populate({
        path: 'appointment',
        select: 'appointmentDate appointmentTime status'
      })
      .populate({
        path: 'admission',
        select: 'bedNumber bedType admissionDate dischargeDate status'
      })
      .sort({ issueDate: -1 }); // Newest first

    // Format response
    const formattedInvoices = invoices.map(invoice => ({
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount
      })),
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      dueAmount: invoice.dueAmount,
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod,
      notes: invoice.notes || null,
      doctor: invoice.doctor ? {
        _id: invoice.doctor._id,
        fullName: invoice.doctor.fullName,
        department: invoice.doctor.department,
        specialization: invoice.doctor.specialization
      } : null,
      appointment: invoice.appointment ? {
        _id: invoice.appointment._id,
        appointmentDate: invoice.appointment.appointmentDate,
        appointmentTime: invoice.appointment.appointmentTime,
        status: invoice.appointment.status
      } : null,
      admission: invoice.admission ? {
        _id: invoice.admission._id,
        bedNumber: invoice.admission.bedNumber,
        bedType: invoice.admission.bedType,
        admissionDate: invoice.admission.admissionDate,
        dischargeDate: invoice.admission.dischargeDate,
        status: invoice.admission.status
      } : null,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedInvoices.length,
      data: formattedInvoices
    });

  } catch (error) {
    console.error('Get patient invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: error.message
    });
  }
};


// Download invoice as PDF
export const downloadInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    // Find patient profile
    const patientProfile = await PatientProfile.findOne({ user: userId });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found',
      });
    }

    // Find invoice and verify ownership
    const invoice = await Invoice.findOne({
      _id: id,
      patient: patientProfile._id,
    })
      .populate('patient', 'fullName phone address profileImage')
      .populate('doctor', 'fullName department specialization')
      .populate('appointment', 'appointmentDate appointmentTime status')
      .populate('admission', 'bedNumber bedType admissionDate dischargeDate');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or you are not authorized to view it',
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // ============================================
    // PDF CONTENT
    // ============================================

    // Colors
    const primaryColor = '#2563eb';
    const secondaryColor = '#1e293b';
    const lightGray = '#f1f5f9';
    const darkGray = '#475569';

    // ============================================
    // HEADER
    // ============================================
    doc
      .fillColor(primaryColor)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('HOSPITAL MANAGEMENT SYSTEM', { align: 'center' })
      .moveDown(0.5);

    doc
      .fillColor(secondaryColor)
      .fontSize(12)
      .font('Helvetica')
      .text('123 Healthcare Street, Medical City, MC 12345', { align: 'center' })
      .text('Phone: +1 234 567 890 | Email: info@hospital.com', { align: 'center' })
      .moveDown(1);

    // Divider
    doc
      .strokeColor(primaryColor)
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(1);

    // ============================================
    // INVOICE TITLE
    // ============================================
    doc
      .fillColor(primaryColor)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('INVOICE', { align: 'center' })
      .moveDown(0.5);

    // ============================================
    // INVOICE DETAILS ROW
    // ============================================
    const startY = doc.y;

    // Left Column - Invoice Details
    doc
      .fillColor(secondaryColor)
      .fontSize(10)
      .font('Helvetica')
      .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, startY)
      .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 50)
      .text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 50)
      .text(`Status: ${invoice.paymentStatus.toUpperCase()}`, 50);

    // Right Column - Patient Info
    const rightColumnX = 350;
    doc
      .font('Helvetica-Bold')
      .text('Bill To:', rightColumnX, startY)
      .font('Helvetica')
      .text(invoice.patient.fullName, rightColumnX)
      .text(`Phone: ${invoice.patient.phone || 'N/A'}`, rightColumnX)
      .text(`Address: ${invoice.patient.address || 'N/A'}`, rightColumnX);

    doc.moveDown(1.5);

    // ============================================
    // REFERENCE INFO (if available)
    // ============================================
    if (invoice.doctor || invoice.appointment || invoice.admission) {
      const refStartY = doc.y;
      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Reference Information:', 50, refStartY);

      let refY = doc.y + 5;
      if (invoice.doctor) {
        doc
          .font('Helvetica')
          .text(`Doctor: ${invoice.doctor.fullName} (${invoice.doctor.department})`, 50, refY);
        refY += 20;
      }
      if (invoice.appointment) {
        doc.text(
          `Appointment: ${new Date(invoice.appointment.appointmentDate).toLocaleDateString()} at ${invoice.appointment.appointmentTime}`,
          50,
          refY
        );
        refY += 20;
      }
      if (invoice.admission) {
        doc.text(
          `Admission: Bed ${invoice.admission.bedNumber} (${invoice.admission.bedType})`,
          50,
          refY
        );
      }

      doc.moveDown(1);
    }

    // ============================================
    // ITEMS TABLE
    // ============================================
    const tableTop = doc.y;
    const tableLeft = 50;
    const tableRight = 545;
    const col1 = 250;
    const col2 = 340;
    const col3 = 420;
    const col4 = 500;

    // Table Header
    const headerY = tableTop;
    doc
      .fillColor(primaryColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Description', tableLeft, headerY)
      .text('Qty', col2, headerY)
      .text('Unit Price', col3, headerY)
      .text('Amount', col4, headerY);

    // Header Underline
    doc
      .strokeColor(primaryColor)
      .lineWidth(1)
      .moveTo(tableLeft, doc.y + 5)
      .lineTo(tableRight, doc.y + 5)
      .stroke()
      .moveDown(0.5);

    // Table Rows
    let rowY = doc.y;
    doc.fillColor(secondaryColor).fontSize(10).font('Helvetica');

    invoice.items.forEach((item, index) => {
      // Alternating row colors
      if (index % 2 === 0) {
        doc
          .fillColor(lightGray)
          .rect(tableLeft, rowY - 2, tableRight - tableLeft, 20)
          .fill();
      }

      doc.fillColor(secondaryColor);
      const description = item.description.length > 30 
        ? item.description.substring(0, 27) + '...' 
        : item.description;
      
      doc.text(description, tableLeft, rowY);
      doc.text(item.quantity.toString(), col2, rowY);
      doc.text(`$${item.unitPrice.toFixed(2)}`, col3, rowY);
      doc.text(`$${item.amount.toFixed(2)}`, col4, rowY);

      rowY = doc.y;
    });

    doc.moveDown(0.5);

    // Table Bottom Line
    doc
      .strokeColor(primaryColor)
      .lineWidth(1)
      .moveTo(tableLeft, doc.y)
      .lineTo(tableRight, doc.y)
      .stroke()
      .moveDown(0.5);

    // ============================================
    // TOTALS (Right Aligned)
    // ============================================
    const totalX = 380;
    const totalsStartY = doc.y + 10;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', totalX, totalsStartY)
      .text(`$${invoice.subtotal.toFixed(2)}`, 470, totalsStartY);

    let yPos = totalsStartY + 20;

    if (invoice.discount > 0) {
      doc
        .text('Discount:', totalX, yPos)
        .text(`-$${invoice.discount.toFixed(2)}`, 470, yPos);
      yPos += 20;
    }

    if (invoice.tax > 0) {
      doc
        .text('Tax:', totalX, yPos)
        .text(`$${invoice.tax.toFixed(2)}`, 470, yPos);
      yPos += 20;
    }

    // Total Amount
    yPos += 10;
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text('Total:', totalX, yPos)
      .text(`$${invoice.totalAmount.toFixed(2)}`, 470, yPos);

    yPos += 30;

    // Payment Details
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(secondaryColor)
      .text('Paid Amount:', totalX, yPos)
      .text(`$${invoice.paidAmount.toFixed(2)}`, 470, yPos);

    yPos += 20;

    const dueAmount = invoice.totalAmount - invoice.paidAmount;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(dueAmount > 0 ? '#dc2626' : '#16a34a')
      .text('Due Amount:', totalX, yPos)
      .text(`$${dueAmount.toFixed(2)}`, 470, yPos);

    doc.moveDown(2);

    // ============================================
    // NOTES
    // ============================================
    if (invoice.notes) {
      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Notes:', 50, doc.y)
        .font('Helvetica')
        .text(invoice.notes, 50, doc.y + 5);
      doc.moveDown(1);
    }

    // ============================================
    // PAYMENT STATUS
    // ============================================
    const statusColor = invoice.paymentStatus === 'paid' ? '#16a34a' :
                       invoice.paymentStatus === 'partially_paid' ? '#eab308' :
                       '#dc2626';

    doc
      .fillColor(statusColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`Payment Status: ${invoice.paymentStatus.toUpperCase()}`, 50, doc.y, {
        align: 'center',
      })
      .moveDown(1);

    if (invoice.paymentMethod) {
      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .font('Helvetica')
        .text(`Payment Method: ${invoice.paymentMethod.toUpperCase()}`, 50, doc.y, {
          align: 'center',
        })
        .moveDown(1);
    }

    // ============================================
    // FOOTER
    // ============================================
    doc
      .fillColor(darkGray)
      .fontSize(9)
      .font('Helvetica')
      .text(
        'Thank you for choosing our hospital services. For any queries, please contact our billing department.',
        50,
        730,
        { align: 'center' }
      )
      .text(
        `Generated on: ${new Date().toLocaleString()}`,
        50,
        750,
        { align: 'center' }
      );

    // ============================================
    // FINALIZE PDF
    // ============================================
    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice PDF',
      error: error.message,
    });
  }
};

/**
 * Change patient password
 * PATCH /api/v1/patient/change-password
 */
// src/controllers/patientProfile.controller.js

/**
 * Change patient password
 * PATCH /api/v1/patient/change-password
 */
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

    // Debug: Log password validation
    console.log('New password being validated:', newPassword);

    // Try to update password
    try {
      user.password = newPassword;
      
      // Update passwordChangedAt if the model has this field
      if (user.schema.path('passwordChangedAt')) {
        user.passwordChangedAt = new Date();
      }

      await user.save();
    } catch (validationError) {
      // If validation fails, return the specific error
      if (validationError.name === 'ValidationError') {
        const errors = Object.values(validationError.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Password validation failed',
          errors: errors,
          // Include the password requirements for the user
          requirements: {
            minLength: 8,
            uppercase: 'At least one uppercase letter (A-Z)',
            lowercase: 'At least one lowercase letter (a-z)',
            number: 'At least one number (0-9)',
            specialChar: 'At least one special character (@$!%*?&)'
          }
        });
      }
      throw validationError;
    }

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
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};
