import nodemailer from 'nodemailer';

const host     = process.env.NODEMAILER_HOST     || '';
const port     = parseInt(process.env.NODEMAILER_PORT || '587');
const user     = process.env.NODEMAILER_USER     || '';
const pass     = process.env.NODEMAILER_PASS     || '';
const fromAddr = process.env.NODEMAILER_FROM     || 'no-reply@mukurtham.ca';

const isMock = !user || user === 'mock_user';

// Create transporter only when real credentials exist
const transporter = isMock
  ? null
  : nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

/**
 * Sends an OTP to the given email address.
 * In development (mock credentials) — logs to console.
 * In production (real SMTP credentials) — sends a real email.
 */
export const sendEmailOtp = async (toEmail: string, otp: string): Promise<void> => {
  if (isMock) {
    console.log(`\n📧 [DEV EMAIL] OTP for ${toEmail}: ${otp}\n`);
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #0d0a0e; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #1a1015; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139,26,26,0.3); }
        .header { background: linear-gradient(135deg, #8b1a1a, #c9922a); padding: 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; color: #fff; }
        .body { padding: 32px; text-align: center; }
        .otp-box { background: rgba(201,146,42,0.15); border: 2px solid rgba(201,146,42,0.4); border-radius: 12px; padding: 20px; margin: 24px 0; }
        .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #c9922a; }
        .note { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 24px; }
        .footer { background: rgba(0,0,0,0.3); padding: 20px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.3); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Mukurtham Matrimony</h1>
        </div>
        <div class="body">
          <p style="font-size:16px; margin-bottom:8px;">Your Verification Code</p>
          <p style="color:rgba(255,255,255,0.6); font-size:14px;">Enter this code to verify your account. It expires in <strong>5 minutes</strong>.</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="note">If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Mukurtham Matrimony. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter!.sendMail({
      from: `"Mukurtham Matrimony" <${fromAddr}>`,
      to: toEmail,
      subject: `${otp} is your Mukurtham verification code`,
      html,
    });
    console.log(`[Email] OTP sent to ${toEmail}`);
  } catch (err: any) {
    console.error(`[Email] Failed to send OTP to ${toEmail}:`, err.message);
    throw new Error('Failed to send email OTP. Please try again.');
  }
};
