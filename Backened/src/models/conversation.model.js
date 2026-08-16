import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  type: {
    type: String,
    enum: ['patient-doctor', 'admin-staff'],
    required: true,
  },
  lastMessage: {
    content: {
      type: String,
      default: '',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  lastMessageTimestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
conversationSchema.index({ participants: 1 }, { unique: true });
conversationSchema.index({ participants: 1, lastMessageTimestamp: -1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ lastMessageTimestamp: -1 });

// Validate exactly 2 participants
conversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'));
  }
  next;
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;