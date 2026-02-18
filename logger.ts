import winston from 'winston';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const restructureFormat = winston.format((info) => {
  const {
    correlationId,
    http,
    label,
    level,
    message,
    service,
    timestamp,
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
        restructureFormat(),
        winston.format.json()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: winston.format.combine(
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
        return `[${info.timestamp}] ${info.level} [${label}]: ${info.message}${cid}`;
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
