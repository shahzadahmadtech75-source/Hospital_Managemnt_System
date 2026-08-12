import User from '../models/user.model.js';
import { generateAccessToken , generateRefreshToken } from '../utils/generateTokens.js';
import jwt from 'jsonwebtoken';
// ADD AT THE TOP OF THE FILE WITH OTHER IMPORTS:
import cloudinary from '../config/cloudinary.js';
import { uploadToCloudinary } from '../utils/uploadOnCloudinary.js';
import PatientProfile from '../models/patientProfile.model.js';



/**
 * Register a new patient
 * POST /api/v1/auth/register
 */

export const register = async (req, res) => {
  try {
    const { email, password, username ,fullName} = req.body;

    // 1. Initial Presence Validations
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and username are required',
        data: null,
      });
    }

    // 2. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        data: null,
      });
    }

    // 3. Username Validation & Sanitization
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters',
        data: null,
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, underscores, and spaces',
        data: null,
      });
    }

    // 4. Password Validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        data: null,
      });
    }

    // 5. Database Duplicate Check
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } } // Case-insensitive matching
      ]
    });

    if (existingUser) {
      const isEmailMatch = existingUser.email === normalizedEmail;
      return res.status(409).json({
        success: false,
        message: isEmailMatch 
          ? 'An account with this email already exists' 
          : 'This username is already taken',
        data: null,
      });
    }

    // 6. Optional Cloudinary Profile Image Upload
    
const profileImageUrl = req.file
  ? await uploadToCloudinary(req.file.buffer)
  : null;

    // 7. Save Document to Database
    const user = new User({
      fullName:fullName,
      email: normalizedEmail,
      username: cleanUsername,
      password, // Automatically hashed by your pre-save middleware
      role: 'patient',
      profileImage: profileImageUrl
    });

    await user.save();

     
     

    // 8. Generate Authentication Token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // 9. Send Final Response
    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: profileImageUrl
      }
    });

  } catch (error) {
    // Fallback duplicate key check
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or username already exists',
        data: null,
      });
    }

    // Mongoose Model Constraints Validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
        data: null,
      });
    }

    console.error('Registration critical error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      data: null,
    });
  }
};


// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        data: null,
      });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Find user by email and explicitly include password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        data: null,
      });
    }

    // Compare the provided password with the stored hash
    const isPasswordValid = await user.comparePassword(password);

    // Check if password is correct
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set refresh token as HttpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matching REFRESH_TOKEN_EXPIRES_IN)
      // Uncomment in production when using HTTPS:
      // secure: true,
      // sameSite: 'none',
    });

    // Prepare safe user data for response
    const userResponse = {
      id: user._id,
      username:user.username,
      email: user.email,
      role: user.role,
    };

    // Login successful - return access token in response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        accessToken: accessToken,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
      data: null,
    });
  }
};

/**Refresh tokens */
export const refreshAccessToken = async (req, res) => {
  try {
    // 🔍 DEBUG: Log all cookies
    console.log('📨 All cookies received:', req.cookies);
    console.log('📨 Refresh token from cookie:', req.cookies.refreshToken);

    // 1. Read refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      console.log('❌ No refresh token in cookies');
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found. Please login again.',
        data: null,
      });
    }

    console.log('✅ Refresh token found in cookie');

    // 2. Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      console.log('✅ Token verified successfully:', decoded);
    } catch (error) {
      console.error('❌ Token verification failed:', error.name, error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token. Please login again.',
          data: null,
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired. Please login again.',
          data: null,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please login again.',
        data: null,
      });
    }

    // 3. Extract userId from token
    if (!decoded.userId) {
      console.error('❌ No userId in token payload');
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token payload. Please login again.',
        data: null,
      });
    }

    console.log(`🔍 Looking for user: ${decoded.userId}`);

    // 4. Find user by userId (explicitly select refreshToken)
    const user = await User.findById(decoded.userId).select('+refreshToken');

    // 5. Validate user
    if (!user) {
      console.error('❌ User not found:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
        data: null,
      });
    }

    console.log(`✅ User found: ${user.email}`);

    if (!user.isActive) {
      console.error('❌ User is inactive:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        data: null,
      });
    }

    // 6. Check if stored refresh token exists
    if (!user.refreshToken) {
      console.error('❌ No stored refresh token for user:', user.email);
      return res.status(401).json({
        success: false,
        message: 'No active session found. Please login again.',
        data: null,
      });
    }

    console.log(`🔍 Comparing tokens...`);
    console.log(`📥 Incoming token: ${refreshToken.substring(0, 30)}...`);
    console.log(`💾 Stored token: ${user.refreshToken.substring(0, 30)}...`);

    // 7. Compare incoming token with stored token
    if (refreshToken !== user.refreshToken) {
      console.error('❌ Token mismatch - possible token theft');
      // Clear stored refresh token for security
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
      
      // Clear the cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token. Please login again.',
        data: null,
      });
    }

    console.log('✅ Tokens match! Proceeding with rotation...');

    // 8. Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // 9. Replace stored refresh token
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    console.log('✅ New tokens generated and saved');

    // 10. Set new refresh token in cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('✅ Refresh token cookie set');

    // 11. Return only the new access token
    return res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during token refresh.',
      data: null,
    });
  }
};

 
/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    // Clear the cookie regardless of whether token exists
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    // If refresh token exists, try to invalidate it
    if (refreshToken) {
      try {
        // Decode the token to get userId (without verifying signature)
        // This way we can still get userId even if token is expired
        const decoded = jwt.decode(refreshToken);
        
        if (decoded && decoded.userId) {
          // Find user and remove refresh token from database
          const user = await User.findById(decoded.userId);
          if (user) {
            user.refreshToken = null;
            await user.save({ validateBeforeSave: false });
            console.log(`✅ User logged out: ${user.email} (ID: ${user._id})`);
          } else {
            console.log(`⚠️ User not found for ID: ${decoded.userId}`);
          }
        } else {
          console.log('⚠️ No userId found in refresh token');
        }
      } catch (error) {
        // Token is invalid or malformed - try to extract userId anyway
        console.log('ℹ️ Invalid refresh token during logout:', error.message);
        
        // Try to decode without verification as fallback
        try {
          const decoded = jwt.decode(refreshToken);
          if (decoded && decoded.userId) {
            const user = await User.findById(decoded.userId);
            if (user) {
              user.refreshToken = null;
              await user.save({ validateBeforeSave: false });
              console.log(`✅ User logged out via fallback: ${user.email}`);
            }
          }
        } catch (decodeError) {
          console.log('ℹ️ Could not decode refresh token, clearing cookie only');
        }
      }
    } else {
      console.log('ℹ️ No refresh token found during logout');
    }

    // Always return success - logout is idempotent
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, ensure cookie is cleared
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      });
    } catch (cookieError) {
      console.error('Error clearing cookie during logout:', cookieError);
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
      data: null,
    });
  }
};


/**
 * Temporary debug endpoint to check users
 * Remove this in production
 */
export const getUsers = async (req, res) => {
  try {
    // Get all users without passwords
    const users = await User.find({}).select('-password -refreshToken -__v');
    
    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        count: users.length,
        users: users
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching users',
      data: null
    });
  }
};
