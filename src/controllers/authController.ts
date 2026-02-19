import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import env from '../config/environment.js';
import { ServiceError } from '../errors/ServiceError.js';

const generateTokens = async (userId: string, username: string, role?: string) => {
    const payload = { id: userId, username, role };
    
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { 
        expiresIn: env.JWT_ACCESS_EXPIRATION as any 
    });
    
    const refreshToken = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { 
        expiresIn: env.JWT_REFRESH_EXPIRATION as any 
    });

    return {
        accessToken: `Bearer ${accessToken}`,
        refreshToken
    };
};

export class AuthController {
    async login(req: Request, res: Response) {
        const { username, password } = req.body;

        if (!username || !password) {
            throw new ServiceError(400, 'Username and password are required');
        }

        const user = await User.findOne({ username });
        if (!user) {
            throw new ServiceError(401, 'Invalid credentials');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new ServiceError(401, 'Invalid credentials');
        }

        const tokens = await generateTokens(user._id.toString(), user.username, user.role);
        
        // Save refresh token to user
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        res.json({
            message: 'Login successful',
            ...tokens
        });
    }

    async refresh(req: Request, res: Response) {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new ServiceError(400, 'Refresh token is required');
        }

        try {
            const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
            const user = await User.findById(decoded.id);

            if (!user || !user.refreshTokens.includes(refreshToken)) {
                throw new ServiceError(401, 'Invalid refresh token');
            }

            // Remove old refresh token and generate new ones
            user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
            
            const tokens = await generateTokens(user._id.toString(), user.username, user.role);
            
            user.refreshTokens.push(tokens.refreshToken);
            await user.save();

            res.json({
                message: 'Token refreshed successfully',
                ...tokens
            });
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                throw new ServiceError(401, 'Refresh token expired');
            }
            throw new ServiceError(401, 'Invalid refresh token');
        }
    }
}

export const authController = new AuthController();
