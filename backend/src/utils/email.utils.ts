/**
 * email.utils.ts — Production email service
 *
 * Supports two backends, in priority order:
 *  1. Resend API  (RESEND_API_KEY)  — recommended, zero SMTP config needed
 *  2. Nodemailer  (NODEMAILER_USER + NODEMAILER_PASS)
 *
 * When neither is configured, resets links are printed to the backend console
 * so the developer can still test the full flow locally without any SMTP setup.
 * The backend will return an error JSON so the frontend never shows fake success.
 */

import nodemailer from 'nodemailer';

// ─── Resend config ────────────────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// ─── Nodemailer config ────────────────────────────────────────────────────────
const smtpHost = process.env.NODEMAILER_HOST || '';
const smtpPort = parseInt(process.env.NODEMAILER_PORT || '587', 10);
const smtpUser = process.env.NODEMAILER_USER || '';
const smtpPass = process.env.NODEMAILER_PASS || '';
const fromAddr = process.env.NODEMAILER_FROM || 'no-reply@mukurtham.ca';

// A credential is "real" if it exists and is not one of the placeholder values
const isPlaceholder = (v: string) =>
  !v || v === 'mock_user' || v.startsWith('your_') || v.startsWith('mock_');

const hasResend     = Boolean(RESEND_API_KEY && !isPlaceholder(RESEND_API_KEY));
const hasSmtp       = Boolean(smtpUser && smtpPass && !isPlaceholder(smtpUser) && !isPlaceholder(smtpPass));
const isDevFallback = !hasResend && !hasSmtp;

// Build SMTP transporter only when real credentials exist
const smtpTransporter = hasSmtp
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    })
  : null;

