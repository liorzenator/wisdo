import logger from './logger.js';

logger.info('Hello! Winston logger is now set up.');
logger.info(`Port from env: ${process.env.PORT}`);
logger.info(`Environment: ${process.env.NODE_ENV}`);
logger.error('This is an example error message.');
logger.warn('This is an example warning message.');

console.log('Check combined.log and error.log for the log entries.');
