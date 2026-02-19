import { Router } from 'express';
import { feedController } from '../controllers/feedController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware as any);

router.get('/', feedController.getFeed as any);

export default router;
