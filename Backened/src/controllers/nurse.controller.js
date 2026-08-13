import PatientProfile from '../models/patientProfile.model.js';
import User from '../models/user.model.js';
import Bed from '../models/bed.models.js';
import Admission from '../models/admission.models.js';
import DoctorProfile from '../models/doctorProfile.model.js';
import Report from '../models/report.models.js';
import Operation from '../models/operation.model.js';
import NurseProfile from '../models/nurseProfile.model.js';
import { uploadToCloudinary } from '../utils/uploadOnCloudinary.js';

// Get all patients
export const getAllPatients = async (req, res) => {
  try {
    // Get all patients with populated user data
    const patients = await PatientProfile.find()
      .populate({
        path: 'user',
        select: 'email username profileImage -_id',
      })
      .sort({ createdAt: -1 });

    // Format response to include all required fields
    const formattedPatients = patients.map((patient) => {
      const patientObj = patient.toObject();
      return {
        _id: patientObj._id,
        fullName: patientObj.fullName,
        email: patientObj.user?.email || null,
        username: patientObj.user?.username || null,
        phone: patientObj.phone,
        gender: patientObj.gender,
        dateOfBirth: patientObj.dateOfBirth,
        bloodGroup: patientObj.bloodGroup,
        address: patientObj.address,
        profileImage: patientObj.user?.profileImage || patientObj.profileImage || null,
        createdAt: patientObj.createdAt,
        updatedAt: patientObj.updatedAt,
      };
    });

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





// Create patient
export const createPatient = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      gender,
      dateOfBirth,
      bloodGroup,
      address,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !phone || !gender || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, password, phone, gender, and date of birth are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Handle profile image upload if provided
    let profileImageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      profileImageUrl = result;
    }

    // Generate username from email (before @)
    const username = email.split('@')[0];
    
    // Check if generated username exists, if so add random suffix
    let finalUsername = username;
    let usernameExists = await User.findOne({ username: finalUsername });
    let counter = 1;
    while (usernameExists) {
      finalUsername = `${username}${counter}`;
      usernameExists = await User.findOne({ username: finalUsername });
      counter++;
    }

    // Create user with patient role
    const user = new User({
      email,
      username: finalUsername,
      password,
      role: 'patient',
      isActive: true,
      isEmailVerified: false,
    });

    // Save user (pre-save hook will hash password)
    await user.save();

    try {
      // Create patient profile
      const patientProfile = new PatientProfile({
        user: user._id,
        fullName,
        phone,
        gender,
        dateOfBirth,
        bloodGroup: bloodGroup || null,
        address: address || null,
        profileImage: profileImageUrl,
        isProfileCompleted: true,
      });

      await patientProfile.save();

      // Return created patient
      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: {
          _id: patientProfile._id,
          fullName: patientProfile.fullName,
          email: user.email,
          phone: patientProfile.phone,
          gender: patientProfile.gender,
          dateOfBirth: patientProfile.dateOfBirth,
          bloodGroup: patientProfile.bloodGroup,
          address: patientProfile.address,
          profileImage: patientProfile.profileImage || user.profileImage || null,
          isProfileCompleted: patientProfile.isProfileCompleted,
          createdAt: patientProfile.createdAt,
          updatedAt: patientProfile.updatedAt,
        },
      });
    } catch (profileError) {
      // If patient profile creation fails, delete the user to avoid orphan records
      console.error('Patient profile creation failed, deleting user:', profileError);
      await User.findByIdAndDelete(user._id);
      
      // Re-throw the error to be caught by the outer catch block
      throw new Error(`Failed to create patient profile: ${profileError.message}`);
    }
  } catch (error) {
    console.error('Error creating patient:', error);
    
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
      message: 'Failed to create patient',
      error: error.message,
    });
  }
};



