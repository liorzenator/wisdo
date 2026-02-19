import { Book, IBook } from '../models/Book.js';
import { ServiceError } from "../errors/ServiceError.js";
import { Types } from 'mongoose';

export class BookService {
    // Low-level CRUD (kept for internal reuse/tests)
    async createBook(bookData: Partial<IBook>): Promise<IBook> {
        const book = new Book(bookData);
        return await book.save();
    }

    async getBooksByLibraryIds(libraryIds: Types.ObjectId[]): Promise<IBook[]> {
        return Book.find({ library: { $in: libraryIds } });
    }

    async getBookById(id: string): Promise<IBook | null> {
        return Book.findById(id);
    }

    async updateBook(id: string, updateData: Partial<IBook>): Promise<IBook | null> {
        return Book.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    async deleteBook(id: string): Promise<IBook | null> {
        return Book.findByIdAndDelete(id);
    }

    // High-level, user-aware operations moved from controller
    async createForUser(userLibraryIds: (Types.ObjectId | string)[], data: Partial<IBook>): Promise<IBook> {
        const { title, author, publishedDate, pages, authorCountry, library } = data as any;

        if (!title || !author || !library || !authorCountry) {
            throw new ServiceError(400, 'Title, author, authorCountry, and library are required');
        }
        if (pages !== undefined && pages <= 0) {
            throw new ServiceError(400, 'Pages must be greater than 0');
        }

        const libId = new Types.ObjectId(library as any);
        const userLibs = (userLibraryIds || []).map(l => l.toString());
        if (!userLibs.includes(libId.toString())) {
            throw new ServiceError(403, 'User is not a member of the library');
        }

        return this.createBook({
            title,
            author,
            publishedDate: publishedDate ? new Date(publishedDate as any) : new Date(),
            pages,
            authorCountry,
            library: libId
        } as Partial<IBook>);
    }

    async listForUser(userLibraryIds: (Types.ObjectId | string)[]): Promise<IBook[]> {
        const ids = (userLibraryIds || []).map(id => new Types.ObjectId(id as any));
        return this.getBooksByLibraryIds(ids as Types.ObjectId[]);
    }

    async getByIdForUser(userLibraryIds: (Types.ObjectId | string)[], id: string): Promise<IBook> {
        const book = await this.getBookById(id);

        if (!book) {
            throw new ServiceError(404, 'Book not found');
        }

        const userLibs = (userLibraryIds || []).map(l => l.toString());

        if (!userLibs.includes(book.library.toString())) {
            throw new ServiceError(403, 'User is not a member of the library');
        }

        return book;
    }

    async updateForUser(userLibraryIds: (Types.ObjectId | string)[], id: string, data: Partial<IBook>): Promise<IBook> {
        const existing = await this.getBookById(id);
        if (!existing) {
            throw new ServiceError(404, 'Book not found');
        }
        const userLibs = (userLibraryIds || []).map(l => l.toString());
        if (!userLibs.includes(existing.library.toString())) {
            throw new ServiceError(403, 'User is not a member of the library');
        }

        const { pages, library, publishedDate } = data as any;
        if (pages !== undefined && pages <= 0) {
            throw new ServiceError(400, 'Pages must be greater than 0');
        }
        let newLib: Types.ObjectId | undefined = undefined;
        if (library) {
            const newLibId = new Types.ObjectId(library as any);
            if (!userLibs.includes(newLibId.toString())) {
                throw new ServiceError(403, 'User is not a member of the new library');
            }
            newLib = newLibId;
        }

        const update: Partial<IBook> = { ...data } as any;
        if (publishedDate) {
            (update as any).publishedDate = new Date(publishedDate as any);
        }
        if (newLib) {
            (update as any).library = newLib;
        }

        const updated = await this.updateBook(id, update);
        // findByIdAndUpdate with new: true guarantees updated not null
        return updated!;
    }

    async deleteForUser(userLibraryIds: (Types.ObjectId | string)[], id: string): Promise<void> {
        const existing = await this.getBookById(id);
        if (!existing) {
            throw new ServiceError(404, 'Book not found');
        }
        const userLibs = (userLibraryIds || []).map(l => l.toString());
        if (!userLibs.includes(existing.library.toString())) {
            throw new ServiceError(403, 'User is not a member of the library');
        }
        await this.deleteBook(id);
    }
}

export const bookService = new BookService();
