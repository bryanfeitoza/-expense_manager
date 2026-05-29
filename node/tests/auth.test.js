require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, RefreshToken } = require('../src/models');

let testUser = { name: 'Test User', email: 'test-auth@example.com', password: 'test123456' };
let accessToken;
let refreshTokenValue;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await User.destroy({ where: { email: testUser.email }, force: true });
  await sequelize.close();
});

describe('Auth Routes', () => {
  it('POST /api/auth/register - should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('POST /api/auth/register - should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe(true);
  });

  it('POST /api/auth/register - should validate required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
  });

  it('POST /api/auth/login - should login successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(testUser.email);

    accessToken = res.body.accessToken;
    refreshTokenValue = res.body.refreshToken;
  });

  it('POST /api/auth/login - should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe(true);
  });

  it('POST /api/auth/refresh - should rotate refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshTokenValue });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.refreshToken).not.toBe(refreshTokenValue);

    refreshTokenValue = res.body.refreshToken;
  });

  it('POST /api/auth/logout - should logout successfully', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: refreshTokenValue });

    expect(res.status).toBe(200);
  });

  it('GET /api/auth/me - should return user data', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('GET /api/auth/me - should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});
