import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import { loginSchema, refreshSchema } from '../contract/auth.contract.js';

const router = Router();

router.post('/login', validate(loginSchema), (req, res, next) => {
    authController.login(req, res).catch(next);
});
router.post('/refresh', validate(refreshSchema), (req, res, next) => {
    authController.refresh(req, res).catch(next);
});

export default router;
