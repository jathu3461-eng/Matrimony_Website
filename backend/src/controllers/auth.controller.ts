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
import { sendEmailOtp, sendPasswordResetEmail } from '../utils/email.utils';
import crypto from 'crypto';

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
      res.status(403).json({ success: false, error: { message: 'This email is reserved.', code: 'FORBIDDEN' } });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();
    const cleanPhone = phoneNumber.trim();

    // 1. Check for duplicate email/username/phone BEFORE hashing (fast fail)
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { username: cleanUsername }, { phoneNumber: cleanPhone }] },
      select: { email: true, username: true, phoneNumber: true },
    });

    if (existingUser) {
      let conflictField = 'Email';
      if (existingUser.username.toLowerCase() === cleanUsername.toLowerCase()) conflictField = 'Username';
      if (existingUser.phoneNumber === cleanPhone) conflictField = 'Phone number';
      res.status(409).json({ success: false, error: { message: `${conflictField} is already registered.`, code: 'CONFLICT' } });
      return;
    }

    // 2. Hash password
    const hashedPassword = await hashPassword(password);
    const accountTypeMap: Record<string, string> = { user: 'individual', broker: 'broker', admin: 'admin', moderator: 'moderator' };
    const accountType = (accountTypeMap[role] || 'individual') as any;

    // 3. Create User
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        phoneNumber: cleanPhone,
        uiLanguage,
        accountType,
        isApproved: true,
      },
    });

    // 4. Ensure role row exists, then link to user
    try {
      let roleRow = await prisma.role.findUnique({ where: { name: role } });
      if (!roleRow) {
        roleRow = await prisma.role.create({
          data: { name: role, description: `${role} role`, isSystem: true },
        });
      }
      await prisma.userRole.create({ data: { userId: newUser.id, roleId: roleRow.id } });
    } catch (roleErr: any) {
      // P2002 on userRole means duplicate — acceptable (role already assigned)
      if (roleErr?.code !== 'P2002') {
        console.warn('[Auth] Role assignment warning:', roleErr?.message || roleErr);
      }
    }

    // 5. Tokens
    const tokenPayload = { sub: newUser.id, username: newUser.username, email: newUser.email, roles: [role] };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    await whitelistRefreshToken(newUser.id, refreshToken);

    // 6. Session record
    try {
      await prisma.session.create({
        data: {
          userId: newUser.id,
          refreshToken,
          ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '',
          userAgent: req.headers['user-agent'] || '',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (sessionErr: any) {
      console.warn('[Auth] Session creation warning:', sessionErr?.message || sessionErr);
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        accessToken,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          uiLanguage: newUser.uiLanguage,
          roles: [role],
        },
      },
    });
  } catch (error: any) {
    console.error('[Auth] Register error:', error?.message || error);

    // P2002 — duplicate constraint from user.create (race condition window)
    if (error?.code === 'P2002') {
      const target = (Array.isArray(error.meta?.target) ? error.meta.target.join(' ') : String(error.meta?.target || '')).toLowerCase();
      let msg = 'User with this detail already exists.';
      if (target.includes('email') || target.includes('users_email_key')) msg = 'Email is already registered.';
      else if (target.includes('username') || target.includes('users_username_key')) msg = 'Username is already taken.';
      else if (target.includes('phone') || target.includes('users_phone_number_key')) msg = 'Phone number is already registered.';
      res.status(409).json({ success: false, error: { message: msg, code: 'CONFLICT' } });
      return;
    }

    res.status(500).json({
      success: false,
      error: { message: error?.message || 'Registration failed. Please try again.', code: 'INTERNAL_SERVER_ERROR' },
    });
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
  const { email, accountType = 'individual' } = req.body;
  const ipAddress = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  try {
    if (!email || !email.includes('@')) {
      res.status(400).json({
        success: false,
        error: { message: 'Please enter a valid email address.', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    // Rate limiting: Maximum 5 reset requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await prisma.passwordResetToken.count({
      where: {
        createdAt: { gte: oneHourAgo },
        ipAddress,
      },
    });

    if (recentRequests >= 5) {
      res.status(429).json({
        success: false,
        error: { message: 'Too many password reset requests. Please try again in an hour.', code: 'RATE_LIMIT' },
      });
      return;
    }

    // Lookup user by email and accountType
    const user = await prisma.user.findFirst({
      where: {
        email: email.trim(),
        accountType: accountType as any,
        deletedAt: null,
      },
    });

    // If user is not found, return a clear 404 message as requested by Step 1
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'This email address is not registered in our system.', code: 'EMAIL_NOT_REGISTERED' },
      });
      return;
    }

    // Log the request activity
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'PASSWORD_RESET_REQUESTED',
        description: `Password reset requested for email ${email} (${accountType}) from IP: ${ipAddress}`,
        ipAddress,
        userAgent,
      },
    });

    // Handle deleted account case
    if (user.deletedAt) {
      res.status(404).json({
        success: false,
        error: { message: 'This account has been deleted.', code: 'DELETED_ACCOUNT' },
      });
      return;
    }

    // Handle suspended account case
    if (user.isSuspended) {
      res.status(403).json({
        success: false,
        error: { message: 'This account has been suspended. Please contact support.', code: 'ACCOUNT_SUSPENDED' },
      });
      return;
    }

    // Handle pending approval account case
    if (!user.isApproved) {
      res.status(403).json({
        success: false,
        error: { message: 'This account is pending approval. Password reset is not available until approved.', code: 'PENDING_APPROVAL' },
      });
      return;
    }

    // Generate secure single-use token (expires in 15 minutes)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        accountType,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Build reset link
    const clientUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
    const resetPath = accountType === 'broker' ? '/broker-reset-password' : '/reset-password';
    const resetUrl = `${clientUrl}${resetPath}?token=${token}`;

    // Send professional HTML email. If it fails, catch and throw error so we never return a fake success response.
    try {
      await sendPasswordResetEmail(user.email, user.username, resetUrl, accountType === 'broker');
    } catch (emailError: any) {
      console.error('[Auth] Failed to deliver password reset email:', emailError);
      
      // Delete the generated token since we failed to email it
      await prisma.passwordResetToken.deleteMany({
        where: { token }
      });

      res.status(500).json({
        success: false,
        error: { 
          message: `Email delivery failed: ${emailError.message || 'Check SMTP configuration or API keys.'}`, 
          code: 'EMAIL_DELIVERY_FAILED' 
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link has been successfully sent to your email.',
    });
  } catch (error: any) {
    console.error('[Auth] forgotPassword error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to process reset request.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/auth/reset-password
// ============================================================
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  const ipAddress = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  try {
    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: { message: 'Reset token and new password are required.', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    // Password validation rules (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({
        success: false,
        error: { message: 'Password does not meet complexity requirements.', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    // Look up valid, unused, non-expired token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!resetToken) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired reset link.', code: 'INVALID_TOKEN' },
      });
      return;
    }

    // Find the associated user
    const user = await prisma.user.findUnique({
      where: {
        id: resetToken.userId,
      },
    });

    if (!user || user.deletedAt || user.isSuspended || !user.isApproved) {
      res.status(400).json({
        success: false,
        error: { message: 'Account is inactive or has been disabled.', code: 'INACTIVE_USER' },
      });
      return;
    }

    // Hash the new password and update user
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Delete all previous reset tokens for this user for security
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Invalidate all active sessions across devices
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Log the reset completed activity
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'PASSWORD_RESET_COMPLETED',
        description: `Password changed successfully from IP: ${ipAddress}`,
        ipAddress,
        userAgent,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('[Auth] resetPassword error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reset password.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// GET /api/v1/auth/validate-reset-token?token=xxx
// ============================================================
export const validateResetToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query as { token: string };

  try {
    if (!token) {
      res.status(400).json({ success: false, valid: false, error: { message: 'Token is required.' } });
      return;
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!resetToken) {
      res.status(200).json({
        success: true,
        valid: false,
        error: { message: 'This reset link is invalid or has expired.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      valid: true,
      accountType: resetToken.accountType,
    });
  } catch (error) {
    console.error('[Auth] validateResetToken error:', error);
    res.status(500).json({ success: false, valid: false });
  }
};


