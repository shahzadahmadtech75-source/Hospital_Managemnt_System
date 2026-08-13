// src/controllers/doctorProfile.controller.js

import DoctorProfile from '../models/doctorProfile.model.js';
import User from '../models/user.model.js';
import Appointment from '../models/appointment.model.js';
import Prescription from '../models/prescription.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import Admission from '../models/admission.models.js';
import Report from '../models/report.models.js';
import Operation from '../models/operation.model.js';
import { uploadToCloudinary } from '../utils/uploadOnCloudinary.js';

import mongoose from 'mongoose';


/**
 * Get authenticated doctor's profile
 * GET /api/v1/doctor/profile
 */
export const getDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user exists
    const user = await User.findById(userId).select('username email profileImage');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find doctor profile
    const profile = await DoctorProfile.findOne({ user: userId });

    // If no profile exists, return structured response with null profile
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage
          },
          profile: null,
          isProfileCompleted: false,
          message: 'Profile not yet created. Please complete your professional profile.'
        }
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
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor profile',
      error: error.message
    });
  }
};

/**
 * Update doctor profile
 * PATCH /api/v1/doctor/profile
 */
export const updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Allowed fields for doctor profile update
    const allowedUpdates = [
      'fullName',
      'department',
      'specialization',
      'qualification',
      'experienceYears',
      'phone',
      'address',
      'consultationFee',
      'description',
      'availability',
      'isAvailable'
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

    // Find and update, or create if doesn't exist
    const profile = await DoctorProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    // Get user data for response
    const userData = await User.findById(userId).select('username email profileImage');

    // Combine for response
    const profileData = profile.toObject();
    profileData.user = userData ? {
      _id: userData._id,
      username: userData.username,
      email: userData.email,
      profileImage: userData.profileImage
    } : null;

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: profileData
    });

  } catch (error) {
    console.error('Update doctor profile error:', error);

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
      message: 'Failed to update doctor profile',
      error: error.message
    });
  }
};

/**
 * Update doctor availability status
 * PATCH /api/v1/doctor/availability
 */
export const updateDoctorAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAvailable, availability } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build update data
    const updateData = {};
    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable;
    }
    if (availability) {
      updateData.availability = availability;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (isAvailable or availability) must be provided'
      });
    }

    // Find and update, or create if doesn't exist
    const profile = await DoctorProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        isAvailable: profile.isAvailable,
        availability: profile.availability
      }
    });

  } catch (error) {
    console.error('Update doctor availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
};



/**
 * Get doctor's appointments
 * GET /api/v1/doctor/appointments
*/
export const getDoctorAppointments = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { status } = req.query;
    
    console.log('User ID from token:', userId); // Debug log

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: userId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please complete your profile first.'
      });
    }

    // Build filter
    const filter = { doctor: doctorProfile._id };
    
    // Optional status filtering
    if (status) {
      const allowedStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Allowed statuses: pending, approved, rejected, completed, cancelled'
        });
      }
      filter.status = status;
    }

    // Get appointments
    const appointments = await Appointment.find(filter)
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName department specialization')
      .sort({ appointmentDate: 1, appointmentTime: 1 }); // Ascending by date and time

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments',
      error: error.message
    });
  }
};

/**
 * Complete appointment (Doctor)
 * PATCH /api/v1/doctor/appointments/:id/complete
 */
