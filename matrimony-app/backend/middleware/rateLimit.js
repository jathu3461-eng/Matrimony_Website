// Simple in-memory sliding-window rate limiter for auth endpoints.
// NOTE: suitable for a single-instance deployment. For multi-instance
// or clustered deployments, swap the in-memory store for a shared store.

const buckets = new Map();

// Prune expired entries periodically so the map doesn't grow unbounded.
const PRUNE_INTERVAL_MS = 10 * 60 * 1000;
const pruneTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, PRUNE_INTERVAL_MS);
if (typeof pruneTimer.unref === 'function') pruneTimer.unref();

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Limits attempts keyed by compound identity (e.g. ip + email).
 * options: { windowMs, max, message }
 * Returns 429 with Retry-After once the limit is exceeded.
 */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, message = 'Too many attempts. Please try again later.' } = {}) {
  return (req, res, next) => {
    const ip = clientIp(req);
    const email = String((req.body && req.body.email) || '').toLowerCase().trim();
    const key = `${ip}|${email}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ errors: { general: message } });
    }

    next();
  };
}

module.exports = { rateLimit, clientIp };
