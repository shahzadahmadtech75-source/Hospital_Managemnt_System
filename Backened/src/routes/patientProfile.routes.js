// src/routes/patientProfile.routes.js

import express from 'express';
import { updatePatientProfile , getPatientProfile } from '../controllers/patientProfile.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { getPatientAppointments } from '../controllers/appointment.controller.js';
import { getPatientPrescriptionById, getPatientInvoices, getPatientOperations, getDoctorProfileById, getPatientPrescriptions ,getPatientDoctors ,getPatientAdmissions } from '../controllers/patientProfile.controller.js';

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

// GET /api/v1/patient/prescriptions (NEW)
router.get('/prescriptions',
  authenticate,
  authorize('patient'),
   getPatientPrescriptions);

// GET /api/v1/patient/prescriptions/:id (NEW)
router.get('/prescriptions/:id',
  authenticate,
  authorize('patient'),
   getPatientPrescriptionById);

   router.get('/doctors',
    authenticate,
  authorize('patient'),
     getPatientDoctors);


     router.get('/doctors/:doctorId',
        authenticate,
  authorize('patient'),
       getDoctorProfileById);

//CHeck Admission bed
       router.get('/admissions',
          authenticate,
  authorize('patient'),
         getPatientAdmissions);

         //VIew operation history
         router.get('/operations',
            authenticate,
  authorize('patient'),
           getPatientOperations);

    // GET /api/v1/patient/invoices
router.get('/invoices',
            authenticate,
  authorize('patient'), 
  getPatientInvoices);
export default router;