import { Router } from 'express';
import { createAiBio, getMatchScore } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   POST /api/v1/ai/generate-bio
 * @desc    Generate AI bio from profile data
 * @access  Protected
 */
router.post('/generate-bio', authenticate, apiRateLimiter, createAiBio);

/**
 * @route   GET /api/v1/ai/match/:sourceId/:targetId
 * @desc    Calculate compatibility match score between two profiles
 * @access  Protected
 */
router.get('/match/:sourceId/:targetId', authenticate, apiRateLimiter, getMatchScore);

export default router;
