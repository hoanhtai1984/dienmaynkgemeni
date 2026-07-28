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

function uniqueCode(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

describe('GET /api/admin/coupons', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).get('/api/admin/coupons');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/coupons', () => {
  it('rejects a missing code', async () => {
    const res = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ discountType: 'PERCENT', discountValue: 10 });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid discountType', async () => {
    const res = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: uniqueCode('BADTYPE'), discountType: 'HALF_PRICE', discountValue: 10 });
    expect(res.status).toBe(400);
  });

  it('rejects a percent discount over 100', async () => {
    const res = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: uniqueCode('OVER100'), discountType: 'PERCENT', discountValue: 150 });
    expect(res.status).toBe(400);
  });

  it('rejects a non-positive discount value', async () => {
    const res = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: uniqueCode('ZERO'), discountType: 'FIXED', discountValue: 0 });
    expect(res.status).toBe(400);
  });

  it('creates a valid PERCENT coupon, normalizing the code to uppercase', async () => {
    const code = uniqueCode('sale');
    const res = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, discountType: 'PERCENT', discountValue: 10, minOrderTotal: 100000 });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe(code.toUpperCase());
    expect(res.body.active).toBe(true);
    expect(res.body.usedCount).toBe(0);
  });

  it('creates a valid FIXED coupon with no cap on maxUses when omitted', async () => {
    const code = uniqueCode('FIXED');
    const res = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, discountType: 'FIXED', discountValue: 50000 });

    expect(res.status).toBe(201);
    expect(res.body.maxUses).toBeNull();
  });

  it('rejects a duplicate code (case-insensitive)', async () => {
    const code = uniqueCode('DUP');
    const first = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, discountType: 'PERCENT', discountValue: 5 });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: code.toLowerCase(), discountType: 'PERCENT', discountValue: 5 });
    expect(second.status).toBe(409);
  });
});

describe('PATCH /api/admin/coupons/:id', () => {
  it('returns 404 for a non-existent coupon', async () => {
    const res = await request(app)
      .patch('/api/admin/coupons/999999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });
    expect(res.status).toBe(404);
  });

  it('updates only the fields provided (active toggle)', async () => {
    const created = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: uniqueCode('TOGGLE'), discountType: 'PERCENT', discountValue: 15, minOrderTotal: 20000 });

    const res = await request(app)
      .patch(`/api/admin/coupons/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
    // Field không gửi lên phải giữ nguyên, không bị reset.
    expect(res.body.discountValue).toBe(15);
    expect(res.body.minOrderTotal).toBe(20000);
  });

  it('rejects an invalid discountType on update', async () => {
    const created = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: uniqueCode('BADUPD'), discountType: 'PERCENT', discountValue: 10 });

    const res = await request(app)
      .patch(`/api/admin/coupons/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ discountType: 'NOT_REAL' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/admin/coupons/:id', () => {
  it('returns 404 for a non-existent coupon', async () => {
    const res = await request(app)
      .delete('/api/admin/coupons/999999999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('deletes an existing coupon', async () => {
    const created = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: uniqueCode('DEL'), discountType: 'FIXED', discountValue: 10000 });

    const res = await request(app)
      .delete(`/api/admin/coupons/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const after = await prisma.coupon.findUnique({ where: { id: created.body.id } });
    expect(after).toBeNull();
  });
});
