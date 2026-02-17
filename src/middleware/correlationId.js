import { randomBytes } from 'crypto';

export const correlationIdMiddleware = (req, res, next) => {
  let correlationId = req.get('x-correlation-id');

  if (!correlationId) {
    correlationId = randomBytes(4).toString('hex'); // 8 characters
  }

  // Attach to request and response
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  next();
};
