const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/customer-auth/register', () => {
  it('creates an account when terms are agreed and returns a usable token', async () => {
    const res = await request(app).post('/api/customer-auth/register').send({
      name: 'Nguyen Van A',
      email: 'customer-register@test.local',
      phone: '0900000001',
      password: 'password123',
      agreeTerms: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.customer.email).toBe('customer-register@test.local');
  });

  it('rejects registration without agreeing to terms', async () => {
    const res = await request(app).post('/api/customer-auth/register').send({
      name: 'Nguyen Van B',
      email: 'customer-noterms@test.local',
      password: 'password123',
      agreeTerms: false,
    });

    expect(res.status).toBe(400);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app).post('/api/customer-auth/register').send({
      name: 'Nguyen Van C',
      email: 'customer-shortpw@test.local',
      password: '123',
      agreeTerms: true,
    });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/customer-auth/register').send({
      name: 'Nguyen Van D',
      email: 'customer-dup@test.local',
      password: 'password123',
      agreeTerms: true,
    });

    const res = await request(app).post('/api/customer-auth/register').send({
      name: 'Nguyen Van D2',
      email: 'customer-dup@test.local',
      password: 'password123',
      agreeTerms: true,
    });

    expect(res.status).toBe(409);
  });

  it('allows re-registering with an email whose previous account was deleted', async () => {
    const email = 'customer-reuse@test.local';

    const firstRes = await request(app).post('/api/customer-auth/register').send({
      name: 'Reuse First',
      email,
      password: 'password123',
      agreeTerms: true,
    });
    expect(firstRes.status).toBe(201);

    const deleteRes = await request(app)
      .delete('/api/customer-auth/me')
      .set('Authorization', `Bearer ${firstRes.body.token}`);
    expect(deleteRes.status).toBe(204);

    const secondRes = await request(app).post('/api/customer-auth/register').send({
      name: 'Reuse Second',
      email,
      password: 'password456',
      agreeTerms: true,
    });
    expect(secondRes.status).toBe(201);
    expect(secondRes.body.customer.email).toBe(email);

    const loginRes = await request(app).post('/api/customer-auth/login').send({
      email,
      password: 'password456',
    });
    expect(loginRes.status).toBe(200);
  });
});

describe('POST /api/customer-auth/login', () => {
  const email = 'customer-login@test.local';
  const password = 'password123';

  beforeAll(async () => {
    await request(app).post('/api/customer-auth/register').send({
      name: 'Login Test',
      email,
      password,
      agreeTerms: true,
    });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/customer-auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects the wrong password', async () => {
    const res = await request(app).post('/api/customer-auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/customer-auth/logout revokes the token server-side', () => {
  const email = 'customer-logout@test.local';
  const password = 'password123';

  it('rejects the old token on /me after logout, even though the JWT itself has not expired', async () => {
    const registerRes = await request(app).post('/api/customer-auth/register').send({
      name: 'Logout Test',
      email,
      password,
      agreeTerms: true,
    });
    const token = registerRes.body.token;

    const meBeforeLogout = await request(app).get('/api/customer-auth/me').set('Authorization', `Bearer ${token}`);
    expect(meBeforeLogout.status).toBe(200);

    const logoutRes = await request(app).post('/api/customer-auth/logout').set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(204);

    const meAfterLogout = await request(app).get('/api/customer-auth/me').set('Authorization', `Bearer ${token}`);
    expect(meAfterLogout.status).toBe(401);
  });
});

// Rate-limit behavior is tested separately in customerAuthRateLimit.test.js -
// it needs the login limiter's budget completely untouched by any other
// request, and the limiter key is per-IP (not per-account), so any other
// wrong-password attempt anywhere else in this file would silently eat into
// that budget and make the count in that test flaky depending on ordering.
