const fs = require('fs');

const original = fs.readFileSync('src/controllers/auth.controller.ts', 'utf8');
let newContent = original.replace(
  import { AuthenticatedRequest } from '../middleware/auth.middleware';,
  import { AuthenticatedRequest } from '../middleware/auth.middleware';\nimport { sendEmailOtp } from '../utils/email.utils';
);

const newEndpoints = 
// ============================================================
// POST /api/v1/auth/send-registration-otp
// ============================================================
export const sendRegistrationOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, username, phoneNumber } = req.body;
  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }, { phoneNumber }] },
    });
    if (existingUser) {
      let conflictField = 'Email';
      if (existingUser.username === username) conflictField = 'Username';
      if (existingUser.phoneNumber === phoneNumber) conflictField = 'Phone number';
      res.status(409).json({ success: false, error: { message: \\ is already registered.\, code: 'CONFLICT' } });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashPassword(otp);

    await prisma.emailVerification.create({
      data: { email, otp: otpHash, expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
    });

    await sendEmailOtp(email, otp);
    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('[Auth] sendRegistrationOtp error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to send OTP.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// POST /api/v1/auth/resend-otp
// ============================================================
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  try {
    const recentRequests = await prisma.emailVerification.count({
      where: { email, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } }
    });
    if (recentRequests >= 3) {
      res.status(429).json({ success: false, error: { message: 'Too many OTP requests. Please wait.', code: 'RATE_LIMIT' } });
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashPassword(otp);
    await prisma.emailVerification.create({
      data: { email, otp: otpHash, expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
    });
    await sendEmailOtp(email, otp);
    res.status(200).json({ success: true, message: 'OTP resent successfully.' });
  } catch (error) {
    console.error('[Auth] resendOtp error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to resend OTP.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};
;

newContent = newContent.replace(
  '// ============================================================\\r\\n// POST /api/v1/auth/register',
  newEndpoints + '\\r\\n// ============================================================\\r\\n// POST /api/v1/auth/register'
);
newContent = newContent.replace(
  '// ============================================================\n// POST /api/v1/auth/register',
  newEndpoints + '\n// ============================================================\n// POST /api/v1/auth/register'
);

const registerRegex = /export const register = async \(req: Request, res: Response\): Promise<void> => \{([\s\S]*?)\/\/ Map role string/m;
const registerMatch = newContent.match(registerRegex);

if (registerMatch) {
  const registerStart = newContent.indexOf(registerMatch[0]);
  const existingCheckStart = newContent.indexOf('const existingUser = await prisma.user.findFirst', registerStart);

  const newRegisterStart = \export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, phoneNumber, uiLanguage = 'en', role = 'user', otp } = req.body;

  try {
    if (email.toLowerCase() === 'matrimony2026@gmail.com') {
      res.status(403).json({ success: false, error: { message: 'This email is reserved.', code: 'FORBIDDEN' }});
      return;
    }

    const latestVerification = await prisma.emailVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestVerification) {
      res.status(400).json({ success: false, error: { message: 'No OTP requested for this email.', code: 'INVALID_OTP' } });
      return;
    }

    if (latestVerification.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: { message: 'OTP has expired. Please request a new OTP.', code: 'EXPIRED_OTP' } });
      return;
    }

    if (latestVerification.verified) {
      res.status(400).json({ success: false, error: { message: 'OTP already used.', code: 'INVALID_OTP' } });
      return;
    }

    const isOtpValid = await verifyPassword(otp, latestVerification.otp);
    if (!isOtpValid) {
      res.status(400).json({ success: false, error: { message: 'Invalid OTP. Please try again.', code: 'INVALID_OTP' } });
      return;
    }

    await prisma.emailVerification.update({
      where: { id: latestVerification.id },
      data: { verified: true }
    });

    // Check for uniqueness conflicts\;
  
  newContent = newContent.substring(0, registerStart) + newRegisterStart + newContent.substring(existingCheckStart + 32); // 32 is roughly the length of '// Check for uniqueness conflicts' which was already replaced
}

// Ensure the uniqueness check logic is preserved
// Oh wait, \const existingUser = await prisma.user.findFirst\ will remain since I only replaced up to existingCheckStart.
// Let's refine the replacement to not cut things off weirdly.
