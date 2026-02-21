import { createClient, RedisClientType } from 'redis';
import { getLogger } from './logger.js';

const logger = getLogger(import.meta.url);

let client: ReturnType<typeof createClient> | null = null;
let connectionPromise: Promise<ReturnType<typeof createClient> | null> | null = null;

export const getRedisClient = async (): Promise<ReturnType<typeof createClient> | null> => {
  if (client) return client;
  if (connectionPromise) return connectionPromise;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  
  connectionPromise = (async () => {
    try {
      const c = createClient({ 
        url,
        socket: {
          reconnectStrategy: (retries) => {
            // Reconnect every 5 seconds, up to a point, then maybe slower
            // This prevents the "AggregateError" flood from node-redis
            return Math.min(retries * 100, 5000);
          }
        }
      });

      c.on('error', (err: any) => {
        // Only log errors if we're not already trying to connect
        // or if it's a new type of error to avoid log spam
        if (c.isOpen) {
            // Check if it's a connection error when it's supposed to be open
            if (err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED')) {
                // We might want to handle this specifically or just let it be logged once
            }
            logger.warn('Redis client error: %s', err?.message || err);
        }
      });

      await c.connect();
      client = c;
      logger.info('Connected to Redis at %s', url);
      return client;
    } catch (err) {
      logger.warn('Redis not available (%s). Falling back to no-cache for this operation.', (err as Error)?.message || err);
      connectionPromise = null; // Reset promise so we can try again later
      return null;
    }
  })();

  return connectionPromise;
};

export const getRedisStatus = async (): Promise<string | null> => {
  if (!client) return null;

  try {
    if (client && client.isOpen) {
      // Use a timeout to prevent hanging if Redis is unreachable but client thinks it's open
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Redis ping timeout')), 1000)
      );
      
      await Promise.race([client.ping(), timeoutPromise]);
      return 'up';
    }
    return 'down';
  } catch (err) {
    logger.warn('Error checking Redis status: %s', (err as Error)?.message || err);
    return 'down';
  }
};

export const quitRedis = async (): Promise<void> => {
  if (client) {
    try {
      await client.quit();
    } catch {
      // ignore
    } finally {
      client = null;
    }
  }
};
