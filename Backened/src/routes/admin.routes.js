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
  getStaff,getStaffProfile,
  getPatients,
  getPatient,
  createPatient,
  activatePatient,
  deactivatePatient,
  getMonitorInvoices,
  getMonitorInvoice,
  getMonitorBedAllotments,
  getMonitorReports,
  getMonitorReport,
  createNotice,
  getNotices,
  updateNotice,
  deleteNotice,
  updateAdminProfile,
  changeAdminPassword
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

// Patient routes
router.get(
  '/patients',
  authenticate,
  authorize('admin'),
  getPatients
);

router.get(
  '/patients/:id',
  authenticate,
  authorize('admin'),
  getPatient
);

router.post(
  '/patients',
  authenticate,
  authorize('admin'),
  uploadProfileImage,
  createPatient
);

router.patch(
  '/patients/:id/activate',
  authenticate,
  authorize('admin'),
  activatePatient
);

router.patch(
  '/patients/:id/deactivate',
  authenticate,
  authorize('admin'),
  deactivatePatient
);


// Monitor routes
router.get(
  '/monitor/invoices',
  authenticate,
  authorize('admin'),
  getMonitorInvoices
);

router.get(
  '/monitor/invoices/:id',
  authenticate,
  authorize('admin'),
  getMonitorInvoice
);

router.get(
  '/monitor/bed-allotments',
  authenticate,
  authorize('admin'),
  getMonitorBedAllotments
);

router.get(
  '/monitor/reports',
  authenticate,
  authorize('admin'),
  getMonitorReports
);

router.get(
  '/monitor/reports/:id',
  authenticate,
  authorize('admin'),
  getMonitorReport
);

router.post(
  '/notices',
  authenticate,
  authorize('admin'),
  createNotice
);

router.get(
  '/notices',
  authenticate,
  authorize('admin'),
  getNotices
);

router.patch(
  '/notices/:id',
  authenticate,
  authorize('admin'),
  updateNotice
);

router.delete(
  '/notices/:id',
  authenticate,
  authorize('admin'),
  deleteNotice
);

// Profile routes
router.patch(
  '/profile',
  authenticate,
  authorize('admin'),
  updateAdminProfile
);

router.patch(
  '/change-password',
  authenticate,
  authorize('admin'),
  changeAdminPassword
);
export default router;