import { Router } from 'express';
import {
  getModerationQueue,
  approvePhoto,
  rejectPhoto,
  suspendProfile,
  getReports,
  getDashboardStats,
  getSettings,
  updateSetting,
  getUsers,
  getBrokers,
  toggleUserStatus,
  updateBrokerStatus,
  getPayments,
  getProfiles,
  verifyProfile,
} from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// All admin routes require authentication and admin or moderator role
const adminAuth = [authenticate, requireRole(['admin', 'moderator'])];

// ============================================================
// Dashboard
// ============================================================
router.get('/dashboard/stats', ...adminAuth, apiRateLimiter, getDashboardStats);

// ============================================================
// Moderation Queue
// ============================================================
router.get('/moderation/queue', ...adminAuth, apiRateLimiter, getModerationQueue);
router.post('/moderation/approve/:photoId', ...adminAuth, approvePhoto);
router.post('/moderation/reject/:photoId', ...adminAuth, rejectPhoto);
router.post('/moderation/suspend/:profileId', ...adminAuth, suspendProfile);

// ============================================================
// Reports
// ============================================================
router.get('/reports', ...adminAuth, apiRateLimiter, getReports);

// ============================================================
// User Management
// ============================================================
router.get('/users', ...adminAuth, apiRateLimiter, getUsers);
router.put('/users/:id/status', ...adminAuth, toggleUserStatus);

// ============================================================
// Broker Management
// ============================================================
router.get('/brokers', ...adminAuth, apiRateLimiter, getBrokers);
router.put('/brokers/:id/status', ...adminAuth, updateBrokerStatus);

// ============================================================
// Platform Settings / CMS
// ============================================================
router.get('/settings', ...adminAuth, getSettings);
router.put('/settings/:key', ...adminAuth, updateSetting);

// ============================================================
// Payments
// ============================================================
router.get('/payments', ...adminAuth, apiRateLimiter, getPayments);

// ============================================================
// Profiles Management
// ============================================================
router.get('/profiles', ...adminAuth, apiRateLimiter, getProfiles);
router.put('/profiles/:id/verify', ...adminAuth, apiRateLimiter, verifyProfile);

export default router;
