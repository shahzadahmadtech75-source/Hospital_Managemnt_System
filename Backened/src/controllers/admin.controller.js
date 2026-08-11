import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import cloudinary from '../config/cloudinary.js';
import { uploadToCloudinary } from '../utils/uploadOnCloudinary.js';


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

/**
 * Get all users with optional role filtering
 * GET /api/v1/admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    // Build filter object
    const filter = {};
    
    // Check for role filter
    if (req.query.role) {
      const { role } = req.query;
      
      // Validate role against enum
      const allowedRoles = ['admin', 'doctor', 'patient', 'nurse', 'receptionist', 'laboratorist'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`,
          data: null,
        });
      }
      
      filter.role = role;
    }

    // Get users with filter, excluding sensitive fields
    const users = await User.find(filter)
      .select('-password -refreshToken -passwordChangedAt -__v')
      .sort({ createdAt: -1 }); // Newest first

    // Prepare safe user data
    const userResponses = users.map((user) => ({
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        count: userResponses.length,
        users: userResponses,
      },
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      data: null,
    });
  }
};

/**
 * Get single user by ID
 * GET /api/v1/admin/users/:id
 */
export const getUserById = async (req, res) => {
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
        message: 'User not found',
        data: null,
      });
    }

    // Prepare safe user data
    const userResponse = {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: userResponse,
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      data: null,
    });
  }
};

/**
 * Activate a user account
 * PATCH /api/v1/admin/users/:id/activate
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