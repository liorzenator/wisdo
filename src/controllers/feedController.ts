import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { feedService } from '../services/feedService.js';
import {IUser} from "../models/User.js";

export class FeedController {
    async getFeed(req: AuthRequest, res: Response) {
        let limit = parseInt(req.query.limit as string) || 10;
        
        if (limit < 1 || limit > 100) {
            limit = Math.min(Math.max(limit, 1), 100);
        }
        
        const feed = await feedService.getFeedForUser(limit, req.user as IUser);
        res.json(feed);
    }
}

export const feedController = new FeedController();
