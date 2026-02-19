import { Request, Response, NextFunction } from 'express';
import passport from '../config/passport.js';
import { IUser } from '../models/User.js';
import { Library } from '../models/Library.js';

export interface AuthRequest extends Request {
    user?: IUser;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, async (err: any, user: IUser, info: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
        }
        
        if (user.role === 'admin') {
            const allLibraries = await Library.find({}, '_id');
            user.libraries = allLibraries.map(lib => lib._id);
        }

        req.user = user;
        next();
    })(req, res, next);
};
