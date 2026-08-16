// socket/handlers/messages.js

import Conversation from '../../models/conversation.model.js';
import Message from '../../models/message.model.js';

export const handleSendMessage = (socket, io) => {
  return async (data) => {
    try {
      const { conversationId, content } = data;
      const userId = socket.user.id;
      
      if (!conversationId || !content) {
        socket.emit('error', { message: 'Conversation ID and content required' });
        return;
      }
      
      if (content.trim().length === 0) {
        socket.emit('error', { message: 'Message content cannot be empty' });
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
      
      // Create message
      const message = new Message({
        conversation: conversationId,
        sender: userId,
        content: content.trim(),
        type: 'text',
        readBy: [userId],
      });
      
      await message.save();
      
      // Update conversation last message
      conversation.lastMessage = {
        content: content.trim(),
        sender: userId,
        timestamp: new Date(),
      };
      conversation.lastMessageTimestamp = new Date();
      await conversation.save();
      
      await message.populate('sender', 'username email profileImage role');
      
      const messageData = {
        _id: message._id,
        conversation: message.conversation,
        sender: message.sender,
        content: message.content,
        type: message.type,
        readBy: message.readBy,
        readAt: message.readAt,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };
      
      io.to(`conversation:${conversationId}`).emit('newMessage', messageData);
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  };
};