
import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import {
  submitEmergencyContact,
  getEmergencyContacts,
  updateEmergencyStatus,
  deleteEmergency,
} from '../controllers/emergancy.controller.js';

const router = express.Router();

// Patient routes
router.post(
  '/emergency',
  authenticate,
  authorize('patient'),
  submitEmergencyContact
);

// Admin routes
router.get(
  '/admin/emergency',
  authenticate,
  authorize('admin'),
  getEmergencyContacts
);

router.patch(
  '/admin/emergency/:id',
  authenticate,
  authorize('admin'),
  updateEmergencyStatus
);

router.delete(
  '/admin/emergency/:id',
  authenticate,
  authorize('admin'),
  deleteEmergency
);

export default router;