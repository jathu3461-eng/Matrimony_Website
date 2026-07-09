import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import redis from '../config/redis';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

// ============================================================
// Password Utilities
// ============================================================

/**
 * Hashes a plain-text password using bcrypt with 12 salt rounds.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

/**
 * Compares a plain-text password against a stored hash.
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// ============================================================
// JWT Token Utilities
// ============================================================

export interface TokenPayload {
  sub: number;
  username: string;
  email: string;
  roles: string[];
}

/**
 * Generates a short-lived JWT Access Token (15 minutes).
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

/**
 * Generates a long-lived JWT Refresh Token (7 days).
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

/**
 * Verifies a refresh token and returns decoded payload.
 * Throws on invalid or expired token.
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as unknown as TokenPayload;
};

// ============================================================
// Refresh Token Whitelist (Redis)
// ============================================================

/**
 * Stores a refresh token in Redis whitelist under the user's session key.
 * Old tokens for same user are automatically evicted via TTL.
 */
export const whitelistRefreshToken = async (
  userId: number,
  refreshToken: string
): Promise<void> => {
  const key = `refresh_token:${userId}:${crypto.createHash('sha256').update(refreshToken).digest('hex').substring(0, 16)}`;
  await redis.setex(key, REFRESH_TOKEN_EXPIRY_SECONDS, refreshToken);
};

/**
 * Validates that a refresh token exists in the Redis whitelist.
 */
export const isRefreshTokenValid = async (
  userId: number,
  refreshToken: string
): Promise<boolean> => {
  const key = `refresh_token:${userId}:${crypto.createHash('sha256').update(refreshToken).digest('hex').substring(0, 16)}`;
  const stored = await redis.get(key);
  return stored === refreshToken;
};

/**
 * Removes a refresh token from the whitelist (logout).
 */
export const revokeRefreshToken = async (
  userId: number,
  refreshToken: string
): Promise<void> => {
  const key = `refresh_token:${userId}:${crypto.createHash('sha256').update(refreshToken).digest('hex').substring(0, 16)}`;
  await redis.del(key);
};

// ============================================================
// OTP Utilities
// ============================================================

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

/**
 * Generates a 6-digit OTP, stores its bcrypt hash in Redis, and returns
 * the plain-text code to be delivered via SMS/email.
 */
export const generateOtp = async (identifier: string): Promise<string> => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 8);
  const key = `otp:${identifier}`;
  await redis.setex(key, OTP_EXPIRY_SECONDS, otpHash);
  return otp;
};

/**
 * Verifies a submitted OTP code against the stored hash in Redis.
 * Deletes the code on successful verification (single-use enforcement).
 */
export const verifyOtp = async (identifier: string, code: string): Promise<boolean> => {
  const key = `otp:${identifier}`;
  const storedHash = await redis.get(key);

  if (!storedHash) return false;

  const isValid = await bcrypt.compare(code, storedHash);
  if (isValid) {
    // Delete after first successful use — prevents replay attacks
    await redis.del(key);
  }
  return isValid;
};
