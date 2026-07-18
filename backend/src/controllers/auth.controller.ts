import { Request, Response } from 'express';
import prisma from '../config/db';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  whitelistRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
} from '../utils/auth.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendEmailOtp } from '../utils/email.utils';

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

      res.status(409).json({
        success: false,
        error: { message: `${conflictField} is already registered.`, code: 'CONFLICT' },
      });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashPassword(otp);

    await prisma.emailVerification.create({
      data: {
        email,
        otp: otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }
    });

    await sendEmailOtp(email, otp);
    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('[Auth] sendRegistrationOtp error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send OTP.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/auth/resend-otp
// ============================================================
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const recentRequests = await prisma.emailVerification.count({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
      }
    });

    if (recentRequests >= 3) {
      res.status(429).json({
        success: false,
        error: { message: 'Too many OTP requests. Please wait.', code: 'RATE_LIMIT' },
      });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashPassword(otp);

    await prisma.emailVerification.create({
      data: {
        email,
        otp: otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }
    });

    await sendEmailOtp(email, otp);
    res.status(200).json({ success: true, message: 'OTP resent successfully.' });
  } catch (error) {
    console.error('[Auth] resendOtp error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to resend OTP.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/auth/register
// ============================================================
export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, phoneNumber, uiLanguage = 'en', role = 'user' } = req.body;

  try {
    if (email.toLowerCase() === 'matrimony2026@gmail.com') {
      res.status(403).json({ success: false, error: { message: 'This email is reserved.', code: 'FORBIDDEN' }});
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }, { phoneNumber }] },
    });

    if (existingUser) {
      let conflictField = 'Email';
      if (existingUser.username === username) conflictField = 'Username';
      if (existingUser.phoneNumber === phoneNumber) conflictField = 'Phone number';
      res.status(409).json({ success: false, error: { message: `${conflictField} is already registered.`, code: 'CONFLICT' } });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const accountTypeMap: Record<string, string> = { user: 'individual', broker: 'broker', admin: 'admin', moderator: 'moderator' };
    const accountType = (accountTypeMap[role] || 'individual') as any;

    const user = await prisma.user.create({
      data: {
        username, email, password: hashedPassword, phoneNumber, uiLanguage,
        accountType, isApproved: true,
        roles: { create: { role: { connectOrCreate: { where: { name: role }, create: { name: role, description: `${role} role`, isSystem: true } } } } },
      },
    });

    const tokenPayload = { sub: user.id, username: user.username, email: user.email, roles: [role] };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    await whitelistRefreshToken(user.id, refreshToken);
    await prisma.session.create({
      data: {
        userId: user.id, refreshToken,
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ success: true, message: 'Registration successful.', data: { accessToken, user: { id: user.id, username: user.username, email: user.email, uiLanguage: user.uiLanguage, roles: [role] } } });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ success: false, error: { message: 'Registration failed. Please try again.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// POST /api/v1/auth/register-broker
// ============================================================
export const registerBroker = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, phoneNumber, uiLanguage = 'en', brokerData = {} } = req.body;

  try {
    if (email.toLowerCase() === 'matrimony2026@gmail.com') {
      res.status(403).json({ success: false, error: { message: 'This email is reserved.', code: 'FORBIDDEN' } });
      return;
    }

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }, { phoneNumber }] } });
    if (existingUser) {
      let conflictField = 'Email';
      if (existingUser.username === username) conflictField = 'Username';
      if (existingUser.phoneNumber === phoneNumber) conflictField = 'Phone number';
      res.status(409).json({ success: false, error: { message: `${conflictField} is already registered.`, code: 'CONFLICT' } });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username, email, password: hashedPassword, phoneNumber,
        uiLanguage, accountType: 'broker' as any, isApproved: false,
        roles: { create: { role: { connectOrCreate: { where: { name: 'broker' }, create: { name: 'broker', description: 'Broker role', isSystem: true } } } } },
      },
    });

    await prisma.brokerProfile.create({
      data: {
        userId: user.id,
        agencyName: brokerData.agencyName || '',
        whatsappNumber: brokerData.whatsappNumber || null,
        country: brokerData.country || null,
        state: brokerData.state || null,
        district: brokerData.district || null,
        officeAddress: brokerData.officeAddress || null,
        yearsOfExperience: brokerData.yearsOfExperience ? parseInt(brokerData.yearsOfExperience) : null,
        numberOfActiveClients: brokerData.numberOfActiveClients ? parseInt(brokerData.numberOfActiveClients) : null,
        registrationNumber: brokerData.registrationNumber || null,
        governmentIdUrl: brokerData.governmentIdUrl || null,
        profilePhotoUrl: brokerData.profilePhotoUrl || null,
        websiteUrl: brokerData.websiteUrl || null,
        verificationStatus: 'pending' as any,
        isEmailVerified: false,
      },
    });

    // Simulate sending email to admin for new registration
    console.log(`\n============================`);
    console.log(`[ADMIN NOTIFICATION] New Broker Registration: ${email}`);
    console.log(`[ADMIN NOTIFICATION] Agency: ${brokerData.agencyName}`);
    console.log(`============================\n`);

    res.status(201).json({ success: true, message: 'Broker registration submitted successfully. Pending admin approval.' });
  } catch (error) {
    console.error('[Auth] Register broker error:', error);
    res.status(500).json({ success: false, error: { message: 'Broker registration failed. Please try again.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// POST /api/v1/auth/verify-broker
// ============================================================
export const verifyBroker = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'No broker account found with this email.', code: 'NOT_FOUND' } });
      return;
    }

    const broker = await prisma.brokerProfile.findUnique({ where: { userId: user.id } });
    if (!broker) {
      res.status(404).json({ success: false, error: { message: 'Broker profile not found.', code: 'NOT_FOUND' } });
      return;
    }

    if (broker.isEmailVerified) {
      res.status(400).json({ success: false, error: { message: 'Email already verified.', code: 'ALREADY_VERIFIED' } });
      return;
    }

    if (!broker.otpCode || !broker.otpExpiresAt || broker.otpExpiresAt < new Date()) {
      res.status(400).json({ success: false, error: { message: 'OTP has expired. Please request a new one.', code: 'OTP_EXPIRED' } });
      return;
    }

    if (broker.otpCode !== otp.trim()) {
      res.status(400).json({ success: false, error: { message: 'Invalid OTP. Please check and try again.', code: 'INVALID_OTP' } });
      return;
    }

    // Mark email as verified, clear OTP
    await prisma.brokerProfile.update({
      where: { userId: user.id },
      data: { isEmailVerified: true, otpCode: null, otpExpiresAt: null, verificationStatus: 'pending' as any },
    });

    res.status(200).json({ success: true, message: 'Email verified successfully. Your application is pending admin approval.' });
  } catch (error) {
    console.error('[Auth] Verify broker error:', error);
    res.status(500).json({ success: false, error: { message: 'Verification failed. Please try again.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// POST /api/v1/auth/resend-broker-otp
// ============================================================
export const resendBrokerOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'No account found with this email.', code: 'NOT_FOUND' } });
      return;
    }

    const broker = await prisma.brokerProfile.findUnique({ where: { userId: user.id } });
    if (!broker) {
      res.status(404).json({ success: false, error: { message: 'Broker profile not found.', code: 'NOT_FOUND' } });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.brokerProfile.update({
      where: { userId: user.id },
      data: { otpCode: otp, otpExpiresAt },
    });

    console.log(`\n[BROKER OTP RESEND] Email: ${email}, OTP: ${otp}\n`);
    try { await sendEmailOtp(email, otp); } catch (e) { console.warn('[Broker OTP] Email send failed.'); }

    res.status(200).json({ success: true, message: 'OTP resent successfully.' });
  } catch (error) {
    console.error('[Auth] Resend broker OTP error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to resend OTP.', code: 'INTERNAL_SERVER_ERROR' } });
  }
};

