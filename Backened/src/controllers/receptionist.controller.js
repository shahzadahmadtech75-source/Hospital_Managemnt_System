import Appointment from '../models/appointment.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import DoctorProfile from '../models/doctorProfile.model.js';
import User from '../models/user.model.js';
import { uploadToCloudinary } from '../utils/uploadOnCloudinary.js';

/**
 * Create patient (Receptionist)
 * Used for walk-in patients or new patient registration by receptionist
 */
export const createPatientByReceptionist = async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      fullName,
      phone,
      address,
      gender,
      dateOfBirth,
      bloodGroup
    } = req.body;

    // ============================================
    // Validate Required Fields
    // ============================================
    if (!email || !username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, username, password, and fullName are required'
      });
    }

    // ============================================
    // Check for Existing User
    // ============================================
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // ============================================
    // Create User
    // ============================================
    const user = new User({
      email,
      username,
      password, // Will be hashed by pre-save hook
      role: 'patient',
      isActive: true,
      isEmailVerified: true // Receptionist verified in person
    });

    await user.save();

    // ============================================
    // Create PatientProfile
    // ============================================
    const patientProfile = new PatientProfile({
      user: user._id,
      fullName,
      phone: phone || '',
      address: address || '',
      gender: gender || '',
      dateOfBirth: dateOfBirth || null,
      bloodGroup: bloodGroup || '',
      isProfileCompleted: true // Receptionist filled the data
    });

    await patientProfile.save();

    // ============================================
    // Populate Response
    // ============================================
    const populatedPatient = await PatientProfile.findById(patientProfile._id)
      .populate('user', 'username email isActive');

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: {
        _id: populatedPatient._id,
        userId: populatedPatient.user._id,
        fullName: populatedPatient.fullName,
        phone: populatedPatient.phone,
        address: populatedPatient.address,
        gender: populatedPatient.gender,
        dateOfBirth: populatedPatient.dateOfBirth,
        bloodGroup: populatedPatient.bloodGroup,
        isProfileCompleted: populatedPatient.isProfileCompleted,
        user: {
          email: populatedPatient.user.email,
          username: populatedPatient.user.username,
          isActive: populatedPatient.user.isActive
        },
        credentials: {
          email: email,
          username: username,
          message: 'Patient account created successfully. Please provide credentials to the patient.'
        }
      }
    });

  } catch (error) {
    console.error('Create patient (receptionist) error:', error);

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
        message: 'Duplicate entry detected. Please check email or username.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create patient',
      error: error.message
    });
  }
};

/**
 * Create appointment (Receptionist)
 * Used for booking appointments for existing patients only
 * Patients must be created first using createPatientByReceptionist
 */
