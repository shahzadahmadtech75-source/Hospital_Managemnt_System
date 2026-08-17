import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import cloudinary from '../config/cloudinary.js';
import { uploadToCloudinary } from '../utils/uploadOnCloudinary.js';
import Invoice from '../models/invoice.model.js';
import Prescription from '../models/prescription.model.js';
import Report from '../models/report.models.js';
import Department from '../models/department.model.js';
import DoctorProfile from '../models/doctorProfile.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import NurseProfile from '../models/nurseProfile.model.js';
import AccountantProfile from '../models/accountantProfile.model.js';
import ReceptionistProfile from '../models/receptionistProfile.model.js';
import Admission from '../models/admission.models.js';
import Notice from '../models/notice.model.js';

/*
 * Create admin account (Temporary - Development Only)
 * POST /api/v1/admin/create-admin
 */
export const createAdmin = async (req, res,next) => {
  try {
    const { email, password,username ,secretKey } = req.body;

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is not available in production',
        data: null,
      });
    }

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        data: null,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        data: null,
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        data: null,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
        data: null,
      });
    }

    // Create admin user
    const user = await User.create({
      email: email.toLowerCase(),
      username,
      password,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });

    // Prepare response
    const userResponse = {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: userResponse,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
        data: null,
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
        data: null,
      });
    }

    console.error('Create admin error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      data: null,
    });
  }
  next()
};

/*
* Activate a user account
 */
export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Validate MongoDB ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        data: null,
      });
    }

    // Find user by ID, excluding sensitive fields
    const user = await User.findById(id)
      .select('-password -refreshToken -passwordChangedAt -__v');

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    // Check if user is a staff member
    const allowedStaffRoles = ['doctor', 'nurse', 'receptionist', 'accountant'];
    if (!allowedStaffRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin can only manage staff accounts',
        data: null,
      });
    }

    // Check if user is already active
    if (user.isActive) {
      return res.status(200).json({
        success: true,
        message: 'User account is already active',
        data: {
          id: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      });
    }

    // Activate the user
    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'User account activated successfully',
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });

  } catch (error) {
    console.error('Activate user error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      data: null,
    });
  }
};

/**
 * Deactivate a user account
 * PATCH /api/v1/admin/users/:id/deactivate
 */
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Validate MongoDB ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        data: null,
      });
    }

    // Prevent admin from deactivating their own account
    if (id.toString() === adminId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot deactivate your own account',
        data: null,
      });
    }

    // Find user by ID, excluding sensitive fields
    const user = await User.findById(id)
      .select('-password -refreshToken -passwordChangedAt -__v');

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    // Check if user is a staff member
    const allowedStaffRoles = ['doctor', 'nurse', 'receptionist', 'accountant'];
    if (!allowedStaffRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin can only manage staff accounts',
        data: null,
      });
    }

    // Check if user is already inactive
    if (!user.isActive) {
      return res.status(200).json({
        success: true,
        message: 'User account is already deactivated',
        data: {
          id: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      });
    }

    // Deactivate the user
    user.isActive = false;
    
    // Clear refresh token when deactivating for security
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'User account deactivated successfully',
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      data: null,
    });
  }
};
/**
 * Create staff account (Admin only)
 * POST /api/v1/admin/users
 */
