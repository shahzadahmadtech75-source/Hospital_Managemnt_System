// src/routes/appointment.routes.js

import express from 'express';
import { createAppointment } from '../controllers/appointment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// POST /api/v1/patient/appointments
router.post(
  '/appointments',
  authenticate,
  authorize('patient'),
  createAppointment
);

export default router;