const jwt = require('jsonwebtoken');

const DEFAULT_SECRET = 'dev-secret-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

if (process.env.NODE_ENV === 'production' && JWT_SECRET === DEFAULT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET is not set. Refusing to start in production.');
  process.exit(1);
}
// Long-lived token: per spec, users stay logged in indefinitely until they
// explicitly log out, so the cookie/token itself is issued with a very long
// expiry rather than a short session window.
const TOKEN_EXPIRY = '365d';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, is_approved: user.is_approved },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function setAuthCookie(res, user) {
  const token = signToken(user);
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
  });
}

function clearAuthCookie(res) {
  res.clearCookie('auth_token');
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

module.exports = { signToken, setAuthCookie, clearAuthCookie, requireAuth, requireRole, JWT_SECRET };
