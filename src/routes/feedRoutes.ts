import { Router } from 'express';
import { feedController } from '../controllers/feedController.js';
import { authMiddleware } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { feedQuerySchema } from '../contract/feed.contract.js';

const router = Router();

router.use(authMiddleware as any);

router.get('/', validate(feedQuerySchema, 'query'), feedController.getFeed as any);

export default router;