// Update patient
export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      username,
      phone,
      gender,
      dateOfBirth,
      bloodGroup,
      address,
    } = req.body;
    console.log('Request body:', req.body);

    // Find patient profile
    const patientProfile = await PatientProfile.findById(id);
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Find the associated user
    const user = await User.findById(patientProfile.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check email uniqueness if email is being changed
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: user._id } 
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
        });
      }
      user.email = email;
    }

    // Check username uniqueness if username is being changed
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ 
        username, 
        _id: { $ne: user._id } 
      });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists',
        });
      }
      user.username = username;
    }

    // Update PatientProfile fields
    if (fullName) patientProfile.fullName = fullName;
    if (phone) patientProfile.phone = phone;
    if (gender) patientProfile.gender = gender;
    if (dateOfBirth) patientProfile.dateOfBirth = dateOfBirth;
    if (bloodGroup !== undefined) patientProfile.bloodGroup = bloodGroup || null;
    if (address !== undefined) patientProfile.address = address || null;

    
    // Save both user and patient profile
    await user.save();
    await patientProfile.save();

    // Return updated patient
    const updatedPatient = await PatientProfile.findById(id)
      .populate({
        path: 'user',
        select: 'email username profileImage -_id',
      });

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: {
        _id: updatedPatient._id,
        fullName: updatedPatient.fullName,
        email: updatedPatient.user?.email || null,
        username: updatedPatient.user?.username || null,
        phone: updatedPatient.phone,
        gender: updatedPatient.gender,
        dateOfBirth: updatedPatient.dateOfBirth,
        bloodGroup: updatedPatient.bloodGroup,
        address: updatedPatient.address,
        profileImage: updatedPatient.profileImage || updatedPatient.user?.profileImage || null,
        isProfileCompleted: updatedPatient.isProfileCompleted,
        createdAt: updatedPatient.createdAt,
        updatedAt: updatedPatient.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    
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
      message: 'Failed to update patient',
      error: error.message,
    });
  }
};

// Delete patient
export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Find patient profile
    const patientProfile = await PatientProfile.findById(id);
    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Get the linked user ID
    const userId = patientProfile.user;

    // Delete the patient profile
    await patientProfile.deleteOne();

    // Delete the corresponding user account
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient',
      error: error.message,
    });
  }
};


// Create bed
export const createBed = async (req, res) => {
  try {
    const { bedNumber, bedType, description } = req.body;

    // Validate required fields
    if (!bedNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bed number is required',
      });
    }

    if (!bedType) {
      return res.status(400).json({
        success: false,
        message: 'Bed type is required',
      });
    }

    // Validate bedType against enum
    const validBedTypes = ['general', 'semi-private', 'private', 'ICU'];
    if (!validBedTypes.includes(bedType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bed type. Must be general, semi-private, private, or ICU',
      });
    }

    // Check if bed number already exists
    const existingBed = await Bed.findOne({ bedNumber });
    if (existingBed) {
      return res.status(400).json({
        success: false,
        message: `Bed number ${bedNumber} already exists`,
      });
    }

    // Create bed with status 'available'
    const bed = await Bed.create({
      bedNumber,
      bedType,
      description: description || null,
      status: 'available',
    });

    res.status(201).json({
      success: true,
      message: 'Bed created successfully',
      data: bed,
    });
  } catch (error) {
    console.error('Error creating bed:', error);
    
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
      message: 'Failed to create bed',
      error: error.message,
    });
  }
};

// Get all beds
export const getAllBeds = async (req, res) => {
  try {
    const beds = await Bed.find().sort({ bedNumber: 1 });

    res.status(200).json({
      success: true,
      count: beds.length,
      data: beds,
    });
  } catch (error) {
    console.error('Error fetching beds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beds',
      error: error.message,
    });
  }
};

// Update bed
export const updateBed = async (req, res) => {
  try {
    const { id } = req.params;
    const { bedNumber, bedType, description } = req.body;

    // Find bed
    const bed = await Bed.findById(id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found',
      });
    }

    // Validate bedType if provided
    if (bedType) {
      const validBedTypes = ['general', 'semi-private', 'private', 'ICU'];
      if (!validBedTypes.includes(bedType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid bed type. Must be general, semi-private, private, or ICU',
        });
      }
      bed.bedType = bedType;
    }

    // Check bedNumber uniqueness if being changed
    if (bedNumber && bedNumber !== bed.bedNumber) {
      const existingBed = await Bed.findOne({ 
        bedNumber, 
        _id: { $ne: id } 
      });
      if (existingBed) {
        return res.status(400).json({
          success: false,
          message: `Bed number ${bedNumber} already exists`,
        });
      }
      bed.bedNumber = bedNumber;
    }

    // Update description if provided
    if (description !== undefined) {
      bed.description = description || null;
    }

    await bed.save();

    res.status(200).json({
      success: true,
      message: 'Bed updated successfully',
      data: bed,
    });
  } catch (error) {
    console.error('Error updating bed:', error);
    
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
      message: 'Failed to update bed',
      error: error.message,
    });
  }
};

// Delete bed
export const deleteBed = async (req, res) => {
  try {
    const { id } = req.params;

    // Find bed
    const bed = await Bed.findById(id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found',
      });
    }

    // Check if bed is occupied
    if (bed.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete occupied bed. Please discharge the patient first.',
      });
    }

    // Delete the bed
    await bed.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Bed deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bed',
      error: error.message,
    });
  }
};




