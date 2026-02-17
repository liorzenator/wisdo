import express from 'express';
import 'dotenv/config';
import { getLogger } from './logger.js';
import { correlationIdMiddleware } from './src/middleware/correlationId.js';
import { httpLogger } from './src/middleware/httpLogger.js';

const logger = getLogger(import.meta.url);
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(correlationIdMiddleware);
app.use(httpLogger);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Wisdo API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
