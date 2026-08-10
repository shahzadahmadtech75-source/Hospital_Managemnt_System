import express from 'express';
import { createInvoice } from '../controllers/accountant.controller.js';
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

export default router;