// ============================================================
// POST /api/v1/auth/login
// ============================================================
export const login = async (req: Request, res: Response): Promise<void> => {
  const { usernameOrEmail, password } = req.body;

  try {
    console.log(`[LOGIN ATTEMPT] Received usernameOrEmail: "${usernameOrEmail}", length: ${usernameOrEmail?.length}`);

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { deletedAt: null },
          { OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }] },
        ],
      },
      include: { 
        roles: { include: { role: true } },
        profiles: { take: 1, select: { mainProfilePicture: true } },
        brokerProfile: { select: { profilePhotoUrl: true } }
      },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid username/email or password.', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    const roles = user.roles.map((ur: { role: { name: string } }) => ur.role.name);

    // Broker-specific security: check approval status
    if (roles.includes('broker')) {
      const brokerProfile = await prisma.brokerProfile.findUnique({ where: { userId: user.id } });
      if (brokerProfile) {
        const status = brokerProfile.verificationStatus as string;
        if (status === 'pending') {
          res.status(403).json({
            success: false,
            error: { message: 'Your application is awaiting administrator approval. You will be notified by email once approved.', code: 'PENDING_APPROVAL' },
          });
          return;
        }
        if (status === 'rejected') {
          res.status(403).json({
            success: false,
            error: { message: 'Your broker application has been rejected. Please contact support for more information.', code: 'REJECTED' },
          });
          return;
        }
        if (status === 'blocked') {
          res.status(403).json({
            success: false,
            error: { message: 'Your broker account has been suspended. Please contact support.', code: 'SUSPENDED' },
          });
          return;
        }
      }
    }

    // Suspended users
    if (user.isSuspended) {
      res.status(403).json({
        success: false,
        error: { message: 'Your account has been suspended. Please contact support.', code: 'SUSPENDED' },
      });
      return;
    }

    const tokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in Redis whitelist
    await whitelistRefreshToken(user.id, refreshToken);

    // Create session record in DB
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set refresh token in HttpOnly, Secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          uiLanguage: user.uiLanguage,
          roles,
          photoUrl: (user as any).brokerProfile?.profilePhotoUrl || ((user as any).profiles && (user as any).profiles.length > 0 ? (user as any).profiles[0].mainProfilePicture : null)
        },
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Login failed. Please try again.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/auth/refresh
// ============================================================
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: { message: 'No refresh token provided.', code: 'UNAUTHORIZED' },
    });
    return;
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const isValid = await isRefreshTokenValid(decoded.sub, refreshToken);

    if (!isValid) {
      res.status(401).json({
        success: false,
        error: { message: 'Refresh token has been revoked. Please login again.', code: 'TOKEN_REVOKED' },
      });
      return;
    }

    const newAccessToken = generateAccessToken({
      sub: decoded.sub,
      username: decoded.username,
      email: decoded.email,
      roles: decoded.roles,
    });

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired refresh token.', code: 'INVALID_TOKEN' },
    });
  }
};

