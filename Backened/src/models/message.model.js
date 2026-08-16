import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['text'],
    default: 'text',
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  readAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, readBy: 1 });
messageSchema.index({ readBy: 1 });
messageSchema.index({ createdAt: -1 });

// Validate content is not empty
messageSchema.pre('save', function(next) {
  if (!this.content || this.content.trim().length === 0) {
    return next(new Error('Message content cannot be empty'));
  }
  next;
});

const Message = mongoose.model('Message', messageSchema);

export default Message;