export const createStaffAccount = async (req, res) => {
  try {
    const { email, password, role, username, profileImage } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required',
        data: null,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        data: null,
      });
    }

    // Validate password length (consistent with User model)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        data: null,
      });
    }

    // Allowed staff roles (excludes admin and patient)
    const allowedStaffRoles = ['doctor', 'nurse', 'receptionist', 'laboratorist','accountant'];
    
    // Validate role is allowed for staff creation
    if (!allowedStaffRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${allowedStaffRoles.join(', ')}`,
        data: null,
      });
    }

        // ADD: Username validation
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
        data: null,
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters',
        data: null,
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores',
        data: null,
      });
    }


    // Check if user already exists
    // ADD: Check if email or username already exists
const existingUser = await User.findOne({ 
  $or: [
    { email: email.toLowerCase() },
    { username: username.toLowerCase() }
  ]
});
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
        data: null,
      });
    }
    // Upload profile image to Cloudinary if provided
const profileImageUrl = req.file
  ? await uploadToCloudinary(req.file.buffer)
  : null;

    // Create new staff user
    const user = await User.create({
  email: email.toLowerCase(),
  username: username.toLowerCase(), // ADD: username
  password,
  role: role,
  isActive: true,
  isEmailVerified: false,
  profileImage: profileImageUrl || null, // ADD: profileImage (optional)
});

    // Prepare safe user data for response
    const userResponse = {
      id: user._id,
      username:user.username,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      data: userResponse,
    });

  } catch (error) {
    // Handle duplicate key error (fallback)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
        data: null,
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
        data: null,
      });
    }

    // Handle other errors
    console.error('Create staff account error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      data: null,
    });
  }
}

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Count users by role
    const [doctors, patients, nurses, receptionists, accountants] = await Promise.all([
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'nurse' }),
      User.countDocuments({ role: 'receptionist' }),
      User.countDocuments({ role: 'accountant' }),
    ]);

    // Count invoices
    const invoices = await Invoice.countDocuments();

    // Count prescriptions
    const prescriptions = await Prescription.countDocuments();

    // Count reports by type
    const [reports, operations, births, deaths] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ type: 'operation' }),
      Report.countDocuments({ type: 'birth' }),
      Report.countDocuments({ type: 'death' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        doctors,
        patients,
        nurses,
        receptionists,
        accountants,
        invoices,
        prescriptions,
        reports,
        operations,
        births,
        deaths,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};



// Create department
export const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required',
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Department description is required',
      });
    }

    // Check if department name already exists
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists',
      });
    }

    // Handle image upload if provided
    let imageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result;
    }

    // Create department
    const department = await Department.create({
      name: name.trim(),
      description: description.trim(),
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    console.error('Error creating department:', error);

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
      message: 'Failed to create department',
      error: error.message,
    });
  }
};

// Get all departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message,
    });
  }
};


// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Find department
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Check name uniqueness if name is being changed
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({
        name,
        _id: { $ne: id },
      });
      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists',
        });
      }
      department.name = name.trim();
    }

    // Update description if provided
    if (description) {
      department.description = description.trim();
    }

    // Handle image upload if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      department.image = result;
    }

    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error) {
    console.error('Error updating department:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message,
    });
  }
};

// Delete department - Check both ways
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Find department
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Check if any doctors are assigned to this department (by name)
    const doctorsInDepartment = await DoctorProfile.findOne({
      department: department.name,
    });

    if (doctorsInDepartment) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete department "${department.name}". It is currently assigned to one or more doctors.`,
        assignedDoctors: await DoctorProfile.countDocuments({ department: department.name }),
      });
    }

    // Delete the department
    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting department:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message,
    });
  }
};

// Get all staff (doctors, nurses, receptionists, accountants)
export const getStaff = async (req, res) => {
  try {
    const staffRoles = ['doctor', 'nurse', 'receptionist', 'accountant'];

    const staff = await User.find({ role: { $in: staffRoles } })
      .select('-password -refreshToken -passwordChangedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message,
    });
  }
};


// Get staff profile by ID
export const getStaffProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findById(id).select('-password -refreshToken -passwordChangedAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    // Check if user has a staff role
    const staffRoles = ['doctor', 'nurse', 'receptionist', 'accountant'];
    if (!staffRoles.includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: `User with role "${user.role}" is not a staff member`,
      });
    }

    // Find corresponding profile based on role
    let profile = null;
    let isProfileCompleted = false;

    switch (user.role) {
      case 'doctor':
        profile = await DoctorProfile.findOne({ user: user._id });
        break;
      case 'nurse':
        profile = await NurseProfile.findOne({ user: user._id });
        break;
      case 'receptionist':
        profile = await ReceptionistProfile.findOne({ user: user._id });
        break;
      case 'accountant':
        profile = await AccountantProfile.findOne({ user: user._id });
        break;
      default:
        break;
    }

    if (profile) {
      isProfileCompleted = true;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profileImage: user.profileImage,
        },
        profile: profile,
        isProfileCompleted: isProfileCompleted,
      },
    });
  } catch (error) {
    console.error('Error fetching staff profile:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff profile',
      error: error.message,
    });
  }
};