// Create bed allotment (admission)

export const createAdmission = async (req, res) => {
  try {
    const { bedId, patientId, doctorId, admissionDate, dischargeDate, reason } = req.body;

    // Validate required fields
    if (!bedId) {
      return res.status(400).json({
        success: false,
        message: 'Bed ID is required',
      });
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
    }

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required',
      });
    }

    // Get bed
    const bed = await Bed.findById(bedId);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found',
      });
    }

    // Verify bed is available
    if (bed.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Bed is not available',
      });
    }

    // Get patient
    const patient = await PatientProfile.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Get doctor
    const doctor = await DoctorProfile.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Create admission using existing Admission model
    const admission = await Admission.create({
      patient: patientId,
      doctor: doctorId,
      bedNumber: bed.bedNumber,
      bedType: bed.bedType,
      admissionDate: admissionDate || new Date(),
      dischargeDate: dischargeDate || null,
      reason: reason || '',
      status: 'admitted',
    });

    // Update bed status to occupied
    bed.status = 'occupied';
    await bed.save();

    // Populate response
    const populatedAdmission = await Admission.findById(admission._id)
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName specialization');

    res.status(201).json({
      success: true,
      message: 'Bed allotted successfully',
      data: {
        _id: populatedAdmission._id,
        patient: populatedAdmission.patient,
        doctor: populatedAdmission.doctor,
        bedNumber: populatedAdmission.bedNumber,
        bedType: populatedAdmission.bedType,
        admissionDate: populatedAdmission.admissionDate,
        dischargeDate: populatedAdmission.dischargeDate,
        status: populatedAdmission.status,
        reason: populatedAdmission.reason,
        createdAt: populatedAdmission.createdAt,
        updatedAt: populatedAdmission.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating admission:', error);
    
    // Handle bed occupied error from pre-save middleware
    if (error.status === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

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
      message: 'Failed to create admission',
      error: error.message,
    });
  }
};

// Get all bed allotments (admissions)
export const getAllAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.find()
      .populate('patient', 'fullName phone profileImage')
      .sort({ createdAt: -1 });

    // Format response
    const formattedAdmissions = admissions.map(admission => ({
      _id: admission._id,
      patient: admission.patient,
      bedNumber: admission.bedNumber,
      bedType: admission.bedType,
      admissionDate: admission.admissionDate,
      dischargeDate: admission.dischargeDate,
      status: admission.status,
      reason: admission.reason,
      createdAt: admission.createdAt,
      updatedAt: admission.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedAdmissions.length,
      data: formattedAdmissions,
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
    const { bedId, patientId, doctorId, admissionDate, dischargeDate, status, reason } = req.body;

    // Find admission
    const admission = await Admission.findById(id);
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found',
      });
    }

    // Store old bed for status management
    const oldBed = await Bed.findOne({ bedNumber: admission.bedNumber });
    let oldBedId = oldBed?._id || null;

    // Handle bed change if bedId is provided
    if (bedId) {
      // Verify new bed exists
      const newBed = await Bed.findById(bedId);
      if (!newBed) {
        return res.status(404).json({
          success: false,
          message: 'New bed not found',
        });
      }

      // Check if new bed is available
      if (newBed.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'New bed is not available',
        });
      }

      // Release old bed if it exists
      if (oldBed) {
        oldBed.status = 'available';
        await oldBed.save();
      }

      // Update admission with new bed details
      admission.bedNumber = newBed.bedNumber;
      admission.bedType = newBed.bedType;
      
      // Set new bed to occupied
      newBed.status = 'occupied';
      await newBed.save();
    }

    // Handle patient change if patientId is provided
    if (patientId) {
      const patient = await PatientProfile.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }
      admission.patient = patientId;
    }

    // Handle doctor change if doctorId is provided
    if (doctorId) {
      const doctor = await DoctorProfile.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }
      admission.doctor = doctorId;
    }

    // Update dates if provided
    if (admissionDate) {
      admission.admissionDate = admissionDate;
    }
    
    if (dischargeDate !== undefined) {
      admission.dischargeDate = dischargeDate || null;
    }

    // Update reason if provided
    if (reason !== undefined) {
      admission.reason = reason || '';
    }

    // Handle status change
    if (status) {
      // Validate status
      if (!['admitted', 'discharged'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be admitted or discharged',
        });
      }

      // If changing to discharged, use the model's discharge method
      if (status === 'discharged' && admission.status !== 'discharged') {
        await admission.discharge();
      } 
      // If changing to admitted
      else if (status === 'admitted' && admission.status !== 'admitted') {
        // Find the bed associated with this admission
        const currentBed = await Bed.findOne({ bedNumber: admission.bedNumber });
        if (currentBed) {
          if (currentBed.status !== 'available') {
            return res.status(400).json({
              success: false,
              message: `Bed ${admission.bedNumber} is not available for readmission`,
            });
          }
          currentBed.status = 'occupied';
          await currentBed.save();
        }
        admission.status = 'admitted';
        admission.dischargeDate = null;
        await admission.save();
      } else {
        admission.status = status;
        await admission.save();
      }
    }

    // If status not provided but bed changed, ensure bed status is synced
    if (!status && bedId) {
      // If admission is discharged, bed should be available
      if (admission.status === 'discharged') {
        const currentBed = await Bed.findOne({ bedNumber: admission.bedNumber });
        if (currentBed) {
          currentBed.status = 'available';
          await currentBed.save();
        }
      }
    }

    // If admission is being updated to discharged without using the discharge method
    if (!status && admission.status === 'discharged' && admission.dischargeDate === null) {
      admission.dischargeDate = new Date();
      await admission.save();
    }

    // Save admission if any changes were made
    await admission.save();

    // Populate response
    const updatedAdmission = await Admission.findById(admission._id)
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName specialization');

    res.status(200).json({
      success: true,
      message: 'Admission updated successfully',
      data: {
        _id: updatedAdmission._id,
        patient: updatedAdmission.patient,
        doctor: updatedAdmission.doctor,
        bedNumber: updatedAdmission.bedNumber,
        bedType: updatedAdmission.bedType,
        admissionDate: updatedAdmission.admissionDate,
        dischargeDate: updatedAdmission.dischargeDate,
        status: updatedAdmission.status,
        reason: updatedAdmission.reason,
        createdAt: updatedAdmission.createdAt,
        updatedAt: updatedAdmission.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating admission:', error);
    
    // Handle bed occupied error
    if (error.status === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

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
      message: 'Failed to update admission',
      error: error.message,
    });
  }
};

