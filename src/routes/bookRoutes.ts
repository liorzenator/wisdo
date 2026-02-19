import { Router } from 'express';
import { bookController } from '../controllers/bookController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware as any);

router.post('/', bookController.create as any);
router.get('/', bookController.getAll as any);
router.get('/:id', bookController.getById as any);
router.put('/:id', bookController.update as any);
router.delete('/:id', bookController.delete as any);

export default router;
