import { Router } from 'express';
import {
  register,
  login,
  refreshAccessToken,
  logout,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { z } from 'zod';

const router = Router();

// Inline request schemas (auth-specific, kept close to routes)
const registerSchema = z.object({
  username: z.string().min(4).max(30).regex(/^[a-zA-Z0-9]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  uiLanguage: z.enum(['en', 'ta']).default('en'),
  role: z.enum(['user', 'broker']).default('user'),
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', authRateLimiter, validateBody(registerSchema), register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user, return JWT access token + set refresh cookie
 * @access  Public
 */
router.post('/login', authRateLimiter, validateBody(loginSchema), login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Exchange valid refresh token cookie for new access token
 * @access  Public (cookie-based)
 */
router.post('/refresh', refreshAccessToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Revoke refresh token and clear session
 * @access  Protected
 */
router.post('/logout', authenticate, logout);

export default router;