export const completeAppointment = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { 
      caseHistory, 
      consultationNotes,
      medications 
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: userId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please complete your profile first.'
      });
    }

    // Find appointment and verify it belongs to this doctor
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify appointment belongs to this doctor
    if (appointment.doctor.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this appointment'
      });
    }

    // Check if appointment can be completed
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already completed'
      });
    }

    if (appointment.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete an appointment with status "${appointment.status}". Only approved appointments can be completed.`
      });
    }

    // Update appointment with consultation details
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'completed',
          caseHistory: caseHistory || '',
          consultationNotes: consultationNotes || '',
          medications: medications || '',
          consultationDate: new Date()
        }
      },
      { new: true, runValidators: true }
    )
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName department specialization');

    res.status(200).json({
      success: true,
      message: 'Appointment completed successfully',
      data: updatedAppointment
    });

  } catch (error) {
    console.error('Complete appointment error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

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
      message: 'Failed to complete appointment',
      error: error.message
    });
  }
};


/**
 * Create prescription (Doctor)
 * POST /api/v1/doctor/prescriptions
 */
export const createPrescription = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      appointmentId, 
      caseHistory, 
      medications, 
      extraNotes 
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Validate required fields
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId is required'
      });
    }

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'medications must be a non-empty array'
      });
    }

    // Find doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: userId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please complete your profile first.'
      });
    }

    // Find appointment and verify it belongs to this doctor
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify appointment belongs to this doctor
    if (appointment.doctor.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create a prescription for this appointment'
      });
    }

    // Check if appointment is completed
    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot create prescription for appointment with status "${appointment.status}". Only completed appointments can have prescriptions.`
      });
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await Prescription.findOne({ appointment: appointmentId });
    if (existingPrescription) {
      return res.status(409).json({
        success: false,
        message: 'A prescription already exists for this appointment. Please update the existing prescription instead.',
        data: {
          prescriptionId: existingPrescription._id,
          createdAt: existingPrescription.createdAt
        }
      });
    }

    // Create prescription
    const prescription = new Prescription({
      patient: appointment.patient,
      doctor: doctorProfile._id,
      appointment: appointmentId,
      caseHistory: caseHistory || '',
      medications: medications,
      extraNotes: extraNotes || '',
      prescriptionDate: new Date()
    });

    await prescription.save();

    // Populate the response
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'fullName phone bloodGroup')
      .populate('doctor', 'fullName department specialization')
      .populate('appointment', 'appointmentDate appointmentTime status');

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: populatedPrescription
    });

  } catch (error) {
    console.error('Create prescription error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  }
};

/**
 * Create appointment for patient (Doctor)
 */
export const createAppointmentByDoctor = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { patientId, appointmentDate, appointmentTime, reason } = req.body;

    // Validate required fields
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required'
      });
    }

    if (!appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'appointmentDate is required'
      });
    }

    if (!appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'appointmentTime is required'
      });
    }

    // Find doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: userId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please complete your profile first.'
      });
    }

    // Check if doctor is available
    if (!doctorProfile.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'You are currently not available for appointments'
      });
    }

    // Verify patient exists
    const patientProfile = await PatientProfile.findById(patientId);
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found. Please provide a valid patient ID.'
      });
    }

    // Check for scheduling conflicts
    const existingAppointment = await Appointment.findOne({
      doctor: doctorProfile._id,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another time.'
      });
    }

    // Create appointment with approved status
    const appointment = new Appointment({
      patient: patientProfile._id,
      doctor: doctorProfile._id,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      reason: reason || '',
      status: 'approved', // Doctor-created appointments are auto-approved
      createdBy: 'doctor',
      createdByUser: userId
    });

    await appointment.save();

    // Populate response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName department specialization')
      .populate('createdByUser', 'username email');

    res.status(201).json({
      success: true,
      message: 'Appointment created and approved successfully',
      data: populatedAppointment
    });

  } catch (error) {
    console.error('Create appointment by doctor error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Appointment already exists for this patient, doctor, date, and time'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
};

/**
 * Approve or reject appointment (Doctor)
 */
export const updateAppointmentStatusByDoctor = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    // Validate status is provided
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status is either 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"'
      });
    }

    // Find doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: userId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please complete your profile first.'
      });
    }

    // Find appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify appointment belongs to this doctor
    if (appointment.doctor.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this appointment'
      });
    }

    // Check if appointment can be updated
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update appointment with status "${appointment.status}". Only pending appointments can be approved or rejected.`
      });
    }

    // Update status
    appointment.status = status;
    await appointment.save();

    // Populate response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName department specialization');

    res.status(200).json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: populatedAppointment
    });

  } catch (error) {
    console.error('Update appointment status by doctor error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message
    });
  }
};

/**
 * Get doctor's prescriptions
 */
export const getDoctorPrescriptions = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: userId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please complete your profile first.'
      });
    }

    // Find all prescriptions for this doctor
    const prescriptions = await Prescription.find({ doctor: doctorProfile._id })
      .populate('patient', 'fullName phone profileImage')
      .populate('appointment', 'appointmentDate appointmentTime status')
      .sort({ prescriptionDate: -1 }); // Newest first

    // Format response
    const formattedPrescriptions = prescriptions.map(prescription => ({
      _id: prescription._id,
      patient: prescription.patient ? {
        _id: prescription.patient._id,
        fullName: prescription.patient.fullName,
        phone: prescription.patient.phone,
        profileImage: prescription.patient.profileImage
      } : null,
      appointment: prescription.appointment ? {
        _id: prescription.appointment._id,
        appointmentDate: prescription.appointment.appointmentDate,
        appointmentTime: prescription.appointment.appointmentTime,
        status: prescription.appointment.status
      } : null,
      caseHistory: prescription.caseHistory,
      medications: prescription.medications,
      extraNotes: prescription.extraNotes,
      prescriptionDate: prescription.prescriptionDate,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedPrescriptions.length,
      data: formattedPrescriptions
    });

  } catch (error) {
    console.error('Get doctor prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prescriptions',
      error: error.message
    });
  }
};


/**
 * Update prescription (Doctor)
 */
export const updatePrescription = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { caseHistory, medications, extraNotes } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: userId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please complete your profile first.'
      });
    }

    // Find prescription
    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Verify prescription belongs to this doctor
    if (prescription.doctor.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this prescription'
      });
    }

    // Build update data
    const updateData = {};

    if (caseHistory !== undefined) {
      updateData.caseHistory = caseHistory;
    }

    if (extraNotes !== undefined) {
      updateData.extraNotes = extraNotes;
    }

    if (medications !== undefined) {
      // Validate medications is a non-empty array
      if (!Array.isArray(medications) || medications.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'medications must be a non-empty array'
        });
      }

      // Validate each medication has required fields
      for (const med of medications) {
        if (!med.medicineName || !med.dosage || !med.frequency || !med.duration) {
          return res.status(400).json({
            success: false,
            message: 'Each medication must have medicineName, dosage, frequency, and duration'
          });
        }
      }

      updateData.medications = medications;
    }

    // Check if any field is provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (caseHistory, medications, or extraNotes) must be provided for update'
      });
    }

    // Update prescription
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true 
      }
    )
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName department specialization')
      .populate('appointment', 'appointmentDate appointmentTime status');

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: updatedPrescription
    });

  } catch (error) {
    console.error('Update prescription error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid prescription ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update prescription',
      error: error.message
    });
  }
};

/**
 * Delete prescription (Doctor)
 */
export const deletePrescription = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: userId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please complete your profile first.'
      });
    }

    // Find prescription
    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Verify prescription belongs to this doctor
    if (prescription.doctor.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this prescription'
      });
    }

    // Delete prescription
    await Prescription.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully',
      data: {
        prescriptionId: id,
        deleted: true
      }
    });

  } catch (error) {
    console.error('Delete prescription error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid prescription ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete prescription',
      error: error.message
    });
  }
};


// get appointed patients

export const getMyPatients = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ user: req.user.id });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const appointments = await Appointment.find({
      doctor: doctor._id,
      status: { $ne: 'rejected' }
    }).populate({
      path: 'patient',
      // ✅ Populate patient profile data
      populate: {
        path: 'user',
        select: '-password -refreshToken'
      }
    });

    const patientMap = new Map();
    
    appointments.forEach(appointment => {
      if (appointment.patient) {
        const patientId = appointment.patient._id.toString();
        
        if (!patientMap.has(patientId)) {
          // ✅ Get fullName from PatientProfile OR User
          const patientData = appointment.patient;
          const userData = patientData.user || {};
          
          patientMap.set(patientId, {
            id: patientData._id,
            // ✅ Check both places for fullName
            fullName: patientData.fullName || userData.fullName || 'Unknown',
            phone: patientData.phone || userData.phone || '',
            gender: patientData.gender || '',
            dateOfBirth: patientData.dateOfBirth || '',
            bloodGroup: patientData.bloodGroup || '',
            address: patientData.address || '',
            profileImage: patientData.profileImage || userData.profileImage || null,
          });
        }
      }
    });

    let patients = Array.from(patientMap.values());
    patients.sort((a, b) => a.fullName.localeCompare(b.fullName));

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });

  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patients',
      error: error.message
    });
  }
};



// Create bed allotment (admission)
export const createAdmission = async (req, res) => {
  try {
    const {
      patientId,
      bedNumber,
      bedType,
      admissionDate,
      dischargeDate,
      reason,
    } = req.body;

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Verify patient exists
    const patient = await PatientProfile.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Check if bed is already assigned to an admitted patient
    const existingAdmission = await Admission.findOne({
      bedNumber,
      status: 'admitted',
    });

    if (existingAdmission) {
      return res.status(400).json({
        success: false,
        message: `Bed ${bedNumber} is already assigned to another admitted patient`,
      });
    }

    // Create admission
    const admission = await Admission.create({
      patient: patientId,
      doctor: doctorProfile._id,
      bedNumber,
      bedType,
      admissionDate: admissionDate || new Date(),
      dischargeDate: dischargeDate || null,
      status: 'admitted',
      reason: reason || '',
    });

    res.status(201).json({
      success: true,
      message: 'Bed allotted successfully',
      data: admission,
    });
  } catch (error) {
    console.error('Error creating admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allot bed',
      error: error.message,
    });
  }
};

// Get doctor's bed allotments (admissions)
export const getAdmissions = async (req, res) => {
  try {
    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Get admissions for this doctor
    const admissions = await Admission.find({ doctor: doctorProfile._id })
      .populate('patient', 'fullName phone profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admissions.length,
      data: admissions,
    });
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admissions',
      error: error.message,
    });
  }
};


// Update bed allotment (admission)
export const updateAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientId,
      bedNumber,
      bedType,
      admissionDate,
      dischargeDate,
      status,
    } = req.body;

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Find admission and verify it belongs to this doctor
    const admission = await Admission.findOne({
      _id: id,
      doctor: doctorProfile._id,
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found or you are not authorized to modify it',
      });
    }

    // If patientId is being changed, verify new patient exists
    if (patientId && patientId !== admission.patient.toString()) {
      const patient = await PatientProfile.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }
    }

    // Check bed availability if bedNumber or bedType is being changed
    if (bedNumber || bedType) {
      const newBedNumber = bedNumber || admission.bedNumber;
      
      // Check if this bed is already assigned to another admitted patient
      const existingAdmission = await Admission.findOne({
        _id: { $ne: id }, // Exclude current admission
        bedNumber: newBedNumber,
        status: 'admitted',
      });

      if (existingAdmission) {
        return res.status(400).json({
          success: false,
          message: `Bed ${newBedNumber} is already assigned to another admitted patient`,
        });
      }
    }

    // Update fields
    if (patientId) admission.patient = patientId;
    if (bedNumber) admission.bedNumber = bedNumber;
    if (bedType) admission.bedType = bedType;
    if (admissionDate) admission.admissionDate = admissionDate;
    if (dischargeDate !== undefined) admission.dischargeDate = dischargeDate;
    if (status) admission.status = status;

    await admission.save();

    // Populate patient for response
    const updatedAdmission = await Admission.findById(admission._id)
      .populate('patient', 'fullName phone profileImage');

    res.status(200).json({
      success: true,
      message: 'Bed allotment updated successfully',
      data: updatedAdmission,
    });
  } catch (error) {
    console.error('Error updating admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bed allotment',
      error: error.message,
    });
  }
};

// Delete bed allotment (admission)
export const deleteAdmission = async (req, res) => {
  try {
    const { id } = req.params;

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Find admission and verify it belongs to this doctor
    const admission = await Admission.findOne({
      _id: id,
      doctor: doctorProfile._id,
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found or you are not authorized to delete it',
      });
    }

    // Delete the admission
    await admission.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Bed allotment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bed allotment',
      error: error.message,
    });
  }
};

// Create report
export const createReport = async (req, res) => {
  try {
    const { patientId, type, description, reportDate } = req.body;

    // Validate type
    const validTypes = ['operation', 'birth', 'death'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type. Must be operation, birth, or death',
      });
    }

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Verify patient exists
    const patient = await PatientProfile.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Handle PDF upload if provided
    let pdfUrl = null;
    if (req.file) {
      // Upload PDF to Cloudinary with different folder and resource type
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'hms/reports',
        resourceType: 'raw', // Important for PDFs
        returnFullResult: true,
      });
      pdfUrl = result.secure_url;
    }

    // Create report
    const report = await Report.create({
      patient: patientId,
      doctor: doctorProfile._id,
      type,
      description,
      reportDate: reportDate || new Date(),
      pdfUrl,
    });

    // If type is 'operation', create operation history entry
    if (type === 'operation') {
      await Operation.create({
        patient: patientId,
        doctor: doctorProfile._id,
        description: description,
        operationDate: reportDate || new Date(),
        notes: `Report ID: ${report._id}`,
        status: 'completed',
      });
    }

    // Populate response
const populatedReport = await Report.findById(report._id)
  .populate({
    path: 'patient',
    populate: {
      path: 'user',
      select: 'fullName email profileImage'
    }
  })
  .populate({
    path: 'doctor',
    populate: {
      path: 'user',
      select: 'fullName email profileImage'
    }
  });  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report',
      error: error.message,
    });
  }
};

// Get doctor's reports
export const getReports = async (req, res) => {
  try {
    const { type } = req.query;
    const doctorProfile = await DoctorProfile.findOne({ user: req.user.id });
    
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const query = { doctor: doctorProfile._id };
    if (type) query.type = type;

    const reports = await Report.find(query)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'fullName email profileImage'
        }
      })
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',  // ✅ Populate user data for doctor
          select: 'fullName email profileImage'
        }
      })
      .sort({ reportDate: -1, createdAt: -1 });

    // ✅ Format response properly
    const formattedReports = reports.map(report => ({
      _id: report._id,
      type: report.type,
      description: report.description,
      reportDate: report.reportDate,
      pdfUrl: report.pdfUrl,
      patient: report.patient ? {
        _id: report.patient._id,
        fullName: report.patient.fullName || report.patient.user?.fullName || 'Unknown',
        phone: report.patient.phone || '',
        profileImage: report.patient.profileImage || report.patient.user?.profileImage || null
      } : null,
      doctor: report.doctor ? {
        _id: report.doctor._id,
        fullName: report.doctor.fullName || report.doctor.user?.fullName || 'Unknown',
        specialization: report.doctor.specialization || 'General',
        profileImage: report.doctor.user?.profileImage || null
      } : null,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedReports.length,
      data: formattedReports
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Update report
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, reportDate } = req.body;

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Find report and verify it belongs to this doctor
    const report = await Report.findOne({
      _id: id,
      doctor: doctorProfile._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or you are not authorized to modify it',
      });
    }

    // Store old type for operation history consistency
    const oldType = report.type;

    // Validate type if provided
    if (type) {
      const validTypes = ['operation', 'birth', 'death'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Must be operation, birth, or death',
        });
      }
    }

    // Handle PDF upload if provided
    let pdfUrl = report.pdfUrl;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'hms/reports',
        resourceType: 'raw',
        returnFullResult: true,
      });
      pdfUrl = result.secure_url;
    }

    // Update fields
    if (type) report.type = type;
    if (description) report.description = description;
    if (reportDate) report.reportDate = reportDate;
    if (pdfUrl !== report.pdfUrl) report.pdfUrl = pdfUrl;

    await report.save();

    // Handle operation history consistency if type changed to/from operation
    if (type && type !== oldType) {
      // If changed to operation, create operation entry
      if (type === 'operation') {
        await Operation.create({
          patient: report.patient,
          doctor: doctorProfile._id,
          description: report.description,
          operationDate: report.reportDate,
          notes: `Report ID: ${report._id}`,
          status: 'completed',
        });
      }
      // If changed from operation to something else, remove the associated operation
      else if (oldType === 'operation') {
        await Operation.deleteOne({
          patient: report.patient,
          doctor: doctorProfile._id,
          notes: `Report ID: ${report._id}`,
        });
      }
    }
    // If type remains operation but description/date updated, sync operation
    else if (type === 'operation' || oldType === 'operation') {
      const currentType = type || oldType;
      if (currentType === 'operation') {
        await Operation.findOneAndUpdate(
          {
            patient: report.patient,
            doctor: doctorProfile._id,
            notes: `Report ID: ${report._id}`,
          },
          {
            description: report.description,
            operationDate: report.reportDate,
          },
          { upsert: true }
        );
      }
    }

    // Populate response
    const updatedReport = await Report.findById(report._id)
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName specialization');

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: updatedReport,
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report',
      error: error.message,
    });
  }
};

// Delete report
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Find report and verify it belongs to this doctor
    const report = await Report.findOne({
      _id: id,
      doctor: doctorProfile._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or you are not authorized to delete it',
      });
    }

    // Store report type and patient for operation history cleanup
    const reportType = report.type;
    const patientId = report.patient;

    // Delete the report
    await report.deleteOne();

    // If report type is 'operation', remove the corresponding operation history entry
    if (reportType === 'operation') {
      await Operation.deleteOne({
        patient: patientId,
        doctor: doctorProfile._id,
        notes: `Report ID: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message,
    });
  }
};

