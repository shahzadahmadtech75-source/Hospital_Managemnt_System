import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import {
  getMyConversations,
  getOrCreateConversation,
  getConversation,
  getConversationMessages,
  markMessagesAsRead,
} from '../controllers/message.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all conversations for the authenticated user
router.get('/conversations', getMyConversations);

// Get or create a conversation
router.post('/conversations', getOrCreateConversation);

// Get a single conversation
router.get('/conversations/:id', getConversation);

// Get messages for a conversation
router.get('/conversations/:id/messages', getConversationMessages);

// Mark messages as read in a conversation
router.patch('/conversations/:id/read', markMessagesAsRead);

export default router;