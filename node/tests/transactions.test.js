require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Transaction, Category, Account } = require('../src/models');

let accessToken;
let testCategory;
let testAccount;
let testTransaction;
const testUser = {
  name: 'Test Transaction User',
  email: 'test-trx@example.com',
  password: 'test123456',
};

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send(testUser);

  accessToken = registerRes.body.accessToken;

  testCategory = await Category.create({
    userId: registerRes.body.user.id,
    name: 'Test Category',
    type: 'despesa',
  });

  testAccount = await Account.create({
    userId: registerRes.body.user.id,
    name: 'Test Account',
    balance: 1000,
  });
});

afterAll(async () => {
  await User.destroy({ where: { email: testUser.email }, force: true });
  await sequelize.close();
});

describe('Transaction Routes', () => {
  it('GET /api/transactions - should list empty transactions', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toEqual([]);
  });

  it('POST /api/transactions - should create a transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        description: 'Test expense',
        amount: 50.00,
        type: 'despesa',
        categoryId: testCategory.id,
        accountId: testAccount.id,
        transactionDate: '2026-05-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.transaction).toHaveProperty('id');
    expect(res.body.transaction.description).toBe('Test expense');
    expect(parseFloat(res.body.transaction.amount)).toBe(50);

    testTransaction = res.body.transaction;
  });

  it('GET /api/transactions - should list transactions', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.pagination).toHaveProperty('total');
  });

  it('GET /api/transactions/:id - should show transaction', async () => {
    const res = await request(app)
      .get(`/api/transactions/${testTransaction.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transaction.id).toBe(testTransaction.id);
  });

  it('PUT /api/transactions/:id - should update transaction', async () => {
    const res = await request(app)
      .put(`/api/transactions/${testTransaction.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: 'Updated expense', amount: 75.00 });

    expect(res.status).toBe(200);
    expect(res.body.transaction.description).toBe('Updated expense');
    expect(parseFloat(res.body.transaction.amount)).toBe(75);
  });

  it('DELETE /api/transactions/:id - should delete transaction', async () => {
    const res = await request(app)
      .delete(`/api/transactions/${testTransaction.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/transactions/${testTransaction.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getRes.status).toBe(404);
  });

  it('POST /api/transactions - should reject invalid data', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: '', amount: -5, type: 'invalid' });

    expect(res.status).toBe(400);
  });

  it('GET /api/transactions - should reject without auth', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });
});