export const createAppointmentByReceptionist = async (req, res) => {
  try {
    const receptionistId = req.user.id;
    const {
      patientId,           // Required - ID of existing patient
      doctorId,
      appointmentDate,
      appointmentTime,
      reason,
      notes,
      status = 'approved'
    } = req.body;

    // ============================================
    // Validate Required Fields
    // ============================================
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required'
      });
    }

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'doctorId, appointmentDate, and appointmentTime are required'
      });
    }

    // ============================================
    // Find Patient
    // ============================================
    let patientProfile = await PatientProfile.findById(patientId);
    
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
        message: 'Patient not found. Please create the patient first using the patient registration endpoint.'
      });
    }

    // ============================================
    // Find and Validate Doctor
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
      status: { $in: ['pending', 'approved'] }
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

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: {
        appointment: populatedAppointment,
        patientInfo: {
          patientId: patientProfile._id,
          fullName: patientProfile.fullName,
          phone: patientProfile.phone
        }
      }
    });

  } catch (error) {
    console.error('Create appointment (receptionist) error:', error);

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
    
    let patientResults = [];
    
    // 1. Search in PatientProfile first (for complete profiles)
    let profileCriteria = {};
    if (query) {
      profileCriteria.fullName = { $regex: query, $options: 'i' };
    }
    if (phone) {
      profileCriteria.phone = { $regex: phone, $options: 'i' };
    }
    
    const profiles = await PatientProfile.find(profileCriteria)
      .populate('user', 'username email isActive');
    
    patientResults = profiles.map(p => ({
      _id: p._id,
      fullName: p.fullName || 'Unknown',
      phone: p.phone || '',
      email: p.user?.email || null,
      username: p.user?.username || null,
      isActive: p.user?.isActive || false,
      isProfileCompleted: p.isProfileCompleted || false,
      hasProfile: true,
      userId: p.user?._id
    }));
    
    // 2. Search in User collection for patients without profiles
    if (query || email) {
      let userCriteria = { role: 'patient' };
      
      if (query) {
        // Search by username or email
        userCriteria.$or = [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ];
      }
      
      if (email) {
        userCriteria.email = { $regex: email, $options: 'i' };
      }
      
      const users = await User.find(userCriteria).select('username email isActive');
      
      // Check which users don't have PatientProfile yet
      const existingUserIds = patientResults.map(p => p.userId?.toString());
      
      for (const user of users) {
        const userIdStr = user._id.toString();
        
        // Check if user already has a profile
        const hasProfile = patientResults.some(p => p.userId?.toString() === userIdStr);
        
        if (!hasProfile) {
          // Check if this user actually has a PatientProfile
          const profile = await PatientProfile.findOne({ user: user._id });
          
          if (!profile) {
            patientResults.push({
              _id: null, // No PatientProfile yet
              fullName: 'Unknown (Incomplete Profile)',
              phone: '',
              email: user.email,
              username: user.username,
              isActive: user.isActive,
              isProfileCompleted: false,
              hasProfile: false,
              userId: user._id,
              needsProfileCreation: true
            });
          }
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: patientResults,
      count: patientResults.length
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


/**
 * Search doctors (Receptionist)
 * GET /api/v1/receptionist/doctors/search
 */
export const searchDoctors = async (req, res) => {
  try {
    const { 
      query,      // Search by name, department, or specialization
      department,
      specialization,
      phone,
      email,
      isAvailable // Filter by availability (true/false)
    } = req.query;

    // Build search criteria
    let searchCriteria = {};

    // Search by name
    if (query) {
      searchCriteria.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { department: { $regex: query, $options: 'i' } },
        { specialization: { $regex: query, $options: 'i' } }
      ];
    }

    // Filter by department
    if (department) {
      searchCriteria.department = { $regex: department, $options: 'i' };
    }

    // Filter by specialization
    if (specialization) {
      searchCriteria.specialization = { $regex: specialization, $options: 'i' };
    }

    // Filter by phone
    if (phone) {
      searchCriteria.phone = { $regex: phone, $options: 'i' };
    }

    // Filter by availability
    if (isAvailable !== undefined) {
      searchCriteria.isAvailable = isAvailable === 'true';
    }

    // If email is provided, search in User model
    let userFilter = {};
    if (email) {
      const users = await User.find({ 
        email: { $regex: email, $options: 'i' },
        role: 'doctor'
      });
      
      if (users.length > 0) {
        searchCriteria.user = { $in: users.map(u => u._id) };
      } else {
        // No users found, return empty results
        return res.status(200).json({
          success: true,
          data: [],
          count: 0,
          message: 'No doctors found with this email'
        });
      }
    }

    // If no search criteria provided
    if (Object.keys(searchCriteria).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter is required'
      });
    }

    // Search doctors and populate user data
    const doctors = await DoctorProfile.find(searchCriteria)
      .populate('user', 'username email isActive profileImage')
      .select('fullName department specialization qualification experienceYears phone address consultationFee description availability isAvailable');

    // Format response
    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      userId: doctor.user?._id,
      fullName: doctor.fullName,
      department: doctor.department,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experienceYears: doctor.experienceYears,
      phone: doctor.phone,
      address: doctor.address,
      consultationFee: doctor.consultationFee,
      description: doctor.description,
      availability: doctor.availability,
      isAvailable: doctor.isAvailable,
      email: doctor.user?.email || null,
      username: doctor.user?.username || null,
      profileImage: doctor.user?.profileImage || null,
      isActive: doctor.user?.isActive || false
    }));

    res.status(200).json({
      success: true,
      data: formattedDoctors,
      count: formattedDoctors.length,
      message: formattedDoctors.length > 0 ? 'Doctors found' : 'No doctors found'
    });

  } catch (error) {
    console.error('Search doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search doctors',
      error: error.message
    });
  }
};


/**
 * Update patient profile (Receptionist)
 */
