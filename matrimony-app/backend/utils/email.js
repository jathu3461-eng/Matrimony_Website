const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === 'true'
  : SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

// Treat example/placeholder credentials as "not configured" so we can fall
// back to demo mode instead of failing with an opaque auth error.
function isPlaceholder(value) {
  return !value || /your(_|\s)/i.test(value);
}

let transporter = null;

function isMailConfigured() {
  return Boolean(SMTP_USER) && Boolean(SMTP_PASS) && !isPlaceholder(SMTP_USER) && !isPlaceholder(SMTP_PASS);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE, // 465 = implicit TLS; 587 uses STARTTLS automatically
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html }) {
  if (!isMailConfigured()) {
    console.warn('[email] SMTP is not configured — set SMTP_USER / SMTP_PASS in backend/.env');
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[email] Send failed:', err.message);
    return false;
  }
}

function otpEmailTemplate(otp) {
  return '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#fff;border-radius:16px;border:1px solid #fde7f0;">' +
    '<div style="text-align:center;margin-bottom:24px;">' +
    '<span style="font-size:32px;">💖</span>' +
    '<h2 style="color:#e0136a;margin:8px 0 0;">Mukurtham Matrimony</h2>' +
    '</div>' +
    '<h3 style="color:#1e1e2d;text-align:center;margin-bottom:8px;">Your Verification Code</h3>' +
    '<p style="color:#666;text-align:center;font-size:14px;">Use the code below to verify your account. It expires in 30 minutes.</p>' +
    '<div style="text-align:center;margin:28px 0;">' +
    '<span style="display:inline-block;font-size:36px;font-weight:800;letter-spacing:12px;color:#e0136a;background:#fdf2f7;padding:16px 32px;border-radius:12px;">' + otp + '</span>' +
    '</div>' +
    '<p style="color:#999;text-align:center;font-size:12px;">If you didn\'t request this, please ignore this email.</p>' +
    '</div>';
}

function bannedEmailTemplate() {
  return '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#fff;border-radius:16px;border:1px solid #fde7f0;">' +
    '<div style="text-align:center;margin-bottom:24px;">' +
    '<span style="font-size:32px;">💖</span>' +
    '<h2 style="color:#e0136a;margin:8px 0 0;">Mukurtham Matrimony</h2>' +
    '</div>' +
    '<h3 style="color:#c0392b;text-align:center;margin-bottom:8px;">Your account has been banned</h3>' +
    '<p style="color:#666;text-align:center;font-size:14px;">Your Mukurtham Matrimony account has been suspended by our administrators for violating our community guidelines.</p>' +
    '<div style="text-align:center;margin:24px 0;">' +
    '<span style="display:inline-block;font-size:15px;font-weight:700;color:#c0392b;background:#fdf2f2;padding:14px 24px;border-radius:12px;">You will not be able to log in or create a new account.</span>' +
    '</div>' +
    '<p style="color:#999;text-align:center;font-size:12px;">If you believe this is a mistake, please contact our support team for assistance.</p>' +
    '</div>';
}

function unbannedEmailTemplate() {
  return '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#fff;border-radius:16px;border:1px solid #fde7f0;">' +
    '<div style="text-align:center;margin-bottom:24px;">' +
    '<span style="font-size:32px;">💖</span>' +
    '<h2 style="color:#e0136a;margin:8px 0 0;">Mukurtham Matrimony</h2>' +
    '</div>' +
    '<h3 style="color:#27ae60;text-align:center;margin-bottom:8px;">Your account has been reinstated</h3>' +
    '<p style="color:#666;text-align:center;font-size:14px;">Good news! Your Mukurtham Matrimony account has been reactivated by our administrators.</p>' +
    '<div style="text-align:center;margin:24px 0;">' +
    '<span style="display:inline-block;font-size:15px;font-weight:700;color:#27ae60;background:#f0faf2;padding:14px 24px;border-radius:12px;">You can now log in and continue using the platform.</span>' +
    '</div>' +
    '<p style="color:#999;text-align:center;font-size:12px;">Thank you for being part of the Mukurtham Matrimony community.</p>' +
    '</div>';
}

module.exports = { sendMail, isMailConfigured, otpEmailTemplate, bannedEmailTemplate, unbannedEmailTemplate };
