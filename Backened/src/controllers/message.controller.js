import mongoose from 'mongoose';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js'
import Appointment from '../models/appointment.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import DoctorProfile from '../models/doctorProfile.model.js';

// ============================================
// Helper: Check if user is patient
// ============================================
const isPatient = async (userId) => {
  const user = await User.findById(userId);
  return user && user.role === 'patient';
};

// ============================================
// Helper: Check if user is doctor
// ============================================
const isDoctor = async (userId) => {
  const user = await User.findById(userId);
  return user && user.role === 'doctor';
};

// ============================================
// Helper: Get patient profile by user ID
// ============================================
const getPatientProfile = async (userId) => {
  return await PatientProfile.findOne({ user: userId });
};

// ============================================
// Helper: Get doctor profile by user ID
// ============================================
const getDoctorProfile = async (userId) => {
  return await DoctorProfile.findOne({ user: userId });
};

// ============================================
// Helper: Check if patient has appointment with doctor
// ============================================
const hasAppointmentWithDoctor = async (patientUserId, doctorUserId) => {
  const patientProfile = await getPatientProfile(patientUserId);
  const doctorProfile = await getDoctorProfile(doctorUserId);

  if (!patientProfile || !doctorProfile) return false;

  const appointment = await Appointment.findOne({
    patient: patientProfile._id,
    doctor: doctorProfile._id,
    status: { $in: ['approved', 'completed'] },
  });

  return !!appointment;
};

// ============================================
// Helper: Check if messaging relationship is allowed
// ============================================
const isMessagingAllowed = async (user1Id, user1Role, user2Id, user2Role) => {
  // Admin ↔ Staff (Doctor, Nurse, Receptionist, Accountant)
  if (user1Role === 'admin') {
    const staffRoles = ['doctor', 'nurse', 'receptionist', 'accountant'];
    if (staffRoles.includes(user2Role)) return true;
    return false;
  }

  if (user2Role === 'admin') {
    const staffRoles = ['doctor', 'nurse', 'receptionist', 'accountant'];
    if (staffRoles.includes(user1Role)) return true;
    return false;
  }

  // ✅ Staff (Doctor, Nurse, Receptionist, Accountant) ↔ Patient
  const staffRoles = ['doctor', 'nurse', 'receptionist', 'accountant'];
  
  // Staff → Patient
  if (staffRoles.includes(user1Role) && user2Role === 'patient') {
    return true;
  }
  
  // Patient → Staff
  if (user1Role === 'patient' && staffRoles.includes(user2Role)) {
    return true;
  }

  // Patient ↔ Doctor (with appointment validation - stricter)
  if (user1Role === 'patient' && user2Role === 'doctor') {
    return await hasAppointmentWithDoctor(user1Id, user2Id);
  }

  if (user1Role === 'doctor' && user2Role === 'patient') {
    return await hasAppointmentWithDoctor(user2Id, user1Id);
  }

  // ❌ All other combinations are NOT allowed
  return false;
};

// ============================================
// Helper: Get conversation type
// ============================================
const getConversationType = (role1, role2) => {
  if (role1 === 'admin' || role2 === 'admin') {
    return 'admin-staff';
  }
  return 'patient-doctor';
};

// ============================================
// Helper: Get other participant info
// ============================================
const getOtherParticipant = (participants, userId) => {
  return participants.find(p => p._id.toString() !== userId.toString());
};

