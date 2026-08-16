// socket/authentication.js

import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decoded.id).select('id role');
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.user = {
      id: user._id,
      role: user.role,
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token expired'));
    }
    return next(new Error('Authentication failed'));
  }
};