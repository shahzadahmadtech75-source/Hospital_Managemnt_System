import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Receptionist routes
router.post(
  '/appointments',
  authenticate,
  authorize('receptionist'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Appointment created by receptionist'
    });
  }
);

router.get(
  '/appointments',
  authenticate,
  authorize('receptionist'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Appointments retrieved by receptionist',
      data: {
        appointments: []
      }
    });
  }
);

export default router;