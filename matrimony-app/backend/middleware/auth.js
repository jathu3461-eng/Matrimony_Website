const jwt = require('jsonwebtoken');

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

function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token;
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
  JWT_SECRET,
  USER_SESSION_MS,
  ADMIN_SESSION_MS,
  COOKIE_OPTIONS,
};
