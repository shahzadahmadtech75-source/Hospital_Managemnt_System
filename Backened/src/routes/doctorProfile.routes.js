// src/routes/doctorProfile.routes.js

import express from 'express';
import {
  getDoctorProfile,
  updateDoctorProfile,
  updateDoctorAvailability
} from '../controllers/doctorProfile.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// GET /api/v1/doctor/profile
router.get(
  '/profile',
  authenticate,
  authorize('doctor'),
  getDoctorProfile
);

// PATCH /api/v1/doctor/profile
router.patch(
  '/profile',
  authenticate,
  authorize('doctor'),
  updateDoctorProfile
);

// PATCH /api/v1/doctor/availability
router.patch(
  '/availability',
  authenticate,
  authorize('doctor'),
  updateDoctorAvailability
);

export default router;