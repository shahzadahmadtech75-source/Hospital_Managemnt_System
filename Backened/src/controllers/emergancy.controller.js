import EmergencyContact from '../models/emergancy.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import User from '../models/user.model.js';


// Patient submits emergency contact
export const submitEmergencyContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emergencyType, message, urgencyLevel } = req.body;

    // Get patient profile
    const patient = await PatientProfile.findOne({ user: userId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found',
      });
    }

    const emergency = await EmergencyContact.create({
      patient: patient._id,
      patientName: patient.fullName,
      phone: patient.phone,
      emergencyType,
      message,
      urgencyLevel: urgencyLevel || 'medium',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Emergency contact submitted successfully',
      data: emergency,
    });
  } catch (error) {
    console.error('Submit emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit emergency contact',
      error: error.message,
    });
  }
};

// Admin gets all emergency contacts
export const getEmergencyContacts = async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {};
    if (status) filter.status = status;

    const emergencies = await EmergencyContact.find(filter)
      .populate('patient', 'fullName phone profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });
  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts',
      error: error.message,
    });
  }
};

// Admin updates emergency status
export const updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const emergency = await EmergencyContact.findById(id);
    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found',
      });
    }

    emergency.status = status;
    if (adminNote) emergency.adminNote = adminNote;
    if (status === 'resolved') emergency.resolvedAt = new Date();

    await emergency.save();

    res.status(200).json({
      success: true,
      message: 'Emergency status updated',
      data: emergency,
    });
  } catch (error) {
    console.error('Update emergency status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency status',
      error: error.message,
    });
  }
};

// Admin deletes emergency
export const deleteEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    const emergency = await EmergencyContact.findById(id);
    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found',
      });
    }

    await emergency.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Emergency contact deleted',
    });
  } catch (error) {
    console.error('Delete emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emergency contact',
      error: error.message,
    });
  }
};