export const updatePatientByReceptionist = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle FormData - fields come from req.body when using multer
    // Handle JSON - fields come from req.body directly
    const {
      fullName,
      email,
      phone,
      address,
      gender,
      dateOfBirth,
      profileImage,
      bloodGroup
    } = req.body;

    // DEBUG: Log what we received
    console.log('Received body:', req.body);
    console.log('Received file:', req.file);

    // If using FormData with file upload, profileImage might be a file
    let imageUrl = profileImage;
    if (req.file) {
      // If there's a file, upload to Cloudinary (you'll need to implement this)
      // For now, we'll use the file path or buffer
      console.log('File received:', req.file.originalname);
      // imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    // ============================================
    // Find Patient Profile
    // ============================================
    const patient = await PatientProfile.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // ============================================
    // Update User Model (if email or profileImage provided)
    // ============================================
    const user = await User.findById(patient.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found for this patient'
      });
    }

    // Update email if provided
    if (email !== undefined && email !== null && email !== '') {
      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ 
          email: email,
          _id: { $ne: user._id }
        });
        
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists for another user'
          });
        }
        
        user.email = email;
      }
    }

    // Update profile image if provided
    if (imageUrl !== undefined && imageUrl !== null && imageUrl !== '') {
      user.profileImage = imageUrl;
    }

    // Save user updates
    await user.save();

    // ============================================
    // Update PatientProfile
    // ============================================
    const updateData = {};
    
    // Only update fields that are provided and not empty
    if (fullName !== undefined && fullName !== null && fullName !== '') {
      updateData.fullName = fullName;
    }
    if (phone !== undefined && phone !== null && phone !== '') {
      updateData.phone = phone;
    }
    if (address !== undefined && address !== null && address !== '') {
      updateData.address = address;
    }
    if (gender !== undefined && gender !== null && gender !== '') {
      updateData.gender = gender;
    }
    if (dateOfBirth !== undefined && dateOfBirth !== null && dateOfBirth !== '') {
      updateData.dateOfBirth = dateOfBirth;
    }
    if (bloodGroup !== undefined && bloodGroup !== null && bloodGroup !== '') {
      updateData.bloodGroup = bloodGroup;
    }

    // If any patient profile fields to update
    if (Object.keys(updateData).length > 0) {
      // Set profile as completed if essential fields are filled
      if (fullName && phone && address) {
        updateData.isProfileCompleted = true;
      }

      await PatientProfile.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    }

    // ============================================
    // Get Updated Patient Profile
    // ============================================
    const updatedPatient = await PatientProfile.findById(id)
      .populate('user', 'username email profileImage isActive');

    // Calculate age from dateOfBirth if available
    let age = null;
    if (updatedPatient.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(updatedPatient.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // ============================================
    // Response
    // ============================================
    res.status(200).json({
      success: true,
      message: 'Patient profile updated successfully',
      data: {
        _id: updatedPatient._id,
        userId: updatedPatient.user._id,
        fullName: updatedPatient.fullName,
        email: updatedPatient.user.email,
        phone: updatedPatient.phone,
        address: updatedPatient.address,
        gender: updatedPatient.gender,
        dateOfBirth: updatedPatient.dateOfBirth,
        age: age,
        profileImage: updatedPatient.user.profileImage,
        bloodGroup: updatedPatient.bloodGroup,
        isProfileCompleted: updatedPatient.isProfileCompleted,
        user: {
          username: updatedPatient.user.username,
          isActive: updatedPatient.user.isActive
        },
        updatedFields: {
          fullName: fullName !== undefined,
          email: email !== undefined,
          phone: phone !== undefined,
          address: address !== undefined,
          gender: gender !== undefined,
          dateOfBirth: dateOfBirth !== undefined,
          profileImage: profileImage !== undefined,
          bloodGroup: bloodGroup !== undefined
        }
      }
    });

  } catch (error) {
    console.error('Update patient error:', error);

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
      message: 'Failed to update patient',
      error: error.message
    });
  }
};


/**
 * Update receptionist profile
 */
export const updateReceptionistProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName,
      email,
      phone,
      address
    } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ============================================
    // Handle Profile Image Upload
    // ============================================
    let profileImageUrl = null;
    
    if (req.file) {
      try {
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

    // ============================================
    // Update User Fields
    // ============================================
    const updateData = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    
    // Handle email update with uniqueness check
    if (email !== undefined && email !== user.email) {
      const existingUser = await User.findOne({ 
        email: email,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists for another user'
        });
      }
      updateData.email = email;
    }

    if (profileImageUrl) {
      updateData.profileImage = profileImageUrl;
    }

    // Check if any field is provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -refreshToken -__v');

    res.status(200).json({
      success: true,
      message: 'Receptionist profile updated successfully',
      data: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileImage: updatedUser.profileImage,
        username: updatedUser.username,
        role: updatedUser.role,
        imageUpdated: !!profileImageUrl,
        updatedFields: Object.keys(updateData)
      }
    });

  } catch (error) {
    console.error('Update receptionist profile error:', error);

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
 * Get receptionist profile
 */
export const getReceptionistProfile = async (req, res) => {

  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password -refreshToken -__v');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get receptionist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message
    });
  }
};



/**
 * Change receptionist password
 */
export const changeReceptionistPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

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

    // ✅ FIX: Use findById with password field included
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

    // ✅ FIX: Only set the password and save (don't update other fields)
    user.password = newPassword;
    
    // Update passwordChangedAt if the model has this field
    if (user.schema.path('passwordChangedAt')) {
      user.passwordChangedAt = new Date();
    }

    // ✅ FIX: Save the user directly - this will only validate modified fields
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
    console.error('Change receptionist password error:', error);

    // Handle validation errors from User model
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};