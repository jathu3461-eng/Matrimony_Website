import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Middleware to enforce that the logged-in user has an active premium membership.
 * Use this on routes that are exclusive to paying members.
 */
export const requirePremium = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    return;
  }

  // Admins and brokers inherently bypass this check
  if (req.user.roles.includes('admin') || req.user.roles.includes('broker')) {
    next();
    return;
  }

  try {
    const activeMembership = await prisma.userMembership.findFirst({
      where: {
        userId: req.user.id,
        status: 'active',
        endsAt: { gte: new Date() },
      },
    });

    if (!activeMembership) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Premium membership required to access this feature.',
          code: 'PREMIUM_REQUIRED',
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error('[Middleware] Premium check error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error during premium validation.', code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
