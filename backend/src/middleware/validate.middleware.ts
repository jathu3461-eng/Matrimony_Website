import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware: Validate Request Body with Zod Schema
 * Intercepts requests, validates body against schema, returns
 * structured 400 error before the request reaches the controller.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed. Please check your input.',
            code: 'VALIDATION_ERROR',
            fields: fieldErrors,
          },
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Middleware: Validate Request Query Parameters with Zod Schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid query parameters.',
            code: 'VALIDATION_ERROR',
            fields: fieldErrors,
          },
        });
        return;
      }
      next(error);
    }
  };
};
