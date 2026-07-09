import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';

/**
 * Creates a rate limiter middleware using Redis as the backing store.
 * Tracks requests per IP per window and rejects excess requests with 429.
 *
 * @param windowSeconds - Time window in seconds
 * @param maxRequests - Maximum allowed requests per window per IP
 * @param message - Human-readable error message
 */
export const rateLimiter = (
  windowSeconds: number,
  maxRequests: number,
  message = 'Too many requests. Please try again later.'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Use X-Forwarded-For if behind a proxy (Cloudflare, Vercel)
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || 'unknown';
    const routeKey = req.path.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const redisKey = `rate_limit:${routeKey}:${ip}`;

    try {
      const current = await redis.incr(redisKey);

      // Set expiry only on first request in window
      if (current === 1) {
        await redis.expire(redisKey, windowSeconds);
      }

      // Set rate limit headers for visibility
      const ttl = await redis.ttl(redisKey);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
      res.setHeader('X-RateLimit-Reset', ttl);

      if (current > maxRequests) {
        res.status(429).json({
          success: false,
          error: {
            message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfterSeconds: ttl,
          },
        });
        return;
      }

      next();
    } catch (error) {
      // If Redis fails, allow the request through to prevent outages
      console.error('[RateLimiter] Redis error, bypassing rate limit:', error);
      next();
    }
  };
};

// Pre-configured rate limiters for common endpoints
export const authRateLimiter = rateLimiter(60, 5, 'Too many login attempts. Wait 60 seconds before retrying.');
export const otpRateLimiter = rateLimiter(300, 3, 'Too many OTP requests. Wait 5 minutes before requesting again.');
export const searchRateLimiter = rateLimiter(60, 60, 'Search limit reached. Slow down your requests.');
export const apiRateLimiter = rateLimiter(60, 120, 'API rate limit exceeded.');
