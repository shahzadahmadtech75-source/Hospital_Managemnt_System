// src/routes/receptionist.routes.js

import express from 'express';
import {
  createPatientByReceptionist,
  createAppointmentByReceptionist,
  updatePatientByReceptionist,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  searchPatients,
  searchDoctors,
  getReceptionistProfile,
  updateReceptionistProfile,
  changeReceptionistPassword
} from '../controllers/receptionist.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { uploadProfileImage,handleUploadError } from '../middlewares/upload.middleware.js';

const router = express.Router();


// All routes require authentication and receptionist role
router.use(authenticate);
router.use(authorize('receptionist'));

// Create new patient
router.post('/patients', createPatientByReceptionist);

// update patient rpofile
router.patch('/patients/:id',uploadProfileImage,handleUploadError, updatePatientByReceptionist);

// create appointment for patuent
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


// GET /api/v1/receptionist/profile
// Profile routes
router.get(
  '/profile',
  getReceptionistProfile
);

// PATCH /api/v1/receptionist/profile - With image upload support
router.patch('/profile', uploadProfileImage,handleUploadError, updateReceptionistProfile);

// PATCH /api/v1/receptionist/change-password
router.patch('/change-password', changeReceptionistPassword);

export default router;