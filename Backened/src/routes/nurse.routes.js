import express from 'express';
import { getAllPatients,
    createPatient,
    updatePatient,
    deletePatient,
    createBed,
    getAllBeds,
    updateBed,
    deleteBed,
    getAllAdmissions,
    createAdmission,
    updateAdmission,
    deleteAdmission
 } from '../controllers/nurse.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { uploadProfileImage } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Patient routes
router.get(
  '/patients',
  authenticate,
  authorize('nurse'),
  getAllPatients
);

// create patient
router.post(
  '/patients',
  authenticate,
  authorize('nurse'),
  uploadProfileImage,
  createPatient
);

// update patient
router.patch(
  '/patients/:id',
  authenticate,
  authorize('nurse'),
  updatePatient
);

//delete patient
router.delete(
  '/patients/:id',
  authenticate,
  authorize('nurse'),
  deletePatient
);

// Bed routes
router.post(
  '/beds',
  authenticate,
  authorize('nurse'),
  createBed
);

router.get(
  '/beds',
  authenticate,
  authorize('nurse'),
  getAllBeds
);

router.patch(
  '/beds/:id',
  authenticate,
  authorize('nurse'),
  updateBed
);

router.delete(
  '/beds/:id',
  authenticate,
  authorize('nurse'),
  deleteBed
);

// Admission (Bed Allotment) routes
router.post(
  '/admissions',
  authenticate,
  authorize('nurse'),
  createAdmission
);

router.get(
  '/admissions',
  authenticate,
  authorize('nurse'),
  getAllAdmissions
);

router.patch(
  '/admissions/:id',
  authenticate,
  authorize('nurse'),
  updateAdmission
);

router.delete(
  '/admissions/:id',
  authenticate,
  authorize('nurse'),
  deleteAdmission
);
export default router;
