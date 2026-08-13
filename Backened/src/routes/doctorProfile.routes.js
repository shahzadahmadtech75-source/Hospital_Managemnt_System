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
  deletePrescription,
  getAllPatients,
  getMyPatients,
  createAdmission,
  getAdmissions,
  updateAdmission,
  deleteAdmission,
  createReport,
  getReports,
  updateReport,
  deleteReport,
  changePassword,
  editAppointment,
  deleteAppointment
} from '../controllers/doctorProfile.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { handleUploadError , uploadPdf } from '../middlewares/upload.middleware.js';

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

   // Edit appointment route
router.patch(
  '/appointments/:id',
  authenticate,
  authorize('doctor'),
  editAppointment
);

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

//get all patients
   router.get(
  '/patients',
  authenticate,
  authorize('doctor'),
  getMyPatients
);

router.post(
  '/admissions',
  authenticate,
  authorize('doctor'),
  createAdmission
);

router.get(
  '/admissions',
  authenticate,
  authorize('doctor'),
  getAdmissions
);

router.patch(
  '/admissions/:id',
  authenticate,
  authorize('doctor'),
  updateAdmission
);

router.delete(
  '/admissions/:id',
  authenticate,
  authorize('doctor'),
  deleteAdmission
);

// Report routes
router.post(
  '/reports',
  authenticate,
  authorize('doctor'),
  uploadPdf,
  handleUploadError,
  createReport
);

router.get(
  '/reports',
  authenticate,
  authorize('doctor'),
  getReports
);

router.patch(
  '/reports/:id',
  authenticate,
  authorize('doctor'),
  uploadPdf,
  handleUploadError,
  updateReport
);

router.delete(
  '/reports/:id',
  authenticate,
  authorize('doctor'),
  deleteReport
);

// Change password route
router.patch(
  '/change-password',
  authenticate,
  authorize('doctor'),
  changePassword
);

router.delete(
  '/appointments/:id',
  authenticate,
  authorize('doctor'),
  deleteAppointment
);

router.get(
  '/patients/all',
  authenticate,
  authorize('doctor'),
  getAllPatients
);
export default router;