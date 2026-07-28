const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

let adminToken;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/admin/reports/sales/latest', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).get('/api/admin/reports/sales/latest');
    expect(res.status).toBe(401);
  });

  it('resolves topProductIds into full product objects, in order', async () => {
    const products = await prisma.product.findMany({ take: 2 });
    await prisma.salesReport.create({
      data: {
        reportDate: new Date(`${2020 + Math.floor(Math.random() * 4)}-01-15`),
        totalOrders: 5,
        totalRevenue: 500000,
        topProductIds: [products[1].id, products[0].id],
      },
    });

    const res = await request(app).get('/api/admin/reports/sales/latest').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.topProducts).toHaveLength(2);
    expect(res.body.topProducts[0].id).toBe(products[1].id);
    expect(res.body.topProducts[1].id).toBe(products[0].id);
  });
});

describe('GET /api/admin/reports/sales', () => {
  it('filters by date range', async () => {
    const inRange = new Date('2022-06-15');
    const outOfRange = new Date('2019-01-01');
    await prisma.salesReport.upsert({
      where: { reportDate: inRange },
      create: { reportDate: inRange, totalOrders: 1, totalRevenue: 10000, topProductIds: [] },
      update: {},
    });
    await prisma.salesReport.upsert({
      where: { reportDate: outOfRange },
      create: { reportDate: outOfRange, totalOrders: 1, totalRevenue: 10000, topProductIds: [] },
      update: {},
    });

    const res = await request(app)
      .get('/api/admin/reports/sales')
      .query({ from: '2022-01-01', to: '2022-12-31' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const dates = res.body.map((r) => r.reportDate.slice(0, 10));
    expect(dates).toContain('2022-06-15');
    expect(dates).not.toContain('2019-01-01');
  });
});