// Delete bed allotment (admission)
export const deleteAdmission = async (req, res) => {
  try {
    const { id } = req.params;

    // Find admission
    const admission = await Admission.findById(id);
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found',
      });
    }

    // Find the associated bed
    const bed = await Bed.findOne({ bedNumber: admission.bedNumber });
    if (bed) {
      // Set bed status to available
      bed.status = 'available';
      await bed.save();
    }

    // Delete the admission
    await admission.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Admission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete admission',
      error: error.message,
    });
  }
};


// Create report
export const createReport = async (req, res) => {
  try {
    const { patientId, doctorId, type, description, reportDate } = req.body;

    // Validate required fields
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
    }

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required',
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required',
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required',
      });
    }

    // Validate type
    const validTypes = ['operation', 'birth', 'death'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type. Must be operation, birth, or death',
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

    // Verify doctor exists
    const doctor = await DoctorProfile.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Handle PDF upload if provided
    let pdfUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'hms/reports',
        resourceType: 'raw',
        returnFullResult: true,
      });
      pdfUrl = result.secure_url;
    }

    // Create report
    const report = await Report.create({
      patient: patientId,
      doctor: doctorId,
      type,
      description,
      reportDate: reportDate || new Date(),
      pdfUrl,
    });

    // If type is 'operation', create operation history entry
    if (type === 'operation') {
      await Operation.create({
        patient: patientId,
        doctor: doctorId,
        description: description,
        operationDate: reportDate || new Date(),
        notes: `Report ID: ${report._id}`,
        status: 'completed',
      });
    }

    // Populate response
    const populatedReport = await Report.findById(report._id)
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName department specialization profileImage');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: populatedReport,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    
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
      message: 'Failed to create report',
      error: error.message,
    });
  }
};

// Get reports
export const getReports = async (req, res) => {
  try {
    const { type } = req.query;

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

    // Build query
    const query = {};
    if (type) {
      query.type = type;
    }

    // Get reports
    const reports = await Report.find(query)
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName department specialization profileImage')
      .sort({ reportDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message,
    });
  }
};

