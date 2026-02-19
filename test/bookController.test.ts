import { expect } from 'chai';
import sinon from 'sinon';
import type { Request, Response } from 'express';
import type { AuthRequest } from '../src/middleware/auth.js';
import { bookController } from '../src/controllers/bookController.js';
import { bookService } from '../src/services/bookService.js';
import { ServiceError } from '../src/errors/ServiceError.js';
import mongoosePkg from 'mongoose';
const { Types } = mongoosePkg;

describe('BookController', () => {
    let req: Partial<AuthRequest>;
    let res: Partial<Response>;
    let jsonSpy: sinon.SinonSpy;
    let statusStub: sinon.SinonStub;
    let sendSpy: sinon.SinonSpy;

    beforeEach(() => {
        jsonSpy = sinon.spy();
        sendSpy = sinon.spy();
        statusStub = sinon.stub().returns({ json: jsonSpy, send: sendSpy });
        res = {
            json: jsonSpy,
            status: statusStub,
            send: sendSpy
        };
        req = {
            user: {
                _id: new Types.ObjectId(),
                username: 'testuser',
                country: 'USA',
                libraries: [new Types.ObjectId()],
            } as any
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('create', () => {
        it('should create a book and return 201', async () => {
            const bookData = { title: 'Test Book', author: 'Author', authorCountry: 'USA', library: req.user!.libraries[0] };
            req.body = bookData;
            const createdBook = { ...bookData, _id: new Types.ObjectId() };
            
            const createStub = sinon.stub(bookService, 'createForUser').resolves(createdBook as any);

            await bookController.create(req as any, res as any);

            expect(createStub.calledWith(req.user!.libraries, bookData)).to.be.true;
            expect(statusStub.calledWith(201)).to.be.true;
            expect(jsonSpy.calledWith(createdBook)).to.be.true;
        });

        it('should throw ServiceError if library is missing (negative scenario handled by service)', async () => {
            const bookData = { title: 'Test Book', author: 'Author', authorCountry: 'USA' };
            req.body = bookData;
            
            sinon.stub(bookService, 'createForUser').throws(new ServiceError(400, 'Title, author, authorCountry, and library are required'));

            try {
                await bookController.create(req as any, res as any);
                expect.fail('Should have thrown ServiceError');
            } catch (error: any) {
                expect(error).to.be.instanceOf(ServiceError);
                expect(error.status).to.equal(400);
                expect(error.message).to.equal('Title, author, authorCountry, and library are required');
            }
        });
    });

    describe('getById', () => {
        it('should return a book by ID', async () => {
            const bookId = new Types.ObjectId().toString();
            req.params = { id: bookId };
            const mockBook = { _id: bookId, title: 'Found Book' };
            const getByIdStub = sinon.stub(bookService, 'getByIdForUser').resolves(mockBook as any);

            await bookController.getById(req as any, res as any);

            expect(getByIdStub.calledWith(req.user!.libraries, bookId)).to.be.true;
            expect(jsonSpy.calledWith(mockBook)).to.be.true;
        });

        it('should return 400 if ID is not a string (negative scenario)', async () => {
            req.params = { id: 123 as any };

            await bookController.getById(req as any, res as any);

            expect(statusStub.calledWith(400)).to.be.true;
            expect(jsonSpy.calledWith({ error: 'Invalid book ID' })).to.be.true;
        });
    });

    describe('delete', () => {
        it('should delete a book and return 204', async () => {
            const bookId = new Types.ObjectId().toString();
            req.params = { id: bookId };
            const deleteStub = sinon.stub(bookService, 'deleteForUser').resolves();

            await bookController.delete(req as any, res as any);

            expect(deleteStub.calledWith(req.user!.libraries, bookId)).to.be.true;
            expect(statusStub.calledWith(204)).to.be.true;
            expect(sendSpy.calledOnce).to.be.true;
        });
    });
});
