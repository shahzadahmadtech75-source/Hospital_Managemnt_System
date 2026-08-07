// src/controllers/patientProfile.controller.js

import PatientProfile from '../models/patientProfile.model.js';
import User from '../models/user.model.js';
import Prescription from '../models/prescription.model.js';
import DoctorProfile from '../models/doctorProfile.model.js';
import Appointment from '../models/appointment.model.js';
import Admission from '../models/admission.models.js';
import Operation from '../models/operation.model.js';
import Invoice from '../models/invoice.model.js';

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

/**
 * Update patient profile
 * PATCH /api/v1/patient/profile
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
    
    // Check if at least one field is provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }
    
    // Set profile as completed
    updateData.isProfileCompleted = true;
    
    // Find and update, or create if doesn't exist
    const profile = await PatientProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );
    
    // Get user data for response
    const user = await User.findById(userId).select('username email profileImage');
    
    // Combine for response
    const profileData = profile.toObject();
    profileData.user = user ? {
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage
    } : null;
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData
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