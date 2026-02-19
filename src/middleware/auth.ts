import { Request, Response, NextFunction } from 'express';
import passport from '../config/passport.js';
import { IUser } from '../models/User.js';

export interface AuthRequest extends Request {
    user?: IUser;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: IUser, info: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
        }
        req.user = user;
        next();
    })(req, res, next);
};
