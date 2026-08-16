// socket/handlers/readReceipts.js

import Conversation from '../../models/conversation.model.js';
import Message from '../../models/message.model.js';

export const handleMarkMessageRead = (socket, io) => {
  return async (data) => {
    try {
      const { messageId, conversationId } = data;
      const userId = socket.user.id;
      
      if (!messageId || !conversationId) {
        socket.emit('error', { message: 'Message ID and Conversation ID required' });
        return;
      }
      
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }
      
      if (!conversation.participants.includes(userId)) {
        socket.emit('error', { message: 'You are not a participant' });
        return;
      }
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }
      
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        message.readAt = new Date();
        await message.save();
        
        const otherParticipant = conversation.participants.find(
          p => p.toString() !== userId
        );
        
        if (otherParticipant) {
          io.to(`user:${otherParticipant}`).emit('messageRead', {
            messageId,
            conversationId,
            readBy: userId,
            readAt: message.readAt,
          });
        }
      }
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  };
};