// ============================================
// Helper: Format conversation for response
// ============================================
// Helper: Format conversation for response
const formatConversation = async (conversation, userId) => {
  try {
    // ✅ Make sure conversation is populated
    if (!conversation) {
      throw new Error('Conversation is null or undefined');
    }

    const conv = conversation.toObject ? conversation.toObject() : conversation;
    
    // ✅ Ensure participants exist
    if (!conv.participants || !Array.isArray(conv.participants)) {
      console.error('❌ No participants found in conversation:', conv);
      throw new Error('Invalid conversation structure: no participants');
    }

    // Get other participant
    const otherParticipant = conv.participants.find(
      p => p._id.toString() !== userId.toString()
    );

    if (!otherParticipant) {
      console.error('❌ Other participant not found for userId:', userId);
      console.error('Participants:', conv.participants);
      throw new Error('Other participant not found');
    }

    // Calculate unread count
    let unreadCount = 0;
    try {
      unreadCount = await Message.countDocuments({
        conversation: conv._id,
        readBy: { $ne: userId },
        sender: { $ne: userId },
      });
    } catch (err) {
      console.error('Error counting unread:', err);
      unreadCount = 0;
    }

    return {
      _id: conv._id,
      type: conv.type || 'patient-doctor',
      otherParticipant: {
        _id: otherParticipant._id,
        username: otherParticipant.username || 'Unknown',
        email: otherParticipant.email || null,
        profileImage: otherParticipant.profileImage || null,
        role: otherParticipant.role || 'user',
      },
      lastMessage: conv.lastMessage || {
        content: '',
        sender: null,
        timestamp: new Date(),
      },
      lastMessageTimestamp: conv.lastMessageTimestamp || conv.lastMessage?.timestamp || new Date(),
      unreadCount: unreadCount || 0,
      createdAt: conv.createdAt || new Date(),
      updatedAt: conv.updatedAt || new Date(),
    };
  } catch (error) {
    console.error('❌ Error formatting conversation:', error);
    throw error;
  }
};

// ============================================
// 1. Get My Conversations
// ============================================
export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all conversations where user is participant
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'username email profileImage role')
      .populate('lastMessage.sender', 'username email profileImage role')
      .sort({ lastMessageTimestamp: -1 });

    // Format each conversation
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        return await formatConversation(conv, userId);
      })
    );

    res.status(200).json({
      success: true,
      count: formattedConversations.length,
      data: formattedConversations,
    });
  } catch (error) {
    console.error('Get my conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations',
      error: error.message,
    });
  }
};

// ============================================
// 2. Get or Create Conversation
// ============================================
export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId)
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Other user ID is required',
      });
    }

    if (userId === otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself',
      });
    }

    // Get both users
    const [currentUser, otherUser] = await Promise.all([
      User.findById(userId).select('role'),
      User.findById(otherUserId).select('role'),
    ]);

    if (!currentUser || !otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Validate messaging relationship
    const allowed = await isMessagingAllowed(
      userId,
      currentUser.role,
      otherUserId,
      otherUser.role
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Messaging between these users is not allowed',
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    }).populate('participants', 'username email profileImage role');

    // Create if not exists
    if (!conversation) {
      const conversationType = getConversationType(currentUser.role, otherUser.role);

      conversation = new Conversation({
        participants: [userId, otherUserId],
        type: conversationType,
        lastMessage: {
          content: '',
          sender: null,
          timestamp: new Date(),
        },
      });

      await conversation.save();
      await conversation.populate('participants', 'username email profileImage role');
    }

    // Format response
    const formatted = await formatConversation(conversation, userId);

    res.status(200).json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: formatted,
    });
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get or create conversation',
      error: error.message,
    });
  }
};

// ============================================
// 3. Get Conversation
// ============================================
export const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID',
      });
    }

    const conversation = await Conversation.findById(id)
      .populate('participants', 'username email profileImage role')
      .populate('lastMessage.sender', 'username email profileImage role');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Verify user is participant
    if (!conversation.participants.some(p => p._id.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this conversation',
      });
    }

    const formatted = await formatConversation(conversation, userId);

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation',
      error: error.message,
    });
  }
};

// ============================================
// 4. Get Conversation Messages
// ============================================
export const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID',
      });
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view messages in this conversation',
      });
    }

    // Get messages
    const messages = await Message.find({ conversation: id })
      .populate('sender', 'username email profileImage role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({ conversation: id });

    // Reverse to get chronological order
    const reversedMessages = messages.reverse();

    res.status(200).json({
      success: true,
      data: reversedMessages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages',
      error: error.message,
    });
  }
};

// ============================================
// 5. Mark Messages as Read
// ============================================
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID',
      });
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark messages in this conversation',
      });
    }

    // Find messages where user is not in readBy and user is not the sender
    const messages = await Message.find({
      conversation: id,
      readBy: { $ne: userId },
      sender: { $ne: userId },
    });

    if (messages.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new messages to mark as read',
        data: { count: 0 },
      });
    }

    // Update messages
    const result = await Message.updateMany(
      {
        _id: { $in: messages.map(m => m._id) },
      },
      {
        $addToSet: { readBy: userId },
        $set: { readAt: new Date() },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: {
        count: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message,
    });
  }
};