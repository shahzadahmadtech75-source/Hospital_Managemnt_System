// src/controllers/doctorProfile.controller.js

import DoctorProfile from '../models/doctorProfile.model.js';
import User from '../models/user.model.js';
import Appointment from '../models/appointment.model.js';
import Prescription from '../models/prescription.model.js';

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