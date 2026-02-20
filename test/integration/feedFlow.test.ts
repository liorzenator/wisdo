import { expect } from 'chai';
import mongoose from 'mongoose';
const { Types } = mongoose;
import { feedService } from '../../src/services/feedService.js';
import { User } from '../../src/models/User.js';
import { Book } from '../../src/models/Book.js';
import { Library } from '../../src/models/Library.js';
import { cache } from '../../src/utils/cache.js';
import sinon from 'sinon';

describe('Feed Integration Flow', () => {
    let mockUser: any;
    let mockLibrary: any;

    let setUserFeedIdsStub: sinon.SinonStub;

    beforeEach(async () => {
        // We still use mocks for DB models to avoid requiring a real MongoDB connection 
        // in this "integration-style" test, but we flow through the real service logic.
        mockLibrary = { _id: new Types.ObjectId(), name: 'Test Library' };
        mockUser = {
            _id: new Types.ObjectId(),
            username: 'testuser',
            libraries: [mockLibrary._id],
            country: 'USA'
        };

        sinon.stub(User, 'findById').resolves(mockUser);
        sinon.stub(Library, 'find').resolves([mockLibrary]);
        sinon.stub(cache, 'getUserFeedIds').resolves(null);
        setUserFeedIdsStub = sinon.stub(cache, 'setUserFeedIds').resolves();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should generate a personalized feed based on user libraries and book data', async () => {
        const books = [
            { _id: new Types.ObjectId(), title: 'Book 1', library: mockLibrary._id, authorCountry: 'USA', pages: 100, publishedDate: new Date() },
            { _id: new Types.ObjectId(), title: 'Book 2', library: mockLibrary._id, authorCountry: 'UK', pages: 200, publishedDate: new Date() }
        ];

        // Mock aggregation result which is what feedService.getFeedForUser uses when cache is empty
        sinon.stub(Book, 'aggregate').resolves(books);

        const feed = await feedService.getFeedForUser(10, mockUser);

        expect(feed).to.have.lengthOf(2);
        expect(feed[0].title).to.equal('Book 1');
        expect(setUserFeedIdsStub.calledOnce).to.be.true;
    });

    it('should return an empty feed if the user has no libraries', async () => {
        mockUser.libraries = [];
        const feed = await feedService.getFeedForUser(10, mockUser);
        expect(feed).to.be.an('array').that.is.empty;
    });
});
