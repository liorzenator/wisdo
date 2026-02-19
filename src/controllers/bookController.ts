import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { bookService } from '../services/bookService.js';
import { IUser } from '../models/User.js';

export class BookController {
    async create(req: AuthRequest, res: Response) {
        const book = await bookService.createForUser(req.user as IUser, req.body);
        res.status(201).json(book);
    }

    async getAll(req: AuthRequest, res: Response) {
        const books = await bookService.listForUser(req.user as IUser);
        res.json(books);
    }

    async getById(req: AuthRequest, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid book ID' });
        }
        const book = await bookService.getByIdForUser(req.user as IUser, id);
        res.json(book);
    }

    async update(req: AuthRequest, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid book ID' });
        }
        const updatedBook = await bookService.updateForUser(req.user as IUser, id, req.body);
        res.json(updatedBook);
    }

    async delete(req: AuthRequest, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid book ID' });
        }
        await bookService.deleteForUser(req.user as IUser, id);
        res.status(204).send();
    }
}

export const bookController = new BookController();
