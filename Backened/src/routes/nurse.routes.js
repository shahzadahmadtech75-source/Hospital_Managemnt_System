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
    deleteAdmission,
    getReports,
    createReport,
    updateReport,
    deleteReport,
    updateNurseProfile,
    getNurseProfile,
    changePassword
 } from '../controllers/nurse.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { uploadProfileImage,uploadPdf,handleUploadError } from '../middlewares/upload.middleware.js';

const router = express.Router();


// Profile routes
router.get(
  '/profile',
  authenticate,
  authorize('nurse'),
  getNurseProfile
);

router.patch(
  '/profile',
  authenticate,
  authorize('nurse'),
  uploadProfileImage,
  updateNurseProfile
);

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

// Report routes
router.post(
  '/reports',
  authenticate,
  authorize('nurse'),
  uploadPdf,
  handleUploadError,
  createReport
);

router.get(
  '/reports',
  authenticate,
  authorize('nurse'),
  getReports
);

router.patch(
  '/reports/:id',
  authenticate,
  authorize('nurse'),
  updateReport
);

router.delete(
  '/reports/:id',
  authenticate,
  authorize('nurse'),
  deleteReport
);

// Change password route
router.patch(
  '/change-password',
  authenticate,
  authorize('nurse'),
  changePassword
);

export default router;
