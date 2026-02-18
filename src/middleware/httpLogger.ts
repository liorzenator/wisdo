import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../../logger.js';

const logger = getLogger(import.meta.url, 'http');
const blacklist = [
  '/health',
  '/metrics',
  '/favicon.ico',
  '/.well-known/appspecific/com.chrome.devtools.json'
];

export const httpLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url } = req;

  if (blacklist.includes(url) || url.startsWith('/api-docs')) {
    return next();
  }

  // Capture response body by wrapping res.json and res.send
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    res.locals = res.locals || {};
    res.locals.responseBody = body;
    return originalJson(body);
  };

  const originalSend = res.send.bind(res);
  res.send = (body: any) => {
    res.locals = res.locals || {};
    res.locals.responseBody = body;
    return originalSend(body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const correlationId = req.correlationId || undefined;

    // Prepare bodies for file transport (JSON)
    const reqBody = req.body;
    let resBody = res.locals && res.locals.responseBody;
    if (Buffer.isBuffer(resBody)) {
      resBody = resBody.toString('utf8');
    }

    // Attempt to parse resBody if it's a string, so it's a JSON object in the log
    let parsedResBody = resBody;
    if (typeof resBody === 'string') {
      try {
        parsedResBody = JSON.parse(resBody);
      } catch {
        // Not JSON, keep as string
      }
    }

    logger.info(`${method} ${url} ${statusCode} - ${duration}ms`, {
      correlationId,
      http: {
        method,
        path: url,
        statusCode,
        responseTime: duration,
        request: {
          body: reqBody,
        },
        response: {
          body: parsedResBody,
        }
      }
    });
  });

  next();
};
