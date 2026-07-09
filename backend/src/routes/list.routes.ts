import { Router } from 'express';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  blockUser,
  unblockUser,
} from '../controllers/list.controller';
import { authenticate } from '../middleware/auth.middleware';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// ============================================================
// Favorites List
// ============================================================

/**
 * @route   GET /api/v1/lists/favorites
 * @desc    Retrieve all favorited profiles
 * @access  Protected
 */
router.get('/favorites', authenticate, apiRateLimiter, getFavorites);

/**
 * @route   POST /api/v1/lists/favorites
 * @desc    Add a profile to favorites
 * @access  Protected
 */
router.post('/favorites', authenticate, apiRateLimiter, addFavorite);

/**
 * @route   DELETE /api/v1/lists/favorites/:profileId
 * @desc    Remove a profile from favorites
 * @access  Protected
 */
router.delete('/favorites/:profileId', authenticate, apiRateLimiter, removeFavorite);

// ============================================================
// Block List
// ============================================================

/**
 * @route   POST /api/v1/lists/blocks
 * @desc    Block a user
 * @access  Protected
 */
router.post('/blocks', authenticate, apiRateLimiter, blockUser);

/**
 * @route   DELETE /api/v1/lists/blocks/:blockedUserId
 * @desc    Unblock a user
 * @access  Protected
 */
router.delete('/blocks/:blockedUserId', authenticate, apiRateLimiter, unblockUser);

export default router;
