import { Request, Response } from 'express';
import { authService } from '../services/authService.js';

export class AuthController {
    async login(req: Request, res: Response) {
        const { username, password } = req.body;
        const tokens = await authService.login(username, password);

        res.json({
            message: 'Login successful',
            ...tokens
        });
    }

    async refresh(req: Request, res: Response) {
        const { refreshToken } = req.body;
        const tokens = await authService.refresh(refreshToken);

        res.json({
            message: 'Token refreshed successfully',
            ...tokens
        });
    }
}

export const authController = new AuthController();
