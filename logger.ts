import winston from 'winston';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const SENSITIVE_FIELDS = ['password', 'accessToken', 'refreshToken', 'token', 'refreshTokens'];

const redact = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(redact);
  }

  if (obj !== null && typeof obj === 'object') {
    // Check for Buffer or Mongoose ObjectId
    if (obj._bsontype === 'ObjectId' || obj.constructor?.name === 'ObjectId') {
      return obj.toString();
    }

    if (Buffer.isBuffer(obj)) {
      return `[Buffer: ${obj.length} bytes]`;
    }

    // Check if it is a Mongoose document or similar with a toObject method
    let target = obj;
    if (typeof obj.toObject === 'function') {
      target = obj.toObject();
    }

    const redacted: any = {};
    for (const key in target) {
         // Omit sensitive fields entirely
      if (!SENSITIVE_FIELDS.includes(key)) {
        redacted[key] = redact(target[key]);
      }
    }
    return redacted;
  }
  return obj;
};

const redactFormat = winston.format((info) => {
  const redacted = redact(info);
  // Copy back the symbols winston uses
  const symbols = Object.getOwnPropertySymbols(info);
  for (const sym of symbols) {
    (redacted as any)[sym] = (info as any)[sym];
  }
  return redacted;
});

const restructureFormat = winston.format((info) => {
  const {
    correlationId,
    http,
    label,
    level,
    message,
    service,
    timestamp,
    user,
    ...rest
  } = info;

  return {
    correlationId,
    http,
    label,
    level,
    message,
    service,
    timestamp,
    user,
    payload: Object.keys(rest).length > 0 ? rest : undefined,
  };
});

const baseLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    redactFormat(),
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        redactFormat(),
        restructureFormat(),
        winston.format.json()
      )
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        redactFormat(),
        restructureFormat(),
        winston.format.json()
      )
    }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${timestamp} ${level} ${filename}: ${message}`
//
if (process.env.NODE_ENV !== 'production') {
  baseLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.printf((info) => {
        const label = info.label || info.file || 'app';
        const cid = info.correlationId ? ` [${info.correlationId}]` : '';
        const user = info.user as { username?: string } | undefined;
        const userName = user?.username ? ` [User: ${user.username}]` : '';
        return `[${info.timestamp}] ${info.level} [${label}]: ${info.message}${cid}${userName}`;
      })
    ),
  }));
}

export const getLogger = (moduleUrl?: string, customLabel?: string): winston.Logger => {
  try {
    const filename = customLabel || (moduleUrl ? path.parse(fileURLToPath(moduleUrl)).name : 'app');
    return baseLogger.child({ label: filename });
  } catch {
    // Fallback if moduleUrl is not provided or invalid
    return customLabel ? baseLogger.child({ label: customLabel }) : baseLogger;
  }
};
