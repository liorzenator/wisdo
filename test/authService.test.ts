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
                refreshTokens: [] as any[],
                save: sinon.stub().resolves()
            };
            sinon.stub(User, 'findOne').resolves(mockUser as any);
            
            const tokens = await authService.login('test', 'password');
            
            expect(tokens).to.have.property('accessToken');
            expect(tokens).to.have.property('refreshToken');
            expect(mockUser.refreshTokens).to.have.lengthOf(1);
            expect(mockUser.refreshTokens[0].token).to.equal(tokens.refreshToken);
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
                refreshTokens: [{ token: oldToken }] as any[],
                save: sinon.stub().resolves()
            };

            sinon.stub(jwt, 'verify').returns({ id: userId.toString() } as any);
            sinon.stub(User, 'findById').resolves(mockUser as any);

            const tokens = await authService.refresh(oldToken);

            expect(tokens).to.have.property('accessToken');
            expect(tokens).to.have.property('refreshToken');
            expect(mockUser.refreshTokens.find(t => t.token === oldToken)?.replacedBy).to.equal(tokens.refreshToken);
            expect(mockUser.refreshTokens).to.have.lengthOf(2);
            expect(mockUser.save.calledOnce).to.be.true;
        });

        it('should detect token reuse and invalidate all tokens', async () => {
            const userId = new mongoose.Types.ObjectId();
            const oldToken = 'old-token';
            const mockUser = {
                _id: userId,
                username: 'test',
                role: 'user',
                refreshTokens: [{ token: oldToken, replacedBy: 'new-token' }] as any[],
                save: sinon.stub().resolves()
            };

            sinon.stub(jwt, 'verify').returns({ id: userId.toString() } as any);
            sinon.stub(User, 'findById').resolves(mockUser as any);

            try {
                await authService.refresh(oldToken);
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error).to.be.instanceOf(ServiceError);
                expect(error.status).to.equal(401);
                expect(error.message).to.contain('reuse detected');
                expect(mockUser.refreshTokens).to.have.lengthOf(0);
                expect(mockUser.save.calledOnce).to.be.true;
            }
        });
    });
});
