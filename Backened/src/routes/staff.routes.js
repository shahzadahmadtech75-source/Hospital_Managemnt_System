import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Staff routes (accessible by all staff roles, not patients)
router.get(
  '/department-info',
  authenticate,
  authorize('admin', 'doctor', 'nurse', 'receptionist', 'laboratorist'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Department information retrieved',
      data: {
        user: req.user
      }
    });
  }
);

// Doctor-specific routes
router.get(
  '/my-patients',
  authenticate,
  authorize('doctor'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Doctor patients list',
      data: {
        patients: []
      }
    });
  }
);

// Nurse-specific routes
router.get(
  '/assigned-patients',
  authenticate,
  authorize('nurse'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Nurse assigned patients',
      data: {
        patients: []
      }
    });
  }
);

export default router;