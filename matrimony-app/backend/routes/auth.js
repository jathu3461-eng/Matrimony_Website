const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { setAuthCookie, clearAuthCookie, requireAuth } = require('../middleware/auth');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{4,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+[1-9]\d{7,14}$/;
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

function validateSignup(body) {
  const errors = {};
  if (!body.username || !USERNAME_RE.test(body.username)) {
    errors.username = 'Invalid Format. Expected: 4-30 characters, letters/numbers/underscore only';
  }
  if (!body.email || !EMAIL_RE.test(body.email)) {
    errors.email = 'Invalid Format. Expected format: name@example.com';
  }
  if (!body.password || !PASSWORD_RE.test(body.password)) {
    errors.password = 'Password too weak. Required: Min 8 chars, 1 uppercase, 1 special character';
  }
  if (!body.phone_number || !PHONE_RE.test(body.phone_number)) {
    errors.phone_number = 'Invalid Format. Expected format: +14165550198';
  }
  if (!['regular', 'broker'].includes(body.role)) {
    errors.role = 'Please select Regular User or Marriage Broker';
  }
  if (body.role === 'broker' && (!body.business_name || body.business_name.trim().length < 2)) {
    errors.business_name = 'Business name is required for broker accounts (min 2 characters)';
  }
  if (body.ui_language && !['en', 'ta'].includes(body.ui_language)) {
    errors.ui_language = 'Invalid language selection';
  }
  return errors;
}

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const errors = validateSignup(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  const { username, email, password, phone_number, role, business_name, ui_language } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ errors: { email: 'An account with this email or username already exists' } });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const is_approved = role === 'regular' ? 1 : 0;

  const info = db.prepare(`
    INSERT INTO users (username, email, password_hash, phone_number, role, business_name, is_approved, ui_language)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(username, email, password_hash, phone_number, role, business_name || null, is_approved, ui_language || 'en');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);

  if (role === 'regular') {
    setAuthCookie(res, user);
    return res.status(201).json({ user: sanitize(user), status: 'active' });
  }

  // Brokers are NOT logged in automatically — they must wait for approval.
  return res.status(201).json({ status: 'pending_approval', message: 'Account Created. Waiting for Email Verification & Admin Approval' });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ errors: { email: 'Email and password are required' } });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ errors: { password: 'Incorrect email or password' } });
  }
  if (user.role === 'broker' && !user.is_approved) {
    return res.status(403).json({ status: 'pending_approval', message: 'Account Created. Waiting for Email Verification & Admin Approval' });
  }
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'Admins must log in at /admin' });
  }
  setAuthCookie(res, user);
  res.json({ user: sanitize(user) });
});

// POST /api/auth/admin-login
router.post('/admin-login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, 'admin');
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ errors: { password: 'Incorrect admin credentials' } });
  }
  setAuthCookie(res, user);
  res.json({ user: sanitize(user) });
});

// POST /api/auth/logout — the ONLY way sessions end per the spec
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me — used on app load to silently restore session
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: sanitize(user) });
});

// ---------------- Forgot password (OTP flow) ----------------
// Demo-mode: OTP is returned in the API response instead of actually being
// emailed, since this sandbox has no outbound email provider configured.
// Swap `sendEmail()` for a real provider (SES/SendGrid/etc.) in production.

router.post('/forgot-password/request', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ errors: { email: 'No account found with this email' } });

  const otp = crypto.randomInt(100000, 999999).toString();
  const expires = Date.now() + 10 * 60 * 1000;
  db.prepare('UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE id = ?').run(otp, expires, user.id);

  // demo_otp is only present because there's no real email service wired up
  res.json({ message: 'OTP sent to your email', demo_otp: otp });
});

router.post('/forgot-password/verify', (req, res) => {
  const { email, otp } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || user.reset_otp !== otp || Date.now() > user.reset_otp_expires) {
    return res.status(400).json({ errors: { otp: 'Invalid or expired code. Required format: 6 digits' } });
  }
  res.json({ verified: true });
});

router.post('/forgot-password/reset', (req, res) => {
  const { email, otp, new_password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || user.reset_otp !== otp || Date.now() > user.reset_otp_expires) {
    return res.status(400).json({ errors: { otp: 'Invalid or expired code' } });
  }
  if (!PASSWORD_RE.test(new_password || '')) {
    return res.status(400).json({ errors: { new_password: 'Password too weak. Required: Min 8 chars, 1 uppercase, 1 special character' } });
  }
  const password_hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?').run(password_hash, user.id);
  res.json({ ok: true });
});

function sanitize(user) {
  const { password_hash, reset_otp, reset_otp_expires, ...rest } = user;
  return rest;
}

module.exports = router;
