import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protected route - requires authentication
router.get('/profile', authenticate, (req, res) => {
  // req.user is available from the middleware
  res.json({
    success: true,
    message: 'Protected route accessed successfully',
    data: {
      user: req.user
    }
  });
});

export default router;