// ─── Internal send helper ─────────────────────────────────────────────────────
async function sendHtmlEmail(
  to: string,
  subject: string,
  html: string,
  logLabel: string,
): Promise<void> {
  // Dev-mode fallback: log to console — but throw so the controller returns an error
  if (isDevFallback) {
    console.log(
      `\n${'='.repeat(72)}\n` +
      `📧 [DEV — NO EMAIL SENT] ${logLabel}\n` +
      `   To      : ${to}\n` +
      `   Subject : ${subject}\n` +
      `\n   ⚠️  No SMTP or Resend credentials are configured.\n` +
      `   Set RESEND_API_KEY  OR  NODEMAILER_USER + NODEMAILER_PASS in .env\n` +
      `   and restart the server.\n` +
      `${'='.repeat(72)}\n`,
    );
    throw new Error(
      'Email service is not configured. Please set RESEND_API_KEY or NODEMAILER_USER/NODEMAILER_PASS in the backend .env and restart the server.',
    );
  }

  // ── Option 1: Resend API ────────────────────────────────────────────────────
  if (hasResend) {
    const payload = {
      from: `Mukurtham Matrimony <${fromAddr}>`,
      to,
      subject,
      html,
    };

    console.log(`[Email/Resend] Sending "${subject}" → ${to}`);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[Email/Resend] FAILED (HTTP ${response.status}): ${body}`);
      throw new Error(`Resend API error (${response.status}): ${body}`);
    }
    console.log(`[Email/Resend] Delivered → ${to}`);
    return;
  }

  // ── Option 2: Nodemailer / SMTP ─────────────────────────────────────────────
  if (hasSmtp && smtpTransporter) {
    console.log(`[Email/SMTP] Sending "${subject}" via ${smtpHost}:${smtpPort} → ${to}`);
    try {
      const info = await smtpTransporter.sendMail({
        from: `"Mukurtham Matrimony" <${fromAddr}>`,
        to,
        subject,
        html,
      });
      console.log(`[Email/SMTP] Delivered → ${to} | messageId: ${info.messageId}`);
    } catch (err: any) {
      console.error(`[Email/SMTP] FAILED → ${to}:`, err.message);
      throw new Error(
        `SMTP delivery failed: ${err.message}. ` +
        `Check NODEMAILER_HOST / PORT / USER / PASS in .env`,
      );
    }
  }
}

// ─── OTP email ────────────────────────────────────────────────────────────────
export const sendEmailOtp = async (toEmail: string, otp: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; background:#0d0a0e; color:#fff; margin:0; padding:0; }
        .container { max-width:480px; margin:40px auto; background:#1a1015; border-radius:16px; overflow:hidden; border:1px solid rgba(139,26,26,0.3); }
        .header { background:linear-gradient(135deg,#8b1a1a,#c9922a); padding:32px; text-align:center; }
        .header h1 { margin:0; font-size:24px; color:#fff; }
        .body { padding:32px; text-align:center; }
        .otp-box { background:rgba(201,146,42,0.15); border:2px solid rgba(201,146,42,0.4); border-radius:12px; padding:20px; margin:24px 0; }
        .otp-code { font-size:40px; font-weight:800; letter-spacing:12px; color:#c9922a; }
        .note { font-size:13px; color:rgba(255,255,255,0.5); margin-top:24px; }
        .footer { background:rgba(0,0,0,0.3); padding:20px; text-align:center; font-size:12px; color:rgba(255,255,255,0.3); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>✨ Mukurtham Matrimony</h1></div>
        <div class="body">
          <p style="font-size:16px;margin-bottom:8px;">Your Verification Code</p>
          <p style="color:rgba(255,255,255,0.6);font-size:14px;">Enter this code to verify your account. It expires in <strong>5 minutes</strong>.</p>
          <div class="otp-box"><div class="otp-code">${otp}</div></div>
          <p class="note">If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} Mukurtham Matrimony. All rights reserved.</div>
      </div>
    </body>
    </html>`;

  await sendHtmlEmail(toEmail, `${otp} is your Mukurtham verification code`, html, `OTP for ${toEmail}`);
};

// ─── Password reset email ─────────────────────────────────────────────────────
export const sendPasswordResetEmail = async (
  toEmail: string,
  name: string,
  resetUrl: string,
  isBrokerAccount: boolean = false,
): Promise<void> => {
  const roleLabel = isBrokerAccount ? 'Broker Partner' : 'Valued Member';
  const subject   = 'Reset Your Password | Mukurtham Matrimony';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <title>${subject}</title>
      <style>
        body { font-family:'Inter',Arial,sans-serif; background-color:#0d0a0e; color:#fff; margin:0; padding:0; }
        .container { max-width:520px; margin:40px auto; background:#1a1015; border-radius:20px; overflow:hidden; border:1px solid rgba(201,146,42,0.25); box-shadow:0 10px 30px rgba(0,0,0,0.6); }
        .header { background:linear-gradient(135deg,#8b1a1a,#c9922a); padding:40px 32px; text-align:center; }
        .header h1 { margin:0; font-size:26px; color:#fff; font-weight:800; letter-spacing:-0.02em; }
        .header p { margin:8px 0 0; font-size:13px; color:rgba(255,255,255,0.75); text-transform:uppercase; letter-spacing:0.1em; }
        .body { padding:40px 32px; }
        .greeting { font-size:18px; font-weight:700; color:#fff; margin:0 0 12px; }
        .text { font-size:14px; color:rgba(255,255,255,0.7); line-height:1.6; margin-bottom:28px; }
        .btn-wrap { text-align:center; margin:32px 0; }
        .btn { display:inline-block; background:linear-gradient(135deg,#8b1a1a,#c9922a); color:#fff !important; text-decoration:none; padding:14px 32px; border-radius:12px; font-size:14px; font-weight:700; box-shadow:0 4px 16px rgba(139,26,26,0.45); }
        .link-box { font-size:11px; color:rgba(255,255,255,0.35); word-break:break-all; line-height:1.5; padding:14px; background:rgba(0,0,0,0.25); border-radius:8px; margin-top:24px; }
        .footer { background:rgba(0,0,0,0.4); padding:24px 32px; text-align:center; font-size:12px; color:rgba(255,255,255,0.35); border-top:1px solid rgba(255,255,255,0.03); }
        .footer a { color:#c9922a; text-decoration:none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Mukurtham Matrimony</h1>
          <p>${roleLabel} Portal</p>
        </div>
        <div class="body">
          <h2 class="greeting">Hello ${name},</h2>
          <p class="text">We received a request to reset your Mukurtham Matrimony password. Click the button below to choose a new password. This link expires in <strong>15 minutes</strong>.</p>
          <div class="btn-wrap">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>
          <p class="text">If the button doesn't work, copy and paste this link into your browser:</p>
          <div class="link-box">${resetUrl}</div>
          <p style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:28px;">If you did not request a password reset, you can safely ignore this email — your account remains secure.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Mukurtham Matrimony. All rights reserved.<br/>
          Questions? Email <a href="mailto:support@mukurtham.ca">support@mukurtham.ca</a>
        </div>
      </div>
    </body>
    </html>`;

  await sendHtmlEmail(toEmail, subject, html, `Password reset for ${toEmail}`);
};
