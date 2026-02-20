import { expect } from 'chai';
import sinon from 'sinon';
import type { Response } from 'express';
import type { AuthRequest } from '../src/middleware/auth.js';
import { feedController } from '../src/controllers/feedController.js';
import { feedService } from '../src/services/feedService.js';
import mongoosePkg from 'mongoose';
const { Types } = mongoosePkg;

describe('FeedController', () => {
    let req: Partial<AuthRequest>;
    let res: Partial<Response>;
    let jsonSpy: sinon.SinonSpy;
    let statusStub: sinon.SinonStub;

    beforeEach(() => {
        jsonSpy = sinon.spy();
        statusStub = sinon.stub().returns({ json: jsonSpy });
        res = {
            json: jsonSpy,
            status: statusStub,
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

    describe('getFeed', () => {
        it('should return a feed of books', async () => {
            const mockFeed = [
                { title: 'Book 1', author: 'Author 1' },
                { title: 'Book 2', author: 'Author 2' }
            ];
            req.query = { limit: '5' };
            const getFeedStub = sinon.stub(feedService, 'getFeedForUser').resolves(mockFeed as any);

            await feedController.getFeed(req as any, res as any);

            expect(getFeedStub.calledWith(5, req.user)).to.be.true;
            expect(jsonSpy.calledWith(mockFeed)).to.be.true;
        });

        it('should use default limit if not provided', async () => {
            req.query = {};
            const getFeedStub = sinon.stub(feedService, 'getFeedForUser').resolves([]);

            await feedController.getFeed(req as any, res as any);

            expect(getFeedStub.calledWith(10, req.user)).to.be.true;
        });

        it('should clamp limit if it is too high', async () => {
            req.query = { limit: '999' };
            const getFeedStub = sinon.stub(feedService, 'getFeedForUser').resolves([]);

            await feedController.getFeed(req as any, res as any);

            expect(getFeedStub.calledWith(100, req.user)).to.be.true;
        });

        it('should clamp limit if it is too low', async () => {
            req.query = { limit: '-50' };
            const getFeedStub = sinon.stub(feedService, 'getFeedForUser').resolves([]);

            await feedController.getFeed(req as any, res as any);

            expect(getFeedStub.calledWith(1, req.user)).to.be.true;
        });
    });
});
