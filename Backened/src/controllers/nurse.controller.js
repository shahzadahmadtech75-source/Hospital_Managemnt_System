import PatientProfile from '../models/patientProfile.model.js';
import User from '../models/user.model.js';
import Bed from '../models/bed.models.js';
import Admission from '../models/admission.models.js';
import DoctorProfile from '../models/doctorProfile.model.js';
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