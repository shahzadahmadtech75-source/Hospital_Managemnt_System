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


/*
 * Create admin account (Temporary - Development Only)
 * POST /api/v1/admin/create-admin
 */
export const createAdmin = async (req, res,next) => {
  try {
    const { email, password, secretKey } = req.body;

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