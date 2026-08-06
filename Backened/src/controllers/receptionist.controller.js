import Appointment from '../models/appointment.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import DoctorProfile from '../models/doctorProfile.model.js';
import User from '../models/user.model.js';

/**
 * Create appointment (Receptionist)
 * POST /api/v1/receptionist/appointments
 * 
 * Supports:
 * 1. Existing patient (by patientId)
 * 2. New patient (walk-in) - creates user + patient profile
 */
export const createAppointmentByReceptionist = async (req, res) => {
  try {
    const receptionistId = req.user.id;
    const {
      // Patient info (for existing OR new patient)
      patientId,           // Optional - if provided, use existing patient
      
      // New patient fields (if patient doesn't exist)
      patientEmail,        // Required for new patient
      patientUsername,     // Required for new patient
      patientPassword,     // Required for new patient
      patientFullName,     // Required for new patient
      patientPhone,        // Optional
      patientAddress,      // Optional
      patientGender,       // Optional
      patientDateOfBirth,  // Optional
      patientBloodGroup,   // Optional
      
      // Appointment fields
      doctorId,
      appointmentDate,
      appointmentTime,
      reason,
      notes,
      status = 'approved'
    } = req.body;

    let patientProfile;
    let isNewPatient = false;

    // ============================================
    // CASE 1: Existing patient (by patientId)
    // ============================================
    if (patientId) {
      // Try to find by PatientProfile._id
      patientProfile = await PatientProfile.findById(patientId);
      
      if (!patientProfile) {
        // Try to find by User._id
        const user = await User.findById(patientId);
        if (user) {
          patientProfile = await PatientProfile.findOne({ user: user._id });
        }
      }
      
      if (!patientProfile) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found with the provided ID'
        });
      }
    } 
    
    // ============================================
    // CASE 2: New patient (walk-in)
    // ============================================
    else {
      // Validate required fields for new patient
      if (!patientEmail || !patientUsername || !patientPassword || !patientFullName) {
        return res.status(400).json({
          success: false,
          message: 'For new patients, patientEmail, patientUsername, patientPassword, and patientFullName are required'
        });
      }

      // Check if user already exists with this email or username
      const existingUser = await User.findOne({
        $or: [{ email: patientEmail }, { username: patientUsername }]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email or username. Please use patientId instead.'
        });
      }

      // Create new User with patient role
      const newUser = new User({
        email: patientEmail,
        username: patientUsername,
        password: patientPassword, // Will be hashed by pre-save hook
        role: 'patient',
        isActive: true,
        isEmailVerified: true // Receptionist verified in person
      });

      await newUser.save();

      // Create PatientProfile
      patientProfile = new PatientProfile({
        user: newUser._id,
        fullName: patientFullName,
        phone: patientPhone || '',
        address: patientAddress || '',
        gender: patientGender || '',
        dateOfBirth: patientDateOfBirth || null,
        bloodGroup: patientBloodGroup || '',
        isProfileCompleted: true // Receptionist filled the data
      });

      await patientProfile.save();
      isNewPatient = true;
    }

    // ============================================
    // Validate Appointment Fields
    // ============================================
    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'doctorId, appointmentDate, and appointmentTime are required'
      });
    }

    // ============================================
    // Validate Doctor Exists and is Available
    // ============================================
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

    // ============================================
    // Check for Scheduling Conflicts
    // ============================================
    const existingAppointment = await Appointment.findOne({
      doctor: doctorProfile._id,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      status: { $in: ['pending', 'approved'] } // Don't check completed/cancelled
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another time.'
      });
    }

    // ============================================
    // Validate Status
    // ============================================
    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be pending, approved, or rejected'
      });
    }

    // ============================================
    // Create Appointment
    // ============================================
    const appointment = new Appointment({
      patient: patientProfile._id,
      doctor: doctorProfile._id,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      reason: reason || '',
      notes: notes || '',
      status: status || 'approved',
      createdBy: 'receptionist',
      createdByUser: receptionistId
    });

    await appointment.save();

    // ============================================
    // Populate Response
    // ============================================
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName department specialization')
      .populate('createdByUser', 'username email');

    // Prepare response
    const responseData = {
      appointment: populatedAppointment,
      patientInfo: {
        isNewPatient: isNewPatient,
        patientId: patientProfile._id,
        fullName: patientProfile.fullName,
        phone: patientProfile.phone,
        email: patientProfile.user?.email || null
      }
    };

    // If new patient, include credentials
    if (isNewPatient) {
      responseData.patientInfo.credentials = {
        email: patientEmail,
        username: patientUsername,
        // Don't send password back for security
        message: 'Patient account created. Temporary password has been set.'
      };
    }

    res.status(201).json({
      success: true,
      message: isNewPatient 
        ? 'Appointment created successfully and new patient registered' 
        : 'Appointment created successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Create appointment (receptionist) error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate appointment
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Appointment already exists for this patient, doctor, date, and time'
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
};

/**
 * Get all appointments (Receptionist)
 * GET /api/v1/receptionist/appointments
 */
export const getAllAppointments = async (req, res) => {
  try {
    const { 
      status, 
      date, 
      doctor, 
      patient,
      startDate,
      endDate,
      page = 1,
      limit = 20 
    } = req.query;

    // Build filter
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (doctor) {
      filter.doctor = doctor;
    }

    if (patient) {
      filter.patient = patient;
    }

    if (startDate && endDate) {
      filter.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get appointments with pagination
    const appointments = await Appointment.find(filter)
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName department specialization')
      .populate('createdByUser', 'username email')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
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
    console.error('Get all appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments',
      error: error.message
    });
  }
};

/**
 * Get appointment by ID (Receptionist)
 * GET /api/v1/receptionist/appointments/:id
 */
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName department specialization')
      .populate('createdByUser', 'username email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Get appointment by ID error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment',
      error: error.message
    });
  }
};

