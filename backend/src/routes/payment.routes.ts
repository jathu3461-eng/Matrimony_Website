import { Router } from 'express';
import {
  getPlans,
  createCheckout,
  verifyPayment,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   GET /api/v1/payments/plans
 * @desc    Retrieve all active membership plans
 * @access  Public
 */
router.get('/plans', apiRateLimiter, getPlans);

/**
 * @route   POST /api/v1/payments/checkout
 * @desc    Create a Stripe checkout session
 * @access  Protected
 */
router.post('/checkout', authenticate, apiRateLimiter, createCheckout);

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify payment and activate membership
 * @access  Protected
 */
router.post('/verify', authenticate, apiRateLimiter, verifyPayment);

export default router;