// Change doctor password
// Change doctor password
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

    // Save with validation only for modified fields
    await user.save({ validateModifiedOnly: true });

    // Invalidate refresh token
    user.refreshToken = null;
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

// Edit appointment
export const editAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, appointmentDate, appointmentTime, reason } = req.body;

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Find appointment and verify it belongs to this doctor
    const appointment = await Appointment.findOne({
      _id: id,
      doctor: doctorProfile._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or you are not authorized to edit it',
      });
    }

    // Check if appointment can be edited
    const nonEditableStatuses = ['completed', 'cancelled', 'rejected'];
    if (nonEditableStatuses.includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit appointment with status: ${appointment.status}`,
      });
    }

    // If patientId is provided, verify the patient exists
    if (patientId) {
      const patient = await PatientProfile.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }
      appointment.patient = patientId;
    }

    // Update fields if provided
    if (appointmentDate) {
      // Validate appointment date (should not be in the past)
      const date = new Date(appointmentDate);
      if (date < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Appointment date cannot be in the past',
        });
      }
      appointment.appointmentDate = appointmentDate;
    }

    if (appointmentTime) {
      // Validate time format (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(appointmentTime)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format. Please use HH:MM format',
        });
      }
      appointment.appointmentTime = appointmentTime;
    }

    if (reason) {
      appointment.reason = reason;
    }

    await appointment.save();

    // Populate response
    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName specialization');

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment,
    });
  } catch (error) {
    console.error('Error editing appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit appointment',
      error: error.message,
    });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Find appointment and verify it belongs to this doctor
    const appointment = await Appointment.findOne({
      _id: id,
      doctor: doctorProfile._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or you are not authorized to delete it',
      });
    }

    // Check if appointment can be deleted
    const nonDeletableStatuses = ['completed', 'cancelled'];
    if (nonDeletableStatuses.includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete appointment with status: ${appointment.status}`,
      });
    }

    // Delete the appointment
    await appointment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
      error: error.message,
    });
  }
};

// Get all patients (for doctor dropdown)
export const getAllPatients = async (req, res) => {
  try {
    const patients = await PatientProfile.find()
      .populate('user', 'fullName email profileImage')
      .select('fullName phone');
    
    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients'
    });
  }
};