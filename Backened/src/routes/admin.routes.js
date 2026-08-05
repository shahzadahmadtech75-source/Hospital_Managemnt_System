import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { createAdmin , 
  createStaffAccount,
  getAllUsers,
  getUserById,
  activateUser,
  deactivateUser
 } from '../controllers/admin.controller.js';
import { handleUploadError, uploadProfileImage } from '../middlewares/upload.middleware.js';

const router = express.Router();

//[Test Route] Add this at the top of your routes
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin route is working!',
    timestamp: new Date().toISOString(),
  });
});


// Temporary: Create admin (remove in production)
// Only enable in development  
router.post('/create-admin', createAdmin);
  
//get single user by id
router.get(
  '/users/:id',
  authenticate,
  authorize('admin'),
  getUserById
);

// Admin-only routes
router.get(
  '/all-users',
  authenticate,
  authorize('admin'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Admin users list',
      data: {
        users: []
      }
    });
  }
);

// Protected admin routes
router.post(
  '/users',
  authenticate,
  authorize('admin'),
  uploadProfileImage,
  handleUploadError,
  createStaffAccount
);

//get all users
router.get(
  '/users',
  authenticate,
  authorize('admin'),
  getAllUsers
);

//activate user
router.patch(
  '/users/:id/activate',
  authenticate,
  authorize('admin'),
  activateUser
);

//deactivate user
router.patch(
  '/users/:id/deactivate',
  authenticate,
  authorize('admin'),
  deactivateUser
);

// Example admin dashboard route (for testing)
router.get(
  '/dashboard',
  authenticate,
  authorize('admin'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Admin dashboard',
      data: {
        user: req.user,
        timestamp: new Date().toISOString(),
      },
    });
  }
);



export default router;