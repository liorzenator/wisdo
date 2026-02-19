import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { bookService } from '../services/bookService.js';

export class BookController {
    async create(req: AuthRequest, res: Response) {
        const userLibraries = req.user?.libraries || [];
        const book = await bookService.createForUser(userLibraries, req.body);
        res.status(201).json(book);
    }

    async getAll(req: AuthRequest, res: Response) {
        const userLibraries = req.user?.libraries || [];
        const books = await bookService.listForUser(userLibraries);
        res.json(books);
    }

    async getById(req: AuthRequest, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid book ID' });
        }
        const userLibraries = req.user?.libraries || [];
        const book = await bookService.getByIdForUser(userLibraries, id);
        res.json(book);
    }

    async update(req: AuthRequest, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid book ID' });
        }
        const userLibraries = req.user?.libraries || [];
        const updatedBook = await bookService.updateForUser(userLibraries, id, req.body);
        res.json(updatedBook);
    }

    async delete(req: AuthRequest, res: Response) {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid book ID' });
        }
        const userLibraries = req.user?.libraries || [];
        await bookService.deleteForUser(userLibraries, id);
        res.status(204).send();
    }
}

export const bookController = new BookController();
