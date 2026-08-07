const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const DEFAULT_SECRET = 'dev-secret-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

if (process.env.NODE_ENV === 'production' && JWT_SECRET === DEFAULT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET is not set. Refusing to start in production.');
  process.exit(1);
}

// Long-lived token for regular users: per spec, users stay logged in
// indefinitely until they explicitly log out.
const USER_SESSION_MS = 365 * 24 * 60 * 60 * 1000;

// Admin sessions are short-lived and sliding: they expire after 12 hours
// of inactivity instead of staying valid for a year.
const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000;

// Mobile access tokens are short-lived (15 min). Refresh tokens rotate via DB.
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

function signToken(user, expiresInSeconds) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, is_approved: user.is_approved },
    JWT_SECRET,
    // jsonwebtoken accepts a plain number of seconds as expiresIn.
    { expiresIn: expiresInSeconds }
  );
}

function setAuthCookie(res, user, maxAgeMs = USER_SESSION_MS) {
  const token = signToken(user, Math.floor(maxAgeMs / 1000));
  res.cookie('auth_token', token, { ...COOKIE_OPTIONS, maxAge: maxAgeMs });
}

function setAdminAuthCookie(res, user) {
  setAuthCookie(res, user, ADMIN_SESSION_MS);
}

// Sliding renewal: re-issue an admin cookie on every authorized request so
// the inactivity window resets. Called from the admin router.
function refreshAdminSession(req, res) {
  if (!req.user || req.user.role !== 'admin') return;
  setAuthCookie(res, req.user, ADMIN_SESSION_MS);
}

function clearAuthCookie(res) {
  res.clearCookie('auth_token', COOKIE_OPTIONS);
}

// ── Mobile token helpers ──────────────────────────────────────────────────────
// Short-lived access token returned to mobile clients (sent via Authorization
// header instead of a cookie).
function signAccessToken(user) {
  return signToken(user, Math.floor(ACCESS_TOKEN_TTL_MS / 1000));
}

// Random opaque refresh token. Only its SHA-256 hash is persisted.
function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Extract the JWT from either a Bearer Authorization header or the cookie.
function extractToken(req) {
  const header = req.headers?.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return req.cookies?.auth_token || null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    next();
  };
}

module.exports = {
  signToken,
  setAuthCookie,
  setAdminAuthCookie,
  refreshAdminSession,
  clearAuthCookie,
  requireAuth,
  requireRole,
  signAccessToken,
  generateRefreshToken,
  hashToken,
  JWT_SECRET,
  USER_SESSION_MS,
  ADMIN_SESSION_MS,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  COOKIE_OPTIONS,
};
