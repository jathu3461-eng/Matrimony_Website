import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

// Extend Express Request type to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    roles: string[];
  };
}

/**
 * Middleware: Authenticate JWT Access Token
 * Validates the Bearer token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required. No token provided.', code: 'UNAUTHORIZED' },
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET!;

    const decoded = jwt.verify(token, secret) as unknown as {
      sub: number;
      username: string;
      email: string;
      roles: string[];
    };

    // Verify user still exists in DB (not deleted/suspended)
    const user = await prisma.user.findFirst({
      where: { id: decoded.sub, deletedAt: null },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: 'User account not found or has been deactivated.', code: 'UNAUTHORIZED' },
      });
      return;
    }

    req.user = {
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email,
      roles: decoded.roles,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: { message: 'Access token has expired. Please refresh your session.', code: 'TOKEN_EXPIRED' },
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: { message: 'Invalid authentication token.', code: 'INVALID_TOKEN' },
    });
  }
};

/**
 * Middleware: Authorize by Role
 * Restricts route access to users with specific roles.
 * Usage: authorize('admin', 'super_admin')
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.', code: 'UNAUTHORIZED' },
      });
      return;
    }

    const roles = req.user.roles.map((role: string) => role);
    const hasPermission = roles.some((role: string) => allowedRoles.includes(role));
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You do not have the required permissions.',
          code: 'FORBIDDEN',
          requiredRoles: allowedRoles,
        },
      });
      return;
    }

    // Strict security constraint: Only matrimony2026@gmail.com can access admin endpoints
    if (allowedRoles.includes('admin') && req.user.email !== 'matrimony2026@gmail.com') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Unauthorized administrator account.',
          code: 'FORBIDDEN'
        },
      });
      return;
    }

    next();
  };
};

/**
 * Alias for authorize() — supports array-style role list.
 * Usage: requireRole(['admin', 'moderator'])
 */
export const requireRole = (roles: string[]) => authorize(...roles);
