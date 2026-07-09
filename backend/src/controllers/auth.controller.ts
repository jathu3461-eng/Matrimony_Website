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

// ============================================================
// POST /api/v1/auth/register
// ============================================================
export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, phoneNumber, uiLanguage = 'en', role = 'user' } = req.body;

  try {
    // Check for uniqueness conflicts
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

    const hashedPassword = await hashPassword(password);

    // Map role string → AccountType enum
    const accountTypeMap: Record<string, string> = {
      user:      'individual',
      broker:    'broker',
      admin:     'admin',
      moderator: 'moderator',
    };
    const accountType = (accountTypeMap[role] || 'individual') as any;

    // Create user with selected accountType and role, approved and verified by default
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        phoneNumber,
        uiLanguage,
        accountType,
        roles: {
          create: {
            role: {
              connectOrCreate: {
                where: { name: role },
                create: { name: role, description: `${role} role`, isSystem: true },
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please log in.',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          uiLanguage: user.uiLanguage,
          roles: [role],
        },
      },
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Registration failed. Please try again.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};

// ============================================================
// POST /api/v1/auth/login
// ============================================================
export const login = async (req: Request, res: Response): Promise<void> => {
  const { usernameOrEmail, password } = req.body;

  try {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { deletedAt: null },
          { OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }] },
        ],
      },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid username/email or password.', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    const roles = user.roles.map((ur: { role: { name: string } }) => ur.role.name);

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

