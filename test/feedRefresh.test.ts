import { expect } from 'chai';
import sinon from 'sinon';
import mongoose from 'mongoose';
import { User, userPostSaveHook } from '../src/models/User.js';
import { bookPostSaveHook, bookPostFindOneAndDeleteHook } from '../src/models/Book.js';
import { libraryPostFindOneAndUpdateHook, libraryPostFindOneAndDeleteHook } from '../src/models/Library.js';
import { DOMAIN_EVENTS, domainEvents } from '../src/utils/domainEvents.js';
import { feedService } from '../src/services/feedService.js';

describe('Feed Refresh Logic', () => {
    let preCalculateFeedStub: sinon.SinonStub;

    beforeEach(() => {
        preCalculateFeedStub = sinon.stub(feedService, 'preCalculateFeed').resolves();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Model Hooks', () => {
        it('Book post-save hook should emit BOOK_CREATED event', async () => {
            const libraryId = new mongoose.Types.ObjectId();
            const book = { library: libraryId } as any;
            const emitStub = domainEvents.emit as sinon.SinonStub;
            bookPostSaveHook(book as any);
            expect(emitStub.calledWith(DOMAIN_EVENTS.BOOK_CREATED, libraryId)).to.be.true;
        });

        it('Book post-findOneAndDelete hook should emit BOOK_DELETED event', async () => {
            const libraryId = new mongoose.Types.ObjectId();
            const book = { library: libraryId } as any;
            const emitStub = domainEvents.emit as sinon.SinonStub;
            bookPostFindOneAndDeleteHook(book as any);
            expect(emitStub.calledWith(DOMAIN_EVENTS.BOOK_DELETED, libraryId)).to.be.true;
        });

        it('User post-save hook should emit USER_LIBRARIES_UPDATED event when libraries modified', async () => {
            const userId = new mongoose.Types.ObjectId();
            const userDoc: any = { _id: userId };
            const emitStub = domainEvents.emit as sinon.SinonStub;
            // Simulate 'this' with modifiedPaths returning ['libraries']
            const thisCtx = { modifiedPaths: () => ['libraries'] } as any;
            userPostSaveHook.call(thisCtx, userDoc);
            expect(emitStub.calledWith(DOMAIN_EVENTS.USER_LIBRARIES_UPDATED, userId)).to.be.true;
        });

        it('Library post-findOneAndUpdate hook should emit LIBRARY_UPDATED event', async () => {
            const libraryId = new mongoose.Types.ObjectId();
            const lib = { _id: libraryId } as any;
            const emitStub = domainEvents.emit as sinon.SinonStub;
            libraryPostFindOneAndUpdateHook(lib as any);
            expect(emitStub.calledWith(DOMAIN_EVENTS.LIBRARY_UPDATED, libraryId)).to.be.true;
        });

        it('Library post-findOneAndDelete hook should emit LIBRARY_DELETED event', async () => {
            const libraryId = new mongoose.Types.ObjectId();
            const lib = { _id: libraryId } as any;
            const emitStub = domainEvents.emit as sinon.SinonStub;
            libraryPostFindOneAndDeleteHook(lib as any);
            expect(emitStub.calledWith(DOMAIN_EVENTS.LIBRARY_DELETED, libraryId)).to.be.true;
        });
    });

    describe('FeedService.preCalculateAllFeeds', () => {
        it('should call preCalculateFeed for all users', async () => {
            const users = [
                { _id: new mongoose.Types.ObjectId() },
                { _id: new mongoose.Types.ObjectId() }
            ];
            sinon.stub(User, 'find').resolves(users as any);

            await feedService.preCalculateAllFeeds();

            expect(preCalculateFeedStub.calledTwice).to.be.true;
        });
    });
});
