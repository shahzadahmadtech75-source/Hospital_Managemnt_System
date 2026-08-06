// src/controllers/appointment.controller.js
import Appointment from '../models/appointment.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import DoctorProfile from '../models/doctorProfile.model.js';

/**
 * Apply for appointment
 * POST /api/v1/patient/appointments
 */
export const createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'doctorId, appointmentDate, and appointmentTime are required'
      });
    }

    // Get patient profile
    const patientProfile = await PatientProfile.findOne({ user: userId });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found. Please complete your profile first.'
      });
    }

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findById(doctorId);
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if doctor is available
    if (!doctorProfile.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is currently not available for appointments'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: patientProfile._id,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      reason: reason || '',
      status: 'pending',
      createdBy: 'patient',      // NEW
      createdByUser: userId      // NEW
    });

    await appointment.save();

    // Populate the response with patient and doctor details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName department specialization');

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully',
      data: populatedAppointment
    });

  } catch (error) {
    console.error('Create appointment error:', error);

    // Handle validation errors
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
      message: 'Failed to create appointment',
      error: error.message
    });
  }
};


export const getPatientAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Get patient profile
    const patientProfile = await PatientProfile.findOne({ user: userId });
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Build filter
    const filter = { patient: patientProfile._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(filter)
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName department specialization')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments',
      error: error.message
    });
  }
};






