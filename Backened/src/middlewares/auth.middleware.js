import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

/**
 * Authentication middleware - Verifies JWT access token and attaches user to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide an access token.',
        data: null,
      });
    }

    // Check if header has the correct format (Bearer <token>)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <accessToken>',
        data: null,
      });
    }

    const token = parts[1];

    // Verify the JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid access token.',
          data: null,
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token has expired. Please refresh your token.',
          data: null,
        });
      }
      // Other JWT errors
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please try again.',
        data: null,
      });
    }

    // Check if token contains required fields
    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token structure.',
        data: null,
      });
    }

    // Find user by userId from token (exclude sensitive fields)
    const user = await User.findById(decoded.userId).select('-password -refreshToken -__v');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists.',
        data: null,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        data: null,
      });
    }

    // Attach user to request object for subsequent middleware/controllers
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Authentication successful, proceed to next middleware/controller
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during authentication.',
      data: null,
    });
  }
};

/**
 * Optional: Middleware that makes authentication optional
 * Attaches user to req.user if token is valid, but doesn't require authentication
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token, just proceed without user
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded.userId) {
      return next();
    }

    const user = await User.findById(decoded.userId).select('-password -refreshToken -__v');

    if (user && user.isActive) {
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }

    next();
  } catch (error) {
    // If token validation fails, just proceed without user (optional auth)
    next();
  }
};