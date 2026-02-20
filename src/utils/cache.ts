import { getRedisClient } from '../config/redis.js';
import { getLogger } from '../config/logger.js';
import { Types } from 'mongoose';

const logger = getLogger(import.meta.url);

const keyForUser = (userId: string | Types.ObjectId) => `feed:${userId.toString()}`;
const DEFAULT_TTL_SECONDS = parseInt(process.env.FEED_CACHE_TTL || '3600', 10); // 1 hour default

export const cache = {
  getUserFeedIds: async (userId: string | Types.ObjectId): Promise<string[] | null> => {
    const client = await getRedisClient();
    if (!client) return null;
    try {
      const key = keyForUser(userId);
      const raw = await client.get(key);
      if (!raw) return null;
      const arr = JSON.parse(raw) as string[];
      return Array.isArray(arr) ? arr : null;
    } catch (err) {
      logger.warn('Redis getUserFeedIds failed: %s', (err as Error)?.message || err);
      return null;
    }
  },

  setUserFeedIds: async (userId: string | Types.ObjectId, ids: (string | Types.ObjectId)[]): Promise<void> => {
    const client = await getRedisClient();
    if (!client) return;
    try {
      const key = keyForUser(userId);
      const strIds = ids.map((id) => id.toString());
      await client.set(key, JSON.stringify(strIds), {
        EX: DEFAULT_TTL_SECONDS,
      });
    } catch (err) {
      logger.warn('Redis setUserFeedIds failed: %s', (err as Error)?.message || err);
    }
  },

  deleteUserFeed: async (userId: string | Types.ObjectId): Promise<void> => {
    const client = await getRedisClient();
    if (!client) return;
    try {
      const key = keyForUser(userId);
      await client.del(key);
    } catch (err) {
      logger.warn('Redis deleteUserFeed failed: %s', (err as Error)?.message || err);
    }
  },
};

export const { getUserFeedIds, setUserFeedIds, deleteUserFeed } = cache;
