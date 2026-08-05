import express from 'express';
import { register, login, getUsers , refreshAccessToken ,logout } from '../controllers/auth.controller.js';
import { handleUploadError, uploadProfileImage } from '../middlewares/upload.middleware.js';
const router = express.Router();

// Public routes
router.post('/register',uploadProfileImage,handleUploadError, register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

// Debug route - check cookies
router.get('/check-cookie', (req, res) => {
  console.log('📨 All cookies:', req.cookies);
  console.log('📨 Refresh token cookie:', req.cookies.refreshToken);
  res.json({
    success: true,
    message: 'Cookie check',
    data: {
      cookies: req.cookies,
      refreshTokenExists: !!req.cookies.refreshToken,
    }
  });
});

// Temporary debug route - remove in production
router.get('/users', getUsers);

export default router;