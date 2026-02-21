import { Router } from 'express';
import { bookController } from '../controllers/bookController.js';
import { authMiddleware } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createBookSchema, updateBookSchema, idParamSchema } from '../contract/book.contract.js';

const router = Router();

router.use(authMiddleware as any);

router.post('/', validate(createBookSchema), bookController.create as any);
router.get('/', bookController.getAll as any);
router.get('/:id', validate(idParamSchema, 'params'), bookController.getById as any);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateBookSchema), bookController.update as any);
router.delete('/:id', validate(idParamSchema, 'params'), bookController.delete as any);

export default router;
