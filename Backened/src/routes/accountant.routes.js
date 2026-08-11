import express from 'express';
import { createInvoice,
    getPatients,
  getDoctors,
  getPatientAppointments,
  getPatientAdmissions,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  getAccountantProfile,
  updateProfile,
  changePassword
 } from '../controllers/accountant.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js'
import {uploadProfileImage, handleUploadError } from '../middlewares/upload.middleware.js';

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
//dleete invoice
router.delete(
  '/invoices/:id',
  authenticate,
  authorize('accountant'),
  deleteInvoice
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

// Profile routes
router.get(
  '/profile',
  authenticate,
  authorize('accountant'),
  getAccountantProfile
);

router.patch(
  '/profile',
  authenticate,
  authorize('accountant'),
  uploadProfileImage,
  handleUploadError,
  updateProfile
);

// Change password route
router.patch(
  '/change-password',
  authenticate,
  authorize('accountant'),
  changePassword
);


export default router;