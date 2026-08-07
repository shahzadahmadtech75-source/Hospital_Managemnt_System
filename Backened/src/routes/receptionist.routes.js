// src/routes/receptionist.routes.js

import express from 'express';
import {
  createAppointmentByReceptionist,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  searchPatients,
  searchDoctors
} from '../controllers/receptionist.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication and receptionist role
router.use(authenticate);
router.use(authorize('receptionist'));

// Create appointment
router.post('/appointments', createAppointmentByReceptionist);

// Get all appointments with filters
router.get('/appointments', getAllAppointments);

// Search patients
router.get('/patients/search', searchPatients);

// seach doctor
router.get('/doctors/search', searchDoctors);

// Get appointment by ID
router.get('/appointments/:id', getAppointmentById);

// Update appointment
router.put('/appointments/:id', updateAppointment);

// Cancel appointment
router.patch('/appointments/:id/cancel', cancelAppointment);

// Update status (approve/reject)
router.patch('/appointments/:id/status', updateAppointmentStatus);

export default router;