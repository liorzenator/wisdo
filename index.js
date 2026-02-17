import express from 'express';
import 'dotenv/config';
import env from './src/config/environment.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swagger.js';
import { getLogger } from './logger.js';
import { correlationIdMiddleware } from './src/middleware/correlationId.js';
import { httpLogger } from './src/middleware/httpLogger.js';

const logger = getLogger(import.meta.url);
const app = express();
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
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
