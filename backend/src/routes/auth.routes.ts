import { Router } from 'express';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  sendRegistrationOtp,
  resendOtp,
  registerBroker,
  verifyBroker,
  resendBrokerOtp,
  forgotPassword,
  resetPassword,
  validateResetToken,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(4).max(30).regex(/^[a-zA-Z0-9]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  uiLanguage: z.enum(['en', 'ta']).default('en'),
  role: z.enum(['user', 'broker']).default('user'),
});

const brokerRegisterSchema = z.object({
  username: z.string().min(4).max(30).regex(/^[a-zA-Z0-9]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  uiLanguage: z.enum(['en', 'ta']).default('en'),
  brokerData: z.object({
    agencyName: z.string().optional(),
    whatsappNumber: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    district: z.string().optional(),
    officeAddress: z.string().optional(),
    yearsOfExperience: z.string().optional(),
    numberOfActiveClients: z.string().optional(),
    registrationNumber: z.string().optional(),
    governmentIdUrl: z.string().optional(),
    profilePhotoUrl: z.string().optional(),
    websiteUrl: z.string().optional(),
  }).optional(),
});

const verifyBrokerSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const requestOtpSchema = z.object({
  email: z.string().email(),
  username: z.string().optional(),
  phoneNumber: z.string().optional(),
});

const resendOtpSchema = z.object({
  email: z.string().email(),
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

router.post('/send-registration-otp', authRateLimiter, validateBody(requestOtpSchema), sendRegistrationOtp);
router.post('/resend-otp', authRateLimiter, validateBody(resendOtpSchema), resendOtp);
router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);

// Broker-specific routes
router.post('/register-broker', authRateLimiter, validateBody(brokerRegisterSchema), registerBroker);
router.post('/verify-broker', authRateLimiter, validateBody(verifyBrokerSchema), verifyBroker);
router.post('/resend-broker-otp', authRateLimiter, validateBody(resendOtpSchema), resendBrokerOtp);

router.post('/refresh', refreshAccessToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/validate-reset-token', validateResetToken);

export default router;
