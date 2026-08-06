// src/routes/patientProfile.routes.js

import express from 'express';
import { updatePatientProfile , getPatientProfile } from '../controllers/patientProfile.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { getPatientAppointments } from '../controllers/appointment.controller.js';

const router = express.Router();

// PATCH /api/v1/patient/profile
router.patch(
  '/profile',
  authenticate,
  authorize('patient'),
  updatePatientProfile
);

// GET /api/v1/patient/profile
router.get(
  '/profile',
  authenticate,
  authorize('patient'),
  getPatientProfile
);

router.get(
  '/appointments',
  authenticate,
  authorize('patient'),
  getPatientAppointments
);
export default router;