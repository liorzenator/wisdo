import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import routes from '../src/routes/index.js';

describe('Root & Health Routes', () => {
  let app: express.Express;

  before(() => {
    app = express();
    app.use('/', routes);
  });

  it('GET / should return welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Welcome to Wisdo API');
  });

  it('GET /health should return 200 or 503 depending on status', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).to.include(res.status);
    expect(res.body).to.have.property('status');
    expect(res.body).to.have.property('version');
    expect(res.body).to.have.property('database');
    expect(res.body).to.have.property('redis');
    expect(res.body).to.have.property('environment');
  });
});
