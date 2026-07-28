const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

// Kept in its own file: the login limiter's key is per-IP (not per-account),
// so this test needs its budget completely untouched by any wrong-password
// attempt made anywhere else - a fresh require of ../src/app in its own test
// file gets a brand new limiter instance, guaranteeing that.
afterAll(async () => {
  await prisma.$disconnect();
});

describe('Customer login rate limiting', () => {
  const email = 'customer-ratelimit@test.local';

  beforeAll(async () => {
    await request(app).post('/api/customer-auth/register').send({
      name: 'Rate Limit Test',
      email,
      password: 'password123',
      agreeTerms: true,
    });
  });

  it('blocks further attempts after 5 wrong-password attempts within the window', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/customer-auth/login').send({ email, password: 'wrong' });
      expect(res.status).toBe(401);
    }

    const sixthAttempt = await request(app).post('/api/customer-auth/login').send({ email, password: 'wrong' });
    expect(sixthAttempt.status).toBe(429);

    // Even the CORRECT password is blocked once the window is exhausted -
    // this is the actual anti-brute-force guarantee being tested.
    const withCorrectPassword = await request(app)
      .post('/api/customer-auth/login')
      .send({ email, password: 'password123' });
    expect(withCorrectPassword.status).toBe(429);
  });
});
