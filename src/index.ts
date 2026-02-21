import express, { Request, Response } from 'express';
import 'dotenv/config';
import env, { validateEnv } from './config/environment.js';
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
import routes from './routes/index.js';
import passport from './config/passport.js';
import { errorHandler } from './middleware/errorHandler.js';
import { feedService } from './services/feedService.js';

const { version } = packageJson as { version: string };

const logger = getLogger(import.meta.url);
const app = express();

// Validate environment variables
validateEnv();

// Connect to database
connectDatabase().then(async () => {
    if (env.SEED_ON_STARTUP) {
        await seedDatabase();
    }
    // Pre-calculate all feeds on system boot - using a small delay to not block startup
    // In a real production app, this should be a background job
    setTimeout(() => {
        feedService.preCalculateAllFeeds().then(() => {
            logger.info('Initial feed calculation completed');
        }).catch(err => {
            logger.error('Error in initial feed calculation:', err);
        });
    }, 1000);
});

const port = env.PORT;

app.use(express.json());
app.use(correlationIdMiddleware);
app.use(httpLogger);
app.use(passport.initialize());

app.use('/', routes);

// Swagger documentation
if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('Swagger documentation enabled on /api-docs');
}

app.use(errorHandler as any);

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
