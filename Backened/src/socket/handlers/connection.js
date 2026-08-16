// socket/handlers/connection.js

import onlineUsers from '../utils/onlineUsers.js';
import {
  handleJoinConversation,
  handleLeaveConversation,
} from './rooms.js';
import { handleSendMessage } from './messages.js';
import { handleTyping, handleStopTyping } from './typing.js';
import { handleMarkMessageRead } from './readReceipts.js';

export const handleConnection = (socket, io) => {
  const userId = socket.user.id;
  
  // Join private user room
  socket.join(`user:${userId}`);
  
  // Track online user
  onlineUsers.addUser(userId, socket.id);
  
  // Broadcast user online
  socket.broadcast.emit('userOnline', { userId });
  
  // Register event handlers
  socket.on('joinConversation', handleJoinConversation(socket, io));
  socket.on('leaveConversation', handleLeaveConversation(socket));
  socket.on('sendMessage', handleSendMessage(socket, io));
  socket.on('typing', handleTyping(socket, io));
  socket.on('stopTyping', handleStopTyping(socket, io));
  socket.on('markMessageRead', handleMarkMessageRead(socket, io));
  
  // Handle disconnect
  socket.on('disconnect', () => {
    const isOffline = onlineUsers.removeUser(userId, socket.id);
    if (isOffline) {
      socket.broadcast.emit('userOffline', { userId });
    }
  });
};