/**
 * Update appointment (Receptionist)
 * PUT /api/v1/receptionist/appointments/:id
 */
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      appointmentDate, 
      appointmentTime, 
      reason, 
      notes,
      doctorId,
      status
    } = req.body;

    // Find appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be updated
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${appointment.status} appointment`
      });
    }

    // Build update data
    const updateData = {};
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
    if (appointmentTime) updateData.appointmentTime = appointmentTime;
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    if (status) {
      // Validate status
      if (!['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
      updateData.status = status;
    }

    // If changing doctor, verify new doctor
    if (doctorId) {
      const doctorProfile = await DoctorProfile.findById(doctorId);
      if (!doctorProfile) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
      updateData.doctor = doctorId;
    }

    // Check for scheduling conflicts (if date/time/doctor changed)
    if ((appointmentDate || appointmentTime || doctorId) && 
        status !== 'cancelled' && status !== 'rejected') {
      const conflictCheck = await Appointment.findOne({
        _id: { $ne: id },
        doctor: doctorId || appointment.doctor,
        appointmentDate: new Date(appointmentDate || appointment.appointmentDate),
        appointmentTime: appointmentTime || appointment.appointmentTime,
        status: { $in: ['pending', 'approved'] }
      });

      if (conflictCheck) {
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked. Please choose another time.'
        });
      }
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName department specialization')
      .populate('createdByUser', 'username email');

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    });

  } catch (error) {
    console.error('Update appointment error:', error);

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
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};

/**
 * Cancel appointment (Receptionist)
 * PATCH /api/v1/receptionist/appointments/:id/cancel
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    // Find appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed appointment'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    // Update status to cancelled
    appointment.status = 'cancelled';
    if (cancelReason) {
      // Add cancellation reason to notes
      appointment.notes = appointment.notes 
        ? `${appointment.notes}\nCancellation reason: ${cancelReason}`
        : `Cancellation reason: ${cancelReason}`;
    }
    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName department specialization')
      .populate('createdByUser', 'username email');

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: populatedAppointment
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};


/**
 * Approve or reject appointment
 * PATCH /api/v1/receptionist/appointments/:id/status
 */
export const updateAppointmentStatus = async (req, res) => {
  try {
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

    // Find appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be updated
    // Only pending appointments can be approved or rejected
    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update appointment with status "${appointment.status}". Only pending appointments can be approved or rejected.`
      });
    }

    // Update status
    appointment.status = status;
    await appointment.save();

    // Populate response with patient and doctor details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'fullName phone')
      .populate('doctor', 'fullName department specialization');

    res.status(200).json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: populatedAppointment
    });

  } catch (error) {
    console.error('Update appointment status error:', error);

    // Handle CastError (invalid ObjectId)
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


/* Search patients (Receptionist)
 
 */
export const searchPatients = async (req, res) => {
  try {
    const { query, phone, email } = req.query;

    // Build search criteria
    let searchCriteria = {};

    if (query) {
      // Search by fullName (case-insensitive)
      searchCriteria.fullName = { $regex: query, $options: 'i' };
    }

    if (phone) {
      searchCriteria.phone = { $regex: phone, $options: 'i' };
    }

    if (email) {
      // First find users with matching email
      const users = await User.find({ 
        email: { $regex: email, $options: 'i' } 
      });
      
      if (users.length > 0) {
        searchCriteria.user = { $in: users.map(u => u._id) };
      } else {
        // No users found, return empty results
        return res.status(200).json({
          success: true,
          data: [],
          count: 0
        });
      }
    }

    // If no search criteria provided, return empty or all patients
    if (Object.keys(searchCriteria).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter (query, phone, or email) is required'
      });
    }

    // Search patients and populate user data
    const patients = await PatientProfile.find(searchCriteria)
      .populate('user', 'username email isActive')
      .select('fullName phone address gender dateOfBirth bloodGroup isProfileCompleted');

    // Format response
    const formattedPatients = patients.map(patient => ({
      _id: patient._id,
      fullName: patient.fullName,
      phone: patient.phone,
      email: patient.user?.email || null,
      username: patient.user?.username || null,
      isActive: patient.user?.isActive || false,
      isProfileCompleted: patient.isProfileCompleted,
      address: patient.address,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      bloodGroup: patient.bloodGroup
    }));

    res.status(200).json({
      success: true,
      data: formattedPatients,
      count: formattedPatients.length
    });

  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search patients',
      error: error.message
    });
  }
};