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
        user.refreshTokens.push({ token: tokens.refreshToken });
        await user.save();

        return tokens;
    }

    async refresh(refreshToken?: string) {
        if (!refreshToken) {
            throw new ServiceError(400, 'Refresh token is required');
        }

        try {
            const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
            const user = await User.findById(decoded.id);

            if (!user) {
                throw new ServiceError(401, 'Invalid refresh token');
            }

            const tokenData = user.refreshTokens.find(t => t.token === refreshToken);

            // Token reuse detection
            if (!tokenData) {
                // If the token is not found, but it was previously used (replacedBy exists), 
                // it might be a malicious reuse attempt.
                // We should check if this token was ever in the list but was replaced.
                // Since we store replacedBy, we can find it.
                // Wait, if it was already used and replaced, it SHOULD still be in the list if we don't remove it.
                // Let's refine: if we find the token and it has replacedBy, it's reuse.
                // If we don't find it at all, it's either invalid or we already purged it.
                throw new ServiceError(401, 'Invalid refresh token');
            }

            if (tokenData.replacedBy) {
                // TOKEN REUSE DETECTED!
                // Invalidate all tokens for this user for security
                user.refreshTokens = [];
                await user.save();
                throw new ServiceError(401, 'Refresh token reuse detected. All sessions invalidated.');
            }

            // Generate new ones
            const tokens = await this.generateTokens(user._id.toString(), user.username, user.role);
            
            // Mark old token as replaced and add new one
            tokenData.replacedBy = tokens.refreshToken;
            user.refreshTokens.push({ token: tokens.refreshToken });
            
            // Optional: Limit the number of refresh tokens (e.g., keep only last 10)
            if (user.refreshTokens.length > 50) {
                user.refreshTokens.shift();
            }

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
