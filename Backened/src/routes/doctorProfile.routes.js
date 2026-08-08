// src/routes/doctorProfile.routes.js

import express from 'express';
import {
  getDoctorProfile,
  updateDoctorProfile,
  updateDoctorAvailability,
  getDoctorAppointments,
  completeAppointment,
  createPrescription,
  createAppointmentByDoctor,
  updateAppointmentStatusByDoctor,
  getDoctorPrescriptions,
  updatePrescription,
  deletePrescription
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

     // POST /api/v1/doctor/appointments (NEW)
router.post('/appointments',
  authenticate, 
  authorize('doctor'),
   createAppointmentByDoctor);

   // PATCH /api/v1/doctor/appointments/:id/status (NEW)
router.patch('/appointments/:id/status',
  authenticate, 
  authorize('doctor'),
   updateAppointmentStatusByDoctor);

   // GET /api/v1/doctor/prescriptions (NEW)
router.get('/prescriptions',
  authenticate , 
  authorize('doctor'),
   getDoctorPrescriptions);

   // PATCH /api/v1/doctor/prescriptions/:id (NEW)
router.patch('/prescriptions/:id',
    authenticate,
    authorize('doctor') ,
    updatePrescription);

    // DELETE /api/v1/doctor/prescriptions/:id (NEW)
router.delete('/prescriptions/:id',
  authenticate,
  authorize('doctor'),
   deletePrescription);
export default router;