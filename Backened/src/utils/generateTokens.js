import jwt from 'jsonwebtoken';

/**
 * Generate an access token for authenticated users

 */
export const generateAccessToken = (user) => {
  const payload = {
    userId: user._id || user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });
};

/**
 * Generate a refresh token for authenticated users
 
 */
export const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id || user.id,
  };

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
};