// Get all patients with their profiles
export const getPatients = async (req, res) => {
  try {
    // Find all users with role 'patient'
    const users = await User.find({ role: 'patient' })
      .select('-password -refreshToken -passwordChangedAt')
      .sort({ createdAt: -1 });

    // Get patient profiles for all users
    const patientsWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await PatientProfile.findOne({ user: user._id });

        // Calculate age if dateOfBirth exists
        let age = null;
        if (profile && profile.dateOfBirth) {
          const today = new Date();
          const birthDate = new Date(profile.dateOfBirth);
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        return {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            isActive: user.isActive,
          },
          profile: profile
            ? {
                _id: profile._id,
                fullName: profile.fullName,
                phone: profile.phone,
                gender: profile.gender,
                dateOfBirth: profile.dateOfBirth,
                bloodGroup: profile.bloodGroup,
                address: profile.address,
                age: age,
              }
            : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: patientsWithProfiles.length,
      data: patientsWithProfiles,
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

// Get single patient with profile
export const getPatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await User.findById(id).select('-password -refreshToken -passwordChangedAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Verify user is a patient
    if (user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'User is not a patient',
      });
    }

    // Find patient profile
    const profile = await PatientProfile.findOne({ user: user._id });

    // Calculate age if profile exists and has dateOfBirth
    let age = null;
    if (profile && profile.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(profile.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Format profile data
    let profileData = null;
    let isProfileCompleted = false;

    if (profile) {
      profileData = {
        _id: profile._id,
        fullName: profile.fullName,
        phone: profile.phone,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        bloodGroup: profile.bloodGroup,
        address: profile.address,
        profileImage: profile.profileImage,
        isProfileCompleted: profile.isProfileCompleted,
        age: age,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };
      isProfileCompleted = true;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        profile: profileData,
        isProfileCompleted: isProfileCompleted,
      },
    });
  } catch (error) {
    console.error('Error fetching patient:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: error.message,
    });
  }
};

// Create patient
export const createPatient = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      phone,
      gender,
      address,
      bloodGroup,
      dateOfBirth,
    } = req.body;

    // Validate required fields
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone is required',
      });
    }

    if (!gender) {
      return res.status(400).json({
        success: false,
        message: 'Gender is required',
      });
    }

    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth is required',
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle profile image upload if provided
    let profileImageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      profileImageUrl = result;
    }

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'patient',
      isActive: true,
      isEmailVerified: false,
      profileImage: profileImageUrl,
    });

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

      // Calculate age
      let age = null;
      if (dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Return created patient
      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            isActive: user.isActive,
          },
          profile: {
            _id: patientProfile._id,
            fullName: patientProfile.fullName,
            phone: patientProfile.phone,
            gender: patientProfile.gender,
            dateOfBirth: patientProfile.dateOfBirth,
            bloodGroup: patientProfile.bloodGroup,
            address: patientProfile.address,
            profileImage: patientProfile.profileImage,
            age: age,
          },
          isProfileCompleted: true,
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



// Activate patient
export const activatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        data: null,
      });
    }

    // Find user by ID, excluding sensitive fields
    const user = await User.findById(id)
      .select('-password -refreshToken -passwordChangedAt -__v');

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        data: null,
      });
    }

    // Verify user is a patient
    if (user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'User is not a patient',
        data: null,
      });
    }

    // Check if user is already active
    if (user.isActive) {
      return res.status(200).json({
        success: true,
        message: 'Patient account is already active',
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profileImage: user.profileImage,
        },
      });
    }

    // Activate the patient
    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Patient account activated successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profileImage: user.profileImage,
      },
    });

  } catch (error) {
    console.error('Activate patient error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      data: null,
    });
  }
};

