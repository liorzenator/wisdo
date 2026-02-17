import express from 'express';
import 'dotenv/config';
import env from './src/config/environment.js';
import connectDatabase from './src/config/database.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swagger.js';
import { getLogger } from './logger.js';
import { correlationIdMiddleware } from './src/middleware/correlationId.js';
import { httpLogger } from './src/middleware/httpLogger.js';
import mongoose from 'mongoose';
import packageJson from './package.json' with { type: 'json' };
const { version } = packageJson;

const logger = getLogger(import.meta.url);
const app = express();

// Connect to database
connectDatabase();

const port = env.PORT;

app.use(express.json());
app.use(correlationIdMiddleware);
app.use(httpLogger);

// Swagger documentation
if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('Swagger documentation enabled on /api-docs');
}

// Routes (documentation moved to /docs)
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Wisdo API' });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';
  res.json({
    environment: process.env.NODE_ENV,
    version,
    status: 'ok',
    database: dbStatus
  });
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
