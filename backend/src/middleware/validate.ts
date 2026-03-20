import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (and trimmed/coerced) output.
 * On failure, responds with 400 and structured validation errors.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        console.error('Validation Error for', req.path, ':', JSON.stringify(err.errors, null, 2));
        console.error('Request Body:', JSON.stringify(req.body, null, 2));
        const validationError: any = new Error('Validation failed');
        validationError.statusCode = 400;
        validationError.code = 'VALIDATION_ERROR';
        validationError.details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        next(validationError);
      } else {
        next(err);
      }
    }
  };
}