// ============================================================
// POST /api/v1/auth/logout
// ============================================================
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken && req.user) {
    try {
      await revokeRefreshToken(req.user.id, refreshToken);
      await prisma.session.deleteMany({ where: { refreshToken } });
    } catch (error) {
      console.error('[Auth] Logout cleanup error:', error);
    }
  }

  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: true });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// ============================================================
// POST /api/v1/auth/forgot-password
// ============================================================
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      res.status(200).json({ success: true, message: 'If an account with that email exists, a reset code has been sent.' });
      return;
    }

    // Rate-limit: max 3 OTPs in 10 minutes
    const recentRequests = await prisma.emailVerification.count({
      where: { email, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
    });
    if (recentRequests >= 3) {
      res.status(429).json({
        success: false,
        error: { message: 'Too many reset requests. Please wait 10 minutes.', code: 'RATE_LIMIT' },
      });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await hashPassword(otp);

    await prisma.emailVerification.create({
      data: {
        email,
        otp: otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendEmailOtp(email, otp);

    res.status(200).json({ success: true, message: 'If an account with that email exists, a reset code has been sent.' });
  } catch (error) {
    console.error('[Auth] forgotPassword error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process reset request.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/auth/reset-password
// ============================================================
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, newPassword } = req.body;

  try {
    if (!email || !newPassword) {
      res.status(400).json({
        success: false,
        error: { message: 'Email and new password are required.', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 8 characters.', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'NOT_FOUND' },
      });
      return;
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({ where: { email }, data: { password: hashedPassword } });

    // Invalidate all sessions for security
    await prisma.session.deleteMany({ where: { user: { email } } });

    res.status(200).json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    console.error('[Auth] resetPassword error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reset password.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

