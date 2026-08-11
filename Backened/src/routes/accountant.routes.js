import express from 'express';
import { createInvoice,
    getPatients,
  getDoctors,
  getPatientAppointments,
  getPatientAdmissions,
  getInvoices,
  getInvoice,
  updateInvoice
 } from '../controllers/accountant.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js'

const router = express.Router();

// Invoice routes
router.post(
  '/invoices',
  authenticate,
  authorize('accountant'),
  createInvoice
);

router.get(
  '/invoices',
  authenticate,
  authorize('accountant'),
  getInvoices
);

router.get(
  '/invoices/:id',
  authenticate,
  authorize('accountant'),
  getInvoice
);

router.patch(
  '/invoices/:id',
  authenticate,
  authorize('accountant'),
  updateInvoice
);

// Patient routes
router.get(
  '/patients',
  authenticate,
  authorize('accountant'),
  getPatients
);

router.get(
  '/patients/:id/appointments',
  authenticate,
  authorize('accountant'),
  getPatientAppointments
);

router.get(
  '/patients/:id/admissions',
  authenticate,
  authorize('accountant'),
  getPatientAdmissions
);

// Doctor routes
router.get(
  '/doctors',
  authenticate,
  authorize('accountant'),
  getDoctors
);




export default router;