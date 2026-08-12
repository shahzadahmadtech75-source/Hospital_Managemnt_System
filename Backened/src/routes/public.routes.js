import express from 'express';
import {
  getPublicDepartments,
  getPublicDoctors,
  getPublicDoctorsByDepartment,
} from '../controllers/public.controller.js';

const router = express.Router();

// Public routes - No authentication required
router.get('/departments', getPublicDepartments);
router.get('/doctors', getPublicDoctors);
router.get('/departments/:departmentId/doctors', getPublicDoctorsByDepartment);

export default router;