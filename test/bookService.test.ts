import { expect } from 'chai';
import sinon from 'sinon';
import mongoose from 'mongoose';
const { Types } = mongoose;
import { bookService } from '../src/services/bookService.js';
import { Library } from '../src/models/Library.js';
import { Book } from '../src/models/Book.js';
import { ServiceError } from '../src/errors/ServiceError.js';

describe('BookService Library Validation', () => {
    let mockUser: any;

    beforeEach(() => {
        mockUser = {
            _id: new Types.ObjectId(),
            role: 'admin',
            libraries: []
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('createForUser', () => {
        it('should throw 404 if library does not exist', async () => {
            const nonExistentLibId = new Types.ObjectId();
            const bookData = {
                title: 'Test Book',
                author: 'Test Author',
                authorCountry: 'USA',
                library: nonExistentLibId
            };

            sinon.stub(Library, 'exists').resolves(null);

            try {
                await bookService.createForUser(mockUser, bookData as any);
                expect.fail('Should have thrown ServiceError');
            } catch (error: any) {
                expect(error).to.be.instanceOf(ServiceError);
                expect(error.status).to.equal(404);
                expect(error.message).to.equal('Library not found');
            }
        });

        it('should throw 400 if library ID format is invalid', async () => {
            const bookData = {
                title: 'Test Book',
                author: 'Test Author',
                authorCountry: 'USA',
                library: 'invalid-id'
            };

            try {
                await bookService.createForUser(mockUser, bookData as any);
                expect.fail('Should have thrown ServiceError');
            } catch (error: any) {
                expect(error).to.be.instanceOf(ServiceError);
                expect(error.status).to.equal(400);
                expect(error.message).to.equal('Invalid library ID format');
            }
        });
    });

    describe('updateForUser', () => {
        it('should throw 404 if updating to a non-existent library', async () => {
            const bookId = new Types.ObjectId();
            const existingLibId = new Types.ObjectId();
            const newNonExistentLibId = new Types.ObjectId();
            
            const existingBook = {
                _id: bookId,
                library: existingLibId,
                title: 'Existing Book'
            };

            sinon.stub(bookService, 'getBookById').resolves(existingBook as any);
            sinon.stub(Library, 'exists').resolves(null);

            try {
                await bookService.updateForUser(mockUser, bookId.toString(), { library: newNonExistentLibId } as any);
                expect.fail('Should have thrown ServiceError');
            } catch (error: any) {
                expect(error).to.be.instanceOf(ServiceError);
                expect(error.status).to.equal(404);
                expect(error.message).to.equal('Library not found');
            }
        });

        it('should throw 400 if new library ID format is invalid', async () => {
            const bookId = new Types.ObjectId();
            const existingLibId = new Types.ObjectId();
            
            const existingBook = {
                _id: bookId,
                library: existingLibId,
                title: 'Existing Book'
            };

            sinon.stub(bookService, 'getBookById').resolves(existingBook as any);

            try {
                await bookService.updateForUser(mockUser, bookId.toString(), { library: 'invalid-id' } as any);
                expect.fail('Should have thrown ServiceError');
            } catch (error: any) {
                expect(error).to.be.instanceOf(ServiceError);
                expect(error.status).to.equal(400);
                expect(error.message).to.equal('Invalid library ID format');
            }
        });
    });
});
