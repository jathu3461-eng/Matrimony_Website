import request from 'supertest';
import express from 'express';
import { forgotPassword, resetPassword, validateResetToken } from './auth.controller';
import prisma from '../config/db';

// Mock Express app setup
const app = express();
app.use(express.json());
app.post('/api/v1/auth/forgot-password', forgotPassword);
app.post('/api/v1/auth/reset-password', resetPassword);
app.get('/api/v1/auth/validate-reset-token', validateResetToken);

// Mock Prisma Client
jest.mock('../config/db', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    session: {
      deleteMany: jest.fn(),
    },
  },
}));

// Mock Email Utils
jest.mock('../utils/email.utils', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendEmailOtp: jest.fn().mockResolvedValue(undefined),
}));

describe('Auth Controller — Forgot & Reset Password Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return 400 for empty or invalid email formats', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('valid email address');
    });

    it('should return 404 if email is not registered', async () => {
      (prisma.passwordResetToken.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@mukurtham.ca', accountType: 'individual' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_NOT_REGISTERED');
    });

    it('should return 403 if account is suspended', async () => {
      (prisma.passwordResetToken.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'suspendeduser',
        email: 'suspended@mukurtham.ca',
        isSuspended: true,
        isApproved: true,
        deletedAt: null,
      });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'suspended@mukurtham.ca', accountType: 'individual' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });

    it('should return 200 and send reset link if user exists and is active', async () => {
      (prisma.passwordResetToken.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'activeuser',
        email: 'active@mukurtham.ca',
        isSuspended: false,
        isApproved: true,
        deletedAt: null,
      });
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'active@mukurtham.ca', accountType: 'individual' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('successfully sent');
    });
  });

  describe('GET /api/v1/auth/validate-reset-token', () => {
    it('should return valid false for invalid or expired tokens', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/auth/validate-reset-token')
        .query({ token: 'invalid-token-123' });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(false);
      expect(res.body.error.message).toContain('invalid or has expired');
    });

    it('should return valid true for active, unused tokens', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        token: 'valid-token-123',
        used: false,
        accountType: 'individual',
      });

      const res = await request(app)
        .get('/api/v1/auth/validate-reset-token')
        .query({ token: 'valid-token-123' });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.accountType).toBe('individual');
    });
  });
});
