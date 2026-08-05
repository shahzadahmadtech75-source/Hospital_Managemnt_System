import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Patient routes (only patients can access these)
router.get(
  '/my-appointments',
  authenticate,
  authorize('patient'),
  (req, res) => {
    // req.user is available from authentication middleware
    // req.user.role is 'patient' (verified by authorization middleware)
    res.json({
      success: true,
      message: 'Patient appointments retrieved',
      data: {
        user: req.user,
        appointments: []
      }
    });
  }
);

export default router;