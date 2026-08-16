// socket/index.js

import { Server as SocketServer } from 'socket.io';
import { authenticateSocket } from './authentication.js';
import { handleConnection } from './handlers/connection.js';

let io = null;

export const initializeSocket = (server, options = {}) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    ...options,
  });
  
  // Authentication middleware
  io.use(authenticateSocket);
  
  // Connection handler
  io.on('connection', (socket) => {
    handleConnection(socket, io);
  });
  
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export default { initializeSocket, getIO };