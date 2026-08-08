// src/controllers/doctorProfile.controller.js

import DoctorProfile from '../models/doctorProfile.model.js';
import User from '../models/user.model.js';
import Appointment from '../models/appointment.model.js';
import Prescription from '../models/prescription.model.js';
import PatientProfile from '../models/patientProfile.model.js';

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