import { expect } from 'chai';
import sinon from 'sinon';
import mongoose from 'mongoose';
import { User, userPostSaveHook } from '../src/models/User.js';
import { bookPostSaveHook, bookPostFindOneAndDeleteHook } from '../src/models/Book.js';
import { libraryPostFindOneAndUpdateHook, libraryPostFindOneAndDeleteHook } from '../src/models/Library.js';
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
        it('Book post-save hook should trigger feed refresh', async () => {
            const libraryId = new mongoose.Types.ObjectId();
            const book = { library: libraryId } as any;
            const refreshStub = sinon.stub(feedService, 'refreshFeedForUsersInLibrary').resolves();
            bookPostSaveHook(book as any);
            expect(refreshStub.calledOnceWith(libraryId)).to.be.true;
        });

        it('Book post-findOneAndDelete hook should trigger feed refresh', async () => {
            const libraryId = new mongoose.Types.ObjectId();
            const book = { library: libraryId } as any;
            const refreshStub = sinon.stub(feedService, 'refreshFeedForUsersInLibrary').resolves();
            bookPostFindOneAndDeleteHook(book as any);
            expect(refreshStub.calledOnceWith(libraryId)).to.be.true;
        });

        it('User post-save hook should trigger feed refresh when libraries modified', async () => {
            const userId = new mongoose.Types.ObjectId();
            const userDoc: any = { _id: userId };
            const refreshStub = sinon.stub(feedService, 'refreshFeedForUser').resolves();
            // Simulate 'this' with modifiedPaths returning ['libraries']
            const thisCtx = { modifiedPaths: () => ['libraries'] } as any;
            userPostSaveHook.call(thisCtx, userDoc);
            expect(refreshStub.calledOnceWith(userId)).to.be.true;
        });

        it('Library post-findOneAndUpdate hook should trigger feed refresh', async () => {
            const libraryId = new mongoose.Types.ObjectId();
            const lib = { _id: libraryId } as any;
            const refreshStub = sinon.stub(feedService, 'refreshFeedForUsersInLibrary').resolves();
            libraryPostFindOneAndUpdateHook(lib as any);
            expect(refreshStub.calledOnceWith(libraryId)).to.be.true;
        });

        it('Library post-findOneAndDelete hook should trigger feed refresh', async () => {
            const libraryId = new mongoose.Types.ObjectId();
            const lib = { _id: libraryId } as any;
            const refreshStub = sinon.stub(feedService, 'refreshFeedForUsersInLibrary').resolves();
            libraryPostFindOneAndDeleteHook(lib as any);
            expect(refreshStub.calledOnceWith(libraryId)).to.be.true;
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
