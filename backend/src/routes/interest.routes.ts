import { Router } from 'express';
import {
  sendInterest,
  getMyInterests,
  respondToInterest,
  withdrawInterest,
  getInterestStatus,
} from '../controllers/interest.controller';
import { authenticate } from '../middleware/auth.middleware';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   POST /api/v1/interests
 * @desc    Send an interest to another profile
 * @access  Protected
 */
router.post('/', authenticate, apiRateLimiter, sendInterest);

/**
 * @route   GET /api/v1/interests
 * @desc    Get all interests for the logged-in user's profile
 * @access  Protected
 * @query   tab: received | sent | accepted | rejected
 */
router.get('/', authenticate, apiRateLimiter, getMyInterests);

/**
 * @route   GET /api/v1/interests/status/:profileId
 * @desc    Check interest status between my profile and a target profile
 * @access  Protected
 */
router.get('/status/:profileId', authenticate, apiRateLimiter, getInterestStatus);

/**
 * @route   PATCH /api/v1/interests/:id
 * @desc    Accept or reject an interest (receiver only)
 * @access  Protected
 * @body    { status: 'accepted' | 'rejected' }
 */
router.patch('/:id', authenticate, apiRateLimiter, respondToInterest);

/**
 * @route   DELETE /api/v1/interests/:id
 * @desc    Withdraw a sent interest (sender only)
 * @access  Protected
 */
router.delete('/:id', authenticate, apiRateLimiter, withdrawInterest);

export default router;
