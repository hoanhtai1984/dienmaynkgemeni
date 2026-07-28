const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/site-stats', () => {
  it('returns likeCount/visitCount, creating the singleton row on first access', async () => {
    const res = await request(app).get('/api/site-stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.likeCount).toBe('number');
    expect(typeof res.body.visitCount).toBe('number');
  });
});

describe('POST /api/site-stats/visit', () => {
  it('increments visitCount by 1 each call', async () => {
    const before = await request(app).get('/api/site-stats');
    const res = await request(app).post('/api/site-stats/visit');
    expect(res.status).toBe(200);
    expect(res.body.visitCount).toBe(before.body.visitCount + 1);
  });
});

describe('POST /api/site-stats/like', () => {
  it('increments likeCount when liked=true', async () => {
    const before = await request(app).get('/api/site-stats');
    const res = await request(app).post('/api/site-stats/like').send({ liked: true });
    expect(res.status).toBe(200);
    expect(res.body.likeCount).toBe(before.body.likeCount + 1);
  });

  it('decrements likeCount when liked=false', async () => {
    await request(app).post('/api/site-stats/like').send({ liked: true });
    const before = await request(app).get('/api/site-stats');
    const res = await request(app).post('/api/site-stats/like').send({ liked: false });
    expect(res.body.likeCount).toBe(before.body.likeCount - 1);
  });

  it('never goes below zero', async () => {
    await prisma.siteStats.upsert({ where: { id: 1 }, create: { id: 1, likeCount: 0 }, update: { likeCount: 0 } });
    const res = await request(app).post('/api/site-stats/like').send({ liked: false });
    expect(res.body.likeCount).toBe(0);
  });
});
