import { randomBytes } from 'crypto';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  let correlationId = req.get('x-correlation-id');

  if (!correlationId) {
    correlationId = randomBytes(4).toString('hex'); // 8 characters
  }

  // Attach to request and response
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  next();
};
