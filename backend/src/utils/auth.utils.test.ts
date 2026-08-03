import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateOtp,
} from '../utils/auth.utils';
import bcrypt from 'bcryptjs';



// ============================================================
// auth.utils.ts — Unit Tests
// ============================================================

describe('Password Hashing', () => {
  it('should hash a password and not equal plain text', async () => {
    const plain = 'SecureP@ssword123';
    const hashed = await hashPassword(plain);
    expect(hashed).toBeDefined();
    expect(hashed).not.toEqual(plain);
  });

  it('should correctly verify a valid password against its hash', async () => {
    const plain = 'SecureP@ssword123';
    const hashed = await hashPassword(plain);
    const isMatch = await bcrypt.compare(plain, hashed);
    expect(isMatch).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const plain = 'SecureP@ssword123';
    const hashed = await hashPassword(plain);
    const isMatch = await bcrypt.compare('WrongPassword', hashed);
    expect(isMatch).toBe(false);
  });
});

describe('JWT Token Generation & Verification', () => {
  const payload = {
    sub: 42,
    username: 'testuser',
    email: 'test@mukurtham.ca',
    roles: ['user'],
  };

  // Set env vars for test
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars';
  });

  it('should generate a non-empty access token', () => {
    const token = generateAccessToken(payload);
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);
  });

  it('should generate a non-empty refresh token', () => {
    const token = generateRefreshToken(payload);
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);
  });

  it('should verify a valid refresh token and return correct payload', () => {
    const token = generateRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.roles).toEqual(payload.roles);
  });

  it('should throw when verifying a tampered/invalid token', () => {
    expect(() => verifyRefreshToken('invalid.token.string')).toThrow();
  });
});

describe('OTP Generation', () => {
  it('should generate a 6-digit numeric OTP', async () => {
    const otp = await generateOtp('test@example.com');
    expect(otp).toBeDefined();
    expect(otp).toHaveLength(6);
    expect(Number(otp)).not.toBeNaN();
  });

  it('should generate valid 6-digit OTPs on successive calls', async () => {
    const otp1 = await generateOtp('user1@example.com');
    const otp2 = await generateOtp('user2@example.com');
    expect(otp1).toMatch(/^\d{6}$/);
    expect(otp2).toMatch(/^\d{6}$/);
  });
});
