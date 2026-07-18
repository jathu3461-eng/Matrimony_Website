import { Router } from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  startConversation,
} from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   GET /api/v1/conversations
 * @desc    Get all conversations for the logged-in user
 * @access  Protected
 */
router.get('/', authenticate, apiRateLimiter, getConversations);

/**
 * @route   POST /api/v1/conversations/start
 * @desc    Start or retrieve a conversation with another user
 * @access  Protected
 * @body    { partnerUserId }
 */
router.post('/start', authenticate, apiRateLimiter, startConversation);

/**
 * @route   GET /api/v1/conversations/:id/messages
 * @desc    Get paginated messages for a conversation
 * @access  Protected
 */
router.get('/:id/messages', authenticate, apiRateLimiter, getMessages);

/**
 * @route   POST /api/v1/conversations/:id/messages
 * @desc    Send a message in a conversation
 * @access  Protected
 * @body    { messageText }
 */
router.post('/:id/messages', authenticate, apiRateLimiter, sendMessage);

/**
 * @route   PATCH /api/v1/conversations/:id/read
 * @desc    Mark all messages in a conversation as read
 * @access  Protected
 */
router.patch('/:id/read', authenticate, apiRateLimiter, markConversationRead);

export default router;
