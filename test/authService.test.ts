import { expect } from 'chai';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import { User } from '../src/models/User.js';
import { authService } from '../src/services/authService.js';
import { feedService } from '../src/services/feedService.js';
import env from '../src/config/environment.js';
import { ServiceError } from '../src/errors/ServiceError.js';
import mongoose from 'mongoose';

describe('AuthService', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('login', () => {
        it('should throw error if username or password missing', async () => {
            try {
                await authService.login('', '');
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error).to.be.instanceOf(ServiceError);
                expect(error.status).to.equal(400);
            }
        });

        it('should throw error if user not found', async () => {
            sinon.stub(User, 'findOne').resolves(null);
            try {
                await authService.login('test', 'password');
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error).to.be.instanceOf(ServiceError);
                expect(error.status).to.equal(401);
            }
        });

        it('should login successfully and return tokens', async () => {
            const mockUser = {
                _id: new mongoose.Types.ObjectId(),
                username: 'test',
                role: 'user',
                comparePassword: sinon.stub().resolves(true),
                refreshTokens: [],
                save: sinon.stub().resolves()
            };
            sinon.stub(User, 'findOne').resolves(mockUser as any);
            sinon.stub(feedService, 'preCalculateFeed').resolves();
            
            const tokens = await authService.login('test', 'password');
            
            expect(tokens).to.have.property('accessToken');
            expect(tokens).to.have.property('refreshToken');
            expect(mockUser.refreshTokens).to.have.lengthOf(1);
            expect(mockUser.save.calledOnce).to.be.true;
        });
    });

    describe('refresh', () => {
        it('should throw error if refreshToken missing', async () => {
            try {
                await authService.refresh('');
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error).to.be.instanceOf(ServiceError);
                expect(error.status).to.equal(400);
            }
        });

        it('should refresh tokens successfully', async () => {
            const userId = new mongoose.Types.ObjectId();
            const oldToken = 'old-token';
            const mockUser = {
                _id: userId,
                username: 'test',
                role: 'user',
                refreshTokens: [oldToken],
                save: sinon.stub().resolves()
            };

            sinon.stub(jwt, 'verify').returns({ id: userId.toString() } as any);
            sinon.stub(User, 'findById').resolves(mockUser as any);

            const tokens = await authService.refresh(oldToken);

            expect(tokens).to.have.property('accessToken');
            expect(tokens).to.have.property('refreshToken');
            expect(mockUser.refreshTokens).to.not.contain(oldToken);
            expect(mockUser.refreshTokens).to.have.lengthOf(1);
            expect(mockUser.save.calledOnce).to.be.true;
        });
    });
});
