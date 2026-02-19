import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/User.js';
import env from '../config/environment.js';
import { ServiceError } from '../errors/ServiceError.js';
import { feedService } from './feedService.js';

export class AuthService {
    private async generateTokens(userId: string, username: string, role?: string) {
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
    }

    async login(username?: string, password?: string) {
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

        const tokens = await this.generateTokens(user._id.toString(), user.username, user.role);
        
        // Save refresh token to user
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        // Asynchronously pre-calculate feed
        feedService.preCalculateFeed(user as IUser).catch(err => {
            console.error('Error pre-calculating feed on login:', err);
        });

        return tokens;
    }

    async refresh(refreshToken?: string) {
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
            
            const tokens = await this.generateTokens(user._id.toString(), user.username, user.role);
            
            user.refreshTokens.push(tokens.refreshToken);
            await user.save();

            return tokens;
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                throw new ServiceError(401, 'Refresh token expired');
            }
            if (error instanceof ServiceError) {
                throw error;
            }
            throw new ServiceError(401, 'Invalid refresh token');
        }
    }
}

export const authService = new AuthService();
