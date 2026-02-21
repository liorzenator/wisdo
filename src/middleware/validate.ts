import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Which part of the request to validate
type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = (req as any)[source];

    const result = schema.safeParse(data);

    if (!result.success) {
      return res.status(400).json({
        error: 'ValidationError',
        details: result.error.issues.map(err => ({
          message: err.message,
          path: err.path
        }))
      });
    }

    // assign the sanitized value back
    if (source === 'query') {
      // req.query is a getter in Express 5.
      // We overwrite the property on the request instance to hold our validated data.
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } else if (source === 'params') {
      // Same for params if needed
      Object.defineProperty(req, 'params', {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } else {
      (req as any)[source] = result.data;
    }
    next();
  };
}

export default validate;