// Update report
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, doctorId, type, description, reportDate } = req.body;

    // Find report
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Store old type for operation history consistency
    const oldType = report.type;
    const oldPatientId = report.patient;
    const oldDoctorId = report.doctor;

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

    // Verify patient exists if patientId is provided
    if (patientId) {
      const patient = await PatientProfile.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found',
        });
      }
      report.patient = patientId;
    }

    // Verify doctor exists if doctorId is provided
    if (doctorId) {
      const doctor = await DoctorProfile.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }
      report.doctor = doctorId;
    }

    // Update fields
    if (type) report.type = type;
    if (description) report.description = description;
    if (reportDate) report.reportDate = reportDate;

    await report.save();

    // Handle operation history consistency if type changed
    const finalType = type || oldType;
    const finalPatientId = patientId || oldPatientId;
    const finalDoctorId = doctorId || oldDoctorId;

    // If type changed to/from operation
    if (type && type !== oldType) {
      // If changed to operation, create operation entry
      if (type === 'operation') {
        await Operation.create({
          patient: finalPatientId,
          doctor: finalDoctorId,
          description: description || report.description,
          operationDate: reportDate || report.reportDate,
          notes: `Report ID: ${report._id}`,
          status: 'completed',
        });
      }
      // If changed from operation to something else, remove the associated operation
      else if (oldType === 'operation') {
        await Operation.deleteOne({
          patient: oldPatientId,
          doctor: oldDoctorId,
          notes: `Report ID: ${report._id}`,
        });
      }
    }
    // If type remains operation but patient/doctor/description/date updated, sync operation
    else if (finalType === 'operation') {
      await Operation.findOneAndUpdate(
        {
          patient: finalPatientId,
          doctor: finalDoctorId,
          notes: `Report ID: ${report._id}`,
        },
        {
          description: description || report.description,
          operationDate: reportDate || report.reportDate,
        },
        { upsert: true }
      );
    }

    // Populate response
    const updatedReport = await Report.findById(report._id)
      .populate('patient', 'fullName phone profileImage')
      .populate('doctor', 'fullName department specialization profileImage');

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: updatedReport,
    });
  } catch (error) {
    console.error('Error updating report:', error);
    
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
      message: 'Failed to update report',
      error: error.message,
    });
  }
};

// Delete report
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Find report
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Store report type and patient for operation history cleanup
    const reportType = report.type;
    const patientId = report.patient;
    const doctorId = report.doctor;

    // Delete the report
    await report.deleteOne();

    // If report type is 'operation', remove the corresponding operation history entry
    if (reportType === 'operation') {
      await Operation.deleteOne({
        patient: patientId,
        doctor: doctorId,
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





// Get nurse profile
export const getNurseProfile = async (req, res) => {
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

    // Find nurse profile
    const profile = await NurseProfile.findOne({ user: userId });

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
        },
        profile: profile,
        isProfileCompleted: profile ? true : false,
      },
    });
  } catch (error) {
    console.error('Error fetching nurse profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nurse profile',
      error: error.message,
    });
  }
};

// Create or update nurse profile
export const updateNurseProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { fullName, phone, address, profileDescription } = req.body;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    if (!user.username && user.email) {
  user.username = user.email.split('@')[0];
  // Check uniqueness and add suffix if needed
  const existing = await User.findOne({ username: user.username, _id: { $ne: userId } });
  if (existing) {
    user.username = `${user.username}${Date.now().toString().slice(-4)}`;
  }
}
    // Handle profile image upload if provided
    let profileImageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      profileImageUrl = result;
    }

    // Find or create nurse profile
    let profile = await NurseProfile.findOne({ user: userId });

    if (!profile) {
      // Create new profile
      profile = new NurseProfile({
        user: userId,
        fullName: fullName || '',
        phone: phone || null,
        address: address || null,
        profileDescription: profileDescription || null,
        profileImage: profileImageUrl,
      });
    } else {
      // Update existing profile
      if (fullName) profile.fullName = fullName;
      if (phone !== undefined) profile.phone = phone || null;
      if (address !== undefined) profile.address = address || null;
      if (profileDescription !== undefined) profile.profileDescription = profileDescription || null;
      if (profileImageUrl) profile.profileImage = profileImageUrl;
    }

    await profile.save();

    // Update user profileImage if image was uploaded
    if (profileImageUrl) {
      user.profileImage = profileImageUrl;
      await user.save();
    }

    // Get updated user
    const updatedUser = await User.findById(userId).select('-password -refreshToken -passwordChangedAt');

    res.status(200).json({
      success: true,
      message: profile.isNew ? 'Nurse profile created successfully' : 'Nurse profile updated successfully',
      data: {
        user: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          profileImage: updatedUser.profileImage,
        },
        profile: profile,
        isProfileCompleted: true,
      },
    });
  } catch (error) {
    console.error('Error upserting nurse profile:', error);
    
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
      message: 'Failed to save nurse profile',
      error: error.message,
    });
  }
};


// Change nurse password
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