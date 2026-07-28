const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/login (admin)', () => {
  it('logs in the seeded admin with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.admin.email).toBe(ADMIN_EMAIL);
  });

  it('rejects the wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.local', password: 'whatever' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a garbage token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout revokes the token server-side', () => {
  it('rejects the old token on /me after logout, even though the JWT itself has not expired', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const token = loginRes.body.token;

    const meBeforeLogout = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meBeforeLogout.status).toBe(200);

    const logoutRes = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(204);

    const meAfterLogout = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meAfterLogout.status).toBe(401);
  });
});

// Rate-limit behavior is tested separately in adminAuthRateLimit.test.js - it
// needs the login limiter's budget completely untouched by any other request
// (the limiter key is per-IP, not per-account), so any other wrong-password
// attempt anywhere else in this file would silently eat into that budget.
