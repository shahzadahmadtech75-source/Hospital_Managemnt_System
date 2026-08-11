import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { createAdmin , 
  createStaffAccount,
  activateUser,
  deactivateUser,
  getDashboardStats,
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  getStaff,getStaffProfile
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
  


// Protected admin routes
router.post(
  '/users',
  authenticate,
  authorize('admin'),
  uploadProfileImage,
  handleUploadError,
  createStaffAccount
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

// Dashboard routes
router.get(
  '/dashboard',
  authenticate,
  authorize('admin'),
  getDashboardStats
);

// Department routes
router.post(
  '/departments',
  authenticate,
  authorize('admin'),
  uploadProfileImage,
  createDepartment
);

router.get(
  '/departments',
  authenticate,
  authorize('admin'),
  getDepartments
);

router.patch(
  '/departments/:id',
  authenticate,
  authorize('admin'),
  uploadProfileImage,
  updateDepartment
);

router.delete(
  '/departments/:id',
  authenticate,
  authorize('admin'),
  deleteDepartment
);

// Staff routes
router.get(
  '/staff',
  authenticate,
  authorize('admin'),
  getStaff
);

router.get(
  '/staff/:id',
  authenticate,
  authorize('admin'),
  getStaffProfile
);
export default router;