// Deactivate patient
export const deactivatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        data: null,
      });
    }

    // Find user by ID, excluding sensitive fields
    const user = await User.findById(id)
      .select('-password -refreshToken -passwordChangedAt -__v');

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
        data: null,
      });
    }

    // Verify user is a patient
    if (user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'User is not a patient',
        data: null,
      });
    }

    // Check if user is already inactive
    if (!user.isActive) {
      return res.status(200).json({
        success: true,
        message: 'Patient account is already deactivated',
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profileImage: user.profileImage,
        },
      });
    }

    // Deactivate the patient
    user.isActive = false;
    
    // Clear refresh token for security
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Patient account deactivated successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profileImage: user.profileImage,
      },
    });

  } catch (error) {
    console.error('Deactivate patient error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      data: null,
    });
  }
};

// Get all invoices for monitoring
export const getMonitorInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('patient', '_id fullName phone profileImage')
      .populate('doctor', '_id fullName department specialization')
      .populate('appointment', '_id appointmentDate appointmentTime status')
      .populate('admission', '_id bedNumber bedType admissionDate dischargeDate status')
      .sort({ issueDate: -1, createdAt: -1 });

    // Format response to match the actual Invoice model
    const formattedInvoices = invoices.map(invoice => ({
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      patient: invoice.patient,
      doctor: invoice.doctor || null,
      appointment: invoice.appointment || null,
      admission: invoice.admission || null,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate || null,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      dueAmount: invoice.dueAmount,
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod || null,
      notes: invoice.notes || null,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedInvoices.length,
      data: formattedInvoices,
    });
  } catch (error) {
    console.error('Error fetching invoices for monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message,
    });
  }
};



// Get single invoice for monitoring
export const getMonitorInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID format',
      });
    }

    // Find invoice with all populations
    const invoice = await Invoice.findById(id)
      .populate('patient', '_id fullName phone profileImage')
      .populate('doctor', '_id fullName department specialization')
      .populate('appointment', '_id appointmentDate appointmentTime status')
      .populate('admission', '_id bedNumber bedType admissionDate dischargeDate status');

    // Check if invoice exists
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Format response to match the actual Invoice model
    const formattedInvoice = {
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      patient: invoice.patient,
      doctor: invoice.doctor || null,
      appointment: invoice.appointment || null,
      admission: invoice.admission || null,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate || null,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      dueAmount: invoice.dueAmount,
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod || null,
      notes: invoice.notes || null,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedInvoice,
    });
  } catch (error) {
    console.error('Error fetching invoice for monitoring:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message,
    });
  }
};



// Get all bed allotments (admissions) for monitoring
export const getMonitorBedAllotments = async (req, res) => {
  try {
    const allotments = await Admission.find()
      .populate('patient', '_id fullName phone profileImage')
      .populate('doctor', '_id fullName department specialization')
      .sort({ createdAt: -1, admissionDate: -1 });

    // Format response to match the actual Admission model fields
    const formattedAllotments = allotments.map(allotment => ({
      _id: allotment._id,
      patient: allotment.patient,
      doctor: allotment.doctor || null,
      bedNumber: allotment.bedNumber,
      bedType: allotment.bedType,
      admissionDate: allotment.admissionDate,
      dischargeDate: allotment.dischargeDate || null,
      status: allotment.status,
      reason: allotment.reason || null,
      createdAt: allotment.createdAt,
      updatedAt: allotment.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedAllotments.length,
      data: formattedAllotments,
    });
  } catch (error) {
    console.error('Error fetching bed allotments for monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bed allotments',
      error: error.message,
    });
  }
};

