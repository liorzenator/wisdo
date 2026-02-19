import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { feedService } from '../services/feedService.js';
import {IUser} from "../models/User.js";

export class FeedController {
    async getFeed(req: AuthRequest, res: Response) {
        const limit = parseInt(req.query.limit as string) || 10;
        const feed = await feedService.getFeedForUser(limit, req.user as IUser);
        res.json(feed);
    }
}

export const feedController = new FeedController();
