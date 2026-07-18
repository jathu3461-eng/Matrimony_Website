import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
  deleteNotification,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   GET /api/v1/notifications
 * @desc    Get all notifications for the logged-in user
 * @access  Protected
 */
router.get('/', authenticate, apiRateLimiter, getNotifications);

/**
 * @route   GET /api/v1/notifications/counts
 * @desc    Get unread notification & message counts (for sidebar badges)
 * @access  Protected
 */
router.get('/counts', authenticate, apiRateLimiter, getUnreadCount);

/**
 * @route   PATCH /api/v1/notifications/read
 * @desc    Mark notifications as read (all, or specific IDs)
 * @access  Protected
 * @body    { ids?: number[] }
 */
router.patch('/read', authenticate, apiRateLimiter, markNotificationsRead);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a single notification
 * @access  Protected
 */
router.delete('/:id', authenticate, apiRateLimiter, deleteNotification);

export default router;