// Get all reports for monitoring
export const getMonitorReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('patient', '_id fullName phone profileImage')
      .populate('doctor', '_id fullName specialization department')
      .sort({ reportDate: -1, createdAt: -1 });

    // Format response to match the actual Report model fields
    const formattedReports = reports.map(report => ({
      _id: report._id,
      patient: report.patient,
      doctor: report.doctor,
      type: report.type,
      description: report.description,
      reportDate: report.reportDate,
      pdfUrl: report.pdfUrl || null,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedReports.length,
      data: formattedReports,
    });
  } catch (error) {
    console.error('Error fetching reports for monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message,
    });
  }
};



// Get single report for monitoring
export const getMonitorReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      });
    }

    // Find report with all populations
    const report = await Report.findById(id)
      .populate('patient', '_id fullName phone profileImage')
      .populate('doctor', '_id fullName specialization department');

    // Check if report exists
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Format response to match the actual Report model fields
    const formattedReport = {
      _id: report._id,
      patient: report.patient,
      doctor: report.doctor,
      type: report.type,
      description: report.description,
      reportDate: report.reportDate,
      pdfUrl: report.pdfUrl || null,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedReport,
    });
  } catch (error) {
    console.error('Error fetching report for monitoring:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message,
    });
  }
};

// Create notice
export const createNotice = async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required',
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required',
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date is required',
      });
    }

    // Validate that endDate is not earlier than startDate
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be on or after the start date',
      });
    }

    // Create notice
    const notice = await Notice.create({
      title: title.trim(),
      description: description.trim(),
      startDate: start,
      endDate: end,
    });

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: notice,
    });
  } catch (error) {
    console.error('Error creating notice:', error);

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
      message: 'Failed to create notice',
      error: error.message,
    });
  }
};

// Get all notices
export const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ startDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notices',
      error: error.message,
    });
  }
};

// Update notice
export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate } = req.body;

    // Validate MongoDB ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notice ID format',
      });
    }

    // Find notice
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    // Update fields if provided
    if (title) {
      notice.title = title.trim();
    }

    if (description) {
      notice.description = description.trim();
    }

    // Handle date validation
    let newStartDate = notice.startDate;
    let newEndDate = notice.endDate;

    if (startDate) {
      newStartDate = new Date(startDate);
    }

    if (endDate) {
      newEndDate = new Date(endDate);
    }

    // Validate that endDate is not earlier than startDate
    if (newEndDate < newStartDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be on or after the start date',
      });
    }

    // Update dates if provided
    if (startDate) {
      notice.startDate = newStartDate;
    }

    if (endDate) {
      notice.endDate = newEndDate;
    }

    await notice.save();

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully',
      data: notice,
    });
  } catch (error) {
    console.error('Error updating notice:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notice ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update notice',
      error: error.message,
    });
  }
};

// Delete notice
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notice ID format',
      });
    }

    // Find notice
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    // Delete the notice
    await notice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notice:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notice ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete notice',
      error: error.message,
    });
  }
};

// Update admin profile
export const updateAdminProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { fullName, email } = req.body;

    // Validate at least one field is provided
    if (!fullName && !email) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (fullName or email) must be provided',
      });
    }

    // Find user and verify role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User is not an admin',
      });
    }

    // Update fullName if provided
    if (fullName) {
      user.fullName = fullName.trim();
    }

    // Update email if provided
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if email is already used by another user
      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: userId },
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use by another user',
          });
        }

        user.email = normalizedEmail;
      }
    }

    // Save with validation only for modified fields
    await user.save({ validateModifiedOnly: true });

    // Return safe admin information
    const safeUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      profileImage: user.profileImage,
      isActive: user.isActive,
    };

    res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully',
      data: safeUser,
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);

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
      message: 'Failed to update admin profile',
      error: error.message,
    });
  }
};



// Change admin password
export const changeAdminPassword = async (req, res) => {
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

    // Verify user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User is not an admin'
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
    console.error('Change admin password error:', error);

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