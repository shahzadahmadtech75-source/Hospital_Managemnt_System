// src/routes/doctorProfile.routes.js

import express from 'express';
import {
  getDoctorProfile,
  updateDoctorProfile,
  updateDoctorAvailability,
  getDoctorAppointments,
  completeAppointment,
  createPrescription
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

// get all apointmetns
router.get(
  '/appointments',
  authenticate,      // ← This must be first
  authorize('doctor'), // ← This runs second
  getDoctorAppointments  // ← This runs last
);


//Complete appointment
router.patch('/appointments/:id/complete',
  authenticate, 
  authorize('doctor'), 
   completeAppointment);

// Create presciption
   router.post('/prescriptions',
    authenticate, 
  authorize('doctor'), 
     createPrescription);
export default router;