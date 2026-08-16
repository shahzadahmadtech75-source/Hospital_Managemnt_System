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
    console.log('🔑 Decoded token:', decoded);

    // ✅ FIX: Your token uses 'userId' (not 'id')
    const userId = decoded.userId;  // ← Changed from decoded.id
    
    if (!userId) {
      console.error('❌ No userId in token:', decoded);
      return next(new Error('Invalid token: No user ID'));
    }

    const user = await User.findById(userId).select('id role');
    
    if (!user) {
      console.error('❌ User not found for ID:', userId);
      return next(new Error('User not found'));
    }

    console.log('✅ Socket authenticated for user:', userId);
    
    socket.user = {
      id: user._id,
      role: user.role,
    };
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token expired'));
    }
    return next(new Error('Authentication failed'));
  }
};