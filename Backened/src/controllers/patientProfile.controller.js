// src/controllers/patientProfile.controller.js

import PatientProfile from '../models/patientProfile.model.js';
import User from '../models/user.model.js';

/**
 * Get authenticated user's patient profile
 * GET /api/v1/patient/profile
 */
export const getPatientProfile = async (req, res) => {
  try {
    // Use req.user.id from authentication middleware
    const userId = req.user.id;
    
    console.log('User ID from token:', userId);

    // Check if user exists
    const user = await User.findById(userId).select('username email profileImage');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find patient profile
    const profile = await PatientProfile.findOne({ user: userId });

    // If no profile exists, return 404
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Convert to object and add user data
    const profileData = profile.toObject();
    profileData.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage
    };

    res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient profile',
      error: error.message
    });
  }
};

/**
 * Update patient profile
 * PATCH /api/v1/patient/profile
 */
export const updatePatientProfile = async (req, res) => {
  try {
    // Use req.user.id from authentication middleware
    const userId = req.user.id;
    
    console.log('User ID for update:', userId);

    // Allowed fields for update
    const allowedUpdates = [
      'fullName',
      'phone',
      'address',
      'gender',
      'dateOfBirth',
      'bloodGroup',
      'emergencyContact'
    ];
    
    // Filter only allowed fields from request body
    const updateData = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    // Check if at least one field is provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }
    
    // Set profile as completed
    updateData.isProfileCompleted = true;
    
    // Find and update, or create if doesn't exist
    const profile = await PatientProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );
    
    // Get user data for response
    const user = await User.findById(userId).select('username email profileImage');
    
    // Combine for response
    const profileData = profile.toObject();
    profileData.user = user ? {
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage
    } : null;
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData
    });
    
  } catch (error) {
    console.error('Update patient profile error:', error);
    
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