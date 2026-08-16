// socket/handlers/typing.js

import Conversation from '../../models/conversation.model.js';

export const handleTyping = (socket, io) => {
  return async (data) => {
    try {
      const { conversationId } = data;
      const userId = socket.user.id;
      
      if (!conversationId) {
        socket.emit('error', { message: 'Conversation ID required' });
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
      
      const otherParticipant = conversation.participants.find(
        p => p.toString() !== userId
      );
      
      if (otherParticipant) {
        io.to(`user:${otherParticipant}`).emit('userTyping', {
          conversationId,
          userId,
        });
      }
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to process typing event' });
    }
  };
};

export const handleStopTyping = (socket, io) => {
  return async (data) => {
    try {
      const { conversationId } = data;
      const userId = socket.user.id;
      
      if (!conversationId) {
        socket.emit('error', { message: 'Conversation ID required' });
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
      
      const otherParticipant = conversation.participants.find(
        p => p.toString() !== userId
      );
      
      if (otherParticipant) {
        io.to(`user:${otherParticipant}`).emit('userStoppedTyping', {
          conversationId,
          userId,
        });
      }
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to process stop typing event' });
    }
  };
};