import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import bookRoutes from './bookRoutes.js';
import feedRoutes from './feedRoutes.js';
import { getRedisStatus } from '../config/redis.js';
import env from '../config/environment.js';
import packageJson from '../../package.json' with { type: 'json' };

const { version } = packageJson as { version: string };
const router = Router();

router.use('/api/auth', authRoutes);
router.use('/api/books', bookRoutes);
router.use('/feed', feedRoutes);

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Wisdo API' });
});

router.get('/health', async (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';
  const redisStatus = await getRedisStatus();

  const responseData = {
    environment: env.NODE_ENV,
    version,
    status: (dbStatus === 'up' && redisStatus === 'up') ? 'ok' : 'degraded',
    database: dbStatus,
    redis: redisStatus
  };

  res.status(responseData.status === 'ok' ? 200 : 503).json(responseData);
});

export default router;
