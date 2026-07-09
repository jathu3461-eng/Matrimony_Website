import { Router } from 'express';
import { searchProfiles } from '../controllers/search.controller';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   GET /api/v1/search
 * @desc    Search and filter profiles with advanced options and pagination
 * @access  Public (rate-limited)
 */
router.get('/', apiRateLimiter, searchProfiles);

export default router;
