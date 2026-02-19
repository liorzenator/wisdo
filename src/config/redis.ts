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
      const c = createClient({ url });

      c.on('error', (err: any) => {
        // Only log errors if we're not already trying to connect
        // or if it's a new type of error to avoid log spam
        if (c.isOpen) {
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
