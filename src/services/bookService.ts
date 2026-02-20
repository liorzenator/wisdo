import { Book, IBook } from '../models/Book.js';
import { Library } from '../models/Library.js';
import { ServiceError } from "../errors/ServiceError.js";
import { Types } from 'mongoose';
import { IUser } from '../models/User.js';

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

    private checkLibraryAccess(user: IUser, libraryId: Types.ObjectId | string, errorMessage: string = 'User is not a member of the library'): void {
        if (user.role === 'admin') return;

        const userLibs = (user.libraries || []).map(l => l.toString());
        if (!userLibs.includes(libraryId.toString())) {
            throw new ServiceError(403, errorMessage);
        }
    }

    // High-level, user-aware operations moved from controller
    async createForUser(user: IUser, data: Partial<IBook>): Promise<IBook> {
        const { title, author, publishedDate, pages, authorCountry, library } = data as any;

        if (!title || !author || !library || !authorCountry) {
            throw new ServiceError(400, 'Title, author, authorCountry, and library are required');
        }
        if (pages !== undefined && pages <= 0) {
            throw new ServiceError(400, 'Pages must be greater than 0');
        }

        if (library && !Types.ObjectId.isValid(library as string)) {
            throw new ServiceError(400, 'Invalid library ID format');
        }
        const libId = new Types.ObjectId(library as any);
        const libraryExists = await Library.exists({ _id: libId });
        if (!libraryExists) {
            throw new ServiceError(404, 'Library not found');
        }

        this.checkLibraryAccess(user, libId);

        const book = await this.createBook({
            title,
            author,
            publishedDate: publishedDate ? new Date(publishedDate as any) : new Date(),
            pages,
            authorCountry,
            library: libId
        } as Partial<IBook>);

        return book;
    }

    async listForUser(user: IUser): Promise<IBook[]> {
        if (user.role === 'admin') {
            return Book.find({});
        }
        const ids = (user.libraries || []).map(id => new Types.ObjectId(id as any));
        return this.getBooksByLibraryIds(ids as Types.ObjectId[]);
    }

    async getByIdForUser(user: IUser, id: string): Promise<IBook> {
        const book = await this.getBookById(id);

        if (!book) {
            throw new ServiceError(404, 'Book not found');
        }

        this.checkLibraryAccess(user, book.library);

        return book;
    }

    async updateForUser(user: IUser, id: string, data: Partial<IBook>): Promise<IBook> {
        const existing = await this.getBookById(id);
        if (!existing) {
            throw new ServiceError(404, 'Book not found');
        }

        this.checkLibraryAccess(user, existing.library);

        const { pages, library, publishedDate } = data as any;
        if (pages !== undefined && pages <= 0) {
            throw new ServiceError(400, 'Pages must be greater than 0');
        }
        let newLib: Types.ObjectId | undefined = undefined;
        if (library) {
            if (library && !Types.ObjectId.isValid(library as string)) {
                throw new ServiceError(400, 'Invalid library ID format');
            }
            const newLibId = new Types.ObjectId(library as any);
            const libraryExists = await Library.exists({ _id: newLibId });
            if (!libraryExists) {
                throw new ServiceError(404, 'Library not found');
            }

            this.checkLibraryAccess(user, newLibId, 'User is not a member of the new library');
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

    async deleteForUser(user: IUser, id: string): Promise<void> {
        const existing = await this.getBookById(id);
        if (!existing) {
            throw new ServiceError(404, 'Book not found');
        }

        this.checkLibraryAccess(user, existing.library);
        await this.deleteBook(id);
    }
}

export const bookService = new BookService();
