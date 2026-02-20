import express, { Request, Response } from 'express';
import 'dotenv/config';
import env from './config/environment.js';
import connectDatabase from './config/database.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { getLogger } from './config/logger.js';
import { correlationIdMiddleware } from './middleware/correlationId.js';
import { httpLogger } from './middleware/httpLogger.js';
import mongoose from 'mongoose';
import { getRedisClient } from './config/redis.js';
import packageJson from '../package.json' with { type: 'json' };
import { seedDatabase } from './utils/seeder.js';
import bookRoutes from './routes/bookRoutes.js';
import authRoutes from './routes/authRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import passport from './config/passport.js';
import { errorHandler } from './middleware/errorHandler.js';
import { feedService } from './services/feedService.js';

const { version } = packageJson as { version: string };

const logger = getLogger(import.meta.url);
const app = express();

// Connect to database
connectDatabase().then(async () => {
    if (env.SEED_ON_STARTUP) {
        await seedDatabase();
    }
    // Pre-calculate all feeds on system boot
    feedService.preCalculateAllFeeds().then(() => {
        logger.info('Initial feed calculation completed');
    }).catch(err => {
        logger.error('Error in initial feed calculation:', err);
    });
});

const port = env.PORT;

app.use(express.json());
app.use(correlationIdMiddleware);
app.use(httpLogger);
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/feed', feedRoutes);

// Swagger documentation
if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('Swagger documentation enabled on /api-docs');
}

// Routes (documentation moved to /docs)
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Wisdo API' });
});

app.get('/health', async (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';
  
  let redisStatus = 'down';
  try {
    const redisClient = await getRedisClient();
    if (redisClient && redisClient.isOpen) {
      redisStatus = 'up';
    }
  } catch (err) {
    // redisStatus stays 'down'
  }

  res.json({
    environment: process.env.NODE_ENV,
    version,
    status: 'ok',
    database: dbStatus,
    redis: redisStatus
  });
});

app.use(errorHandler as any);

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
