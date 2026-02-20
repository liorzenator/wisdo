import { expect } from 'chai';
import sinon from 'sinon';
import mongoose from 'mongoose';
const { Types } = mongoose;
import { FeedService } from '../src/services/feedService.js';
import { Book } from '../src/models/Book.js';
import { Library } from '../src/models/Library.js';
import * as cacheModule from '../src/utils/cache.js';
const { cache } = cacheModule;

describe('FeedService', () => {
    let feedService: FeedService;
    let getUserFeedIdsStub: sinon.SinonStub;
    let setUserFeedIdsStub: sinon.SinonStub;

    beforeEach(() => {
        feedService = new FeedService();
        getUserFeedIdsStub = sinon.stub(cache, 'getUserFeedIds');
        setUserFeedIdsStub = sinon.stub(cache, 'setUserFeedIds').resolves();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('getFeedForUser', function() {
        this.timeout(5000);
        const mockUser: any = {
            _id: new Types.ObjectId(),
            country: 'USA',
            libraries: [new Types.ObjectId()],
            role: 'user'
        };

        it('should return cached books if available', async () => {
            const cachedIds = [new Types.ObjectId().toString(), new Types.ObjectId().toString()];
            getUserFeedIdsStub.resolves(cachedIds);
            
            const mockBooks = cachedIds.map(id => ({ _id: new Types.ObjectId(id), title: 'Book ' + id }));
            
            // Mock Book.find to return an object with a lean() method that resolves to mockBooks
            sinon.stub(Book, 'find').returns({
                lean: sinon.stub().returns({
                    exec: sinon.stub().resolves(mockBooks)
                }),
                exec: sinon.stub().resolves(mockBooks)
            } as any);

            const result = await feedService.getFeedForUser(10, mockUser);

            expect(result).to.have.lengthOf(2);
            expect(getUserFeedIdsStub.calledOnceWith(mockUser._id)).to.be.true;
            expect(result[0]._id.toString()).to.equal(cachedIds[0]);
        });

        it('should return empty array if user has no libraries and cache is empty', async () => {
            getUserFeedIdsStub.resolves(null);
            const userNoLibs = { ...mockUser, libraries: [] };

            const result = await feedService.getFeedForUser(10, userNoLibs);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should fetch all libraries for admin if cache is empty', async () => {
            getUserFeedIdsStub.resolves(null);
            const adminUser = { ...mockUser, role: 'admin', libraries: [] };
            const libs = [{ _id: new Types.ObjectId() }, { _id: new Types.ObjectId() }];
            
            sinon.stub(Library, 'find').resolves(libs as any);
            const aggregateStub = sinon.stub(Book, 'aggregate').resolves([]);

            await feedService.getFeedForUser(10, adminUser);

            expect(Library.find.calledOnce).to.be.true;
            const matchStep = aggregateStub.firstCall.args[0][0];
            expect(matchStep.$match.library.$in).to.have.lengthOf(2);
        });

        it('should return empty array if no books match criteria', async () => {
            getUserFeedIdsStub.resolves(null);
            sinon.stub(Book, 'aggregate').resolves([]);

            const result = await feedService.getFeedForUser(10, mockUser);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should respect the limit parameter', async () => {
            getUserFeedIdsStub.resolves(null);
            const manyBooks = Array(15).fill(0).map(() => ({ _id: new Types.ObjectId() }));
            sinon.stub(Book, 'aggregate').resolves(manyBooks);

            const result = await feedService.getFeedForUser(5, mockUser);

            expect(result).to.have.lengthOf(5);
        });

        it('should handle edge case where cache returns IDs but Books are missing from DB', async () => {
            const cachedIds = [new Types.ObjectId().toString()];
            getUserFeedIdsStub.resolves(cachedIds);
            
            sinon.stub(Book, 'find').returns({
                lean: sinon.stub().returns({
                    exec: sinon.stub().resolves([])
                })
            } as any);

            const result = await feedService.getFeedForUser(10, mockUser);

            expect(result).to.be.an('array').that.is.empty;
        });
    });
});
