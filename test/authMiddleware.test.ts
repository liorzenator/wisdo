import { expect } from 'chai';
import sinon from 'sinon';
import { authMiddleware } from '../src/middleware/auth.js';
import passport from '../src/config/passport.js';
import { Library } from '../src/models/Library.js';
import mongoose from 'mongoose';

describe('authMiddleware', () => {
    let req: any;
    let res: any;
    let next: sinon.SinonSpy;

    beforeEach(() => {
        req = {};
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };
        next = sinon.spy();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should pass admin users without populating libraries', async () => {
        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            role: 'admin',
            libraries: []
        };

        sinon.stub(passport, 'authenticate').returns(((req: any, res: any, next: any) => {
            const callback = (passport.authenticate as any).getCall(0).args[2];
            callback(null, mockAdmin, null);
        }) as any);

        const libraryFindSpy = sinon.spy(Library, 'find');

        authMiddleware(req, res, next);

        expect(mockAdmin.libraries).to.have.lengthOf(0);
        expect(libraryFindSpy.called).to.be.false;
        expect(req.user).to.equal(mockAdmin);
        expect(next.calledOnce).to.be.true;
    });

    it('should NOT populate libraries for regular users', async () => {
        const initialLibraries = [new mongoose.Types.ObjectId()];
        const mockUser = {
            _id: new mongoose.Types.ObjectId(),
            role: 'user',
            libraries: [...initialLibraries]
        };

        sinon.stub(passport, 'authenticate').returns(((req: any, res: any, next: any) => {
            const callback = (passport.authenticate as any).getCall(0).args[2];
            callback(null, mockUser, null);
        }) as any);

        const libraryFindSpy = sinon.spy(Library, 'find');

        authMiddleware(req, res, next);

        expect(mockUser.libraries).to.deep.equal(initialLibraries);
        expect(libraryFindSpy.called).to.be.false;
        expect(req.user).to.equal(mockUser);
        expect(next.calledOnce).to.be.true;
    });
});
