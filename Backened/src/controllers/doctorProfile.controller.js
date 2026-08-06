// src/controllers/doctorProfile.controller.js

import DoctorProfile from '../models/doctorProfile.model.js';
import User from '../models/user.model.js';

/**
 * Get authenticated doctor's profile
 * GET /api/v1/doctor/profile
 */
export const getDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user exists
    const user = await User.findById(userId).select('username email profileImage');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find doctor profile
    const profile = await DoctorProfile.findOne({ user: userId });

    // If no profile exists, return structured response with null profile
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage
          },
          profile: null,
          isProfileCompleted: false,
          message: 'Profile not yet created. Please complete your professional profile.'
        }
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
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor profile',
      error: error.message
    });
  }
};

/**
 * Update doctor profile
 * PATCH /api/v1/doctor/profile
 */
export const updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Allowed fields for doctor profile update
    const allowedUpdates = [
      'fullName',
      'department',
      'specialization',
      'qualification',
      'experienceYears',
      'phone',
      'address',
      'consultationFee',
      'description',
      'availability',
      'isAvailable'
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

    // Find and update, or create if doesn't exist
    const profile = await DoctorProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    // Get user data for response
    const userData = await User.findById(userId).select('username email profileImage');

    // Combine for response
    const profileData = profile.toObject();
    profileData.user = userData ? {
      _id: userData._id,
      username: userData.username,
      email: userData.email,
      profileImage: userData.profileImage
    } : null;

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: profileData
    });

  } catch (error) {
    console.error('Update doctor profile error:', error);

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
      message: 'Failed to update doctor profile',
      error: error.message
    });
  }
};

/**
 * Update doctor availability status
 * PATCH /api/v1/doctor/availability
 */
export const updateDoctorAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAvailable, availability } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build update data
    const updateData = {};
    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable;
    }
    if (availability) {
      updateData.availability = availability;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (isAvailable or availability) must be provided'
      });
    }

    // Find and update, or create if doesn't exist
    const profile = await DoctorProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        isAvailable: profile.isAvailable,
        availability: profile.availability
      }
    });

  } catch (error) {
    console.error('Update doctor availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
};