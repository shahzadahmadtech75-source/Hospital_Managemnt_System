// socket/handlers/rooms.js

import Conversation from '../../models/conversation.model.js';

export const handleJoinConversation = (socket, io) => {
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
      
      socket.join(`conversation:${conversationId}`);
      socket.emit('joinedConversation', { conversationId });
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  };
};

export const handleLeaveConversation = (socket) => {
  return (data) => {
    try {
      const { conversationId } = data;
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
        socket.emit('leftConversation', { conversationId });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to leave conversation' });
    }
  };
};