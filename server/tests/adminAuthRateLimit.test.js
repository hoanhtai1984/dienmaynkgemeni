const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL } = require('./testEnv');

// Kept in its own file: the login limiter's key is per-IP (not per-account),
// so this test needs its budget completely untouched by any wrong-password
// attempt made anywhere else - a fresh require of ../src/app in its own test
// file gets a brand new limiter instance, guaranteeing that.
afterAll(async () => {
  await prisma.$disconnect();
});

describe('Admin login rate limiting', () => {
  it('blocks further attempts after 5 wrong-password attempts within the window', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: 'wrong' });
      expect(res.status).toBe(401);
    }

    const sixthAttempt = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: 'wrong' });
    expect(sixthAttempt.status).toBe(429);
  });
});
