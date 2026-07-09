import { Request, Response, NextFunction } from 'express';

/**
 * Centered Global Error Handling Middleware for Express.
 * Catches all unhandled errors, logs them to console (or external APM like Sentry/Winston),
 * and formats the error JSON output so stack traces do not leak to client in production.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log full error details for tracking
  console.error('[Unhandled Exception Error]:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle typical API or database constraints
  const statusCode = err.status || err.statusCode || 500;
  const message = isProduction ? 'An unexpected error occurred. Please try again later.' : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code || 'INTERNAL_SERVER_ERROR',
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
};
