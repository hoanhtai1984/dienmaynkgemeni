const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

let category;
let product;
let counter = 0;

beforeAll(async () => {
  category = await prisma.category.findFirst();
  product = await prisma.product.create({
    data: {
      name: 'Coupon/Review Public Test Product',
      slug: `coupon-review-public-test-${Date.now()}`,
      brand: 'TestBrand',
      price: 200000,
      oldPrice: 200000,
      description: 'test',
      specs: {},
      stock: 10,
      categoryId: category.id,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

function uniqueCode(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

describe('POST /api/coupons/validate', () => {
  it('rejects an empty code', async () => {
    const res = await request(app).post('/api/coupons/validate').send({ code: '', subtotal: 100000 });
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown code', async () => {
    const res = await request(app).post('/api/coupons/validate').send({ code: 'NOPE_NOT_REAL', subtotal: 100000 });
    expect(res.status).toBe(404);
  });

  it('rejects an inactive coupon', async () => {
    const coupon = await prisma.coupon.create({
      data: { code: uniqueCode('INACTIVE'), discountType: 'PERCENT', discountValue: 10, active: false },
    });
    const res = await request(app).post('/api/coupons/validate').send({ code: coupon.code, subtotal: 100000 });
    expect(res.status).toBe(400);
  });

  it('rejects an expired coupon', async () => {
    const coupon = await prisma.coupon.create({
      data: { code: uniqueCode('EXPIRED'), discountType: 'PERCENT', discountValue: 10, expiresAt: new Date('2020-01-01') },
    });
    const res = await request(app).post('/api/coupons/validate').send({ code: coupon.code, subtotal: 100000 });
    expect(res.status).toBe(400);
  });

  it('rejects a coupon that has hit its usage cap', async () => {
    const coupon = await prisma.coupon.create({
      data: { code: uniqueCode('MAXED'), discountType: 'PERCENT', discountValue: 10, maxUses: 1, usedCount: 1 },
    });
    const res = await request(app).post('/api/coupons/validate').send({ code: coupon.code, subtotal: 100000 });
    expect(res.status).toBe(400);
  });

  it('rejects a subtotal below the minimum order total', async () => {
    const coupon = await prisma.coupon.create({
      data: { code: uniqueCode('MINORDER'), discountType: 'PERCENT', discountValue: 10, minOrderTotal: 500000 },
    });
    const res = await request(app).post('/api/coupons/validate').send({ code: coupon.code, subtotal: 100000 });
    expect(res.status).toBe(400);
  });

  it('computes a PERCENT discount, floored, matched case-insensitively', async () => {
    // Admin luôn lưu code dạng viết hoa (xem adminCouponsController) - viết
    // hoa sẵn ở đây để giống đúng dữ liệu thật, rồi test tra cứu bằng chữ
    // thường vẫn khớp đúng.
    const coupon = await prisma.coupon.create({
      data: { code: uniqueCode('PCT').toUpperCase(), discountType: 'PERCENT', discountValue: 15 },
    });
    const res = await request(app).post('/api/coupons/validate').send({ code: coupon.code.toLowerCase(), subtotal: 199999 });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(coupon.code.toUpperCase());
    expect(res.body.discountAmount).toBe(Math.floor(199999 * 0.15));
  });

  it('caps a FIXED discount at the subtotal (cannot discount more than the order value)', async () => {
    const coupon = await prisma.coupon.create({
      data: { code: uniqueCode('BIGFIXED'), discountType: 'FIXED', discountValue: 999999 },
    });
    const res = await request(app).post('/api/coupons/validate').send({ code: coupon.code, subtotal: 50000 });
    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(50000);
  });
});

describe('GET /api/reviews/product/:productId', () => {
  it('only returns approved reviews', async () => {
    const hashed = await bcrypt.hash('password123', 10);
    const customer = await prisma.customer.create({ data: { name: 'Reviewer', email: `pub-review-${Date.now()}@test.local`, password: hashed } });
    await prisma.review.create({ data: { productId: product.id, customerId: customer.id, rating: 5, comment: 'approved one', approved: true } });
    await prisma.review.create({
      data: {
        productId: product.id,
        customerId: (await prisma.customer.create({ data: { name: 'R2', email: `pub-review2-${Date.now()}@test.local`, password: hashed } })).id,
        rating: 1,
        comment: 'pending one',
        approved: false,
      },
    });

    const res = await request(app).get(`/api/reviews/product/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].comment).toBe('approved one');
    expect(res.body[0].customerName).toBe('Reviewer');
  });
});

describe('customer review eligibility + submission flow', () => {
  let customer;
  let token;

  beforeAll(async () => {
    const registerRes = await request(app).post('/api/customer-auth/register').send({
      name: 'Purchase Test Customer',
      email: `purchase-review-${Date.now()}@test.local`,
      password: 'password123',
      agreeTerms: true,
    });
    token = registerRes.body.token;
    customer = registerRes.body.customer;
  });

  it('GET eligibility rejects requests with no token', async () => {
    const res = await request(app).get(`/api/reviews/eligibility/${product.id}`);
    expect(res.status).toBe(401);
  });

  it('reports not eligible when the customer has no completed order for this product', async () => {
    const res = await request(app).get(`/api/reviews/eligibility/${product.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.eligible).toBe(false);
    expect(res.body.existingReview).toBeNull();
  });

  it('POST /api/reviews rejects submission when not eligible (no purchase)', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, rating: 5, comment: 'should not work' });
    expect(res.status).toBe(403);
  });

  it('rejects an out-of-range rating', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product.id, rating: 6, comment: 'bad rating' });
    expect(res.status).toBe(400);
  });

  describe('once the customer has a COMPLETED order containing the product', () => {
    beforeAll(async () => {
      await prisma.order.create({
        data: {
          code: `REVIEWFLOW${Date.now()}`,
          customerId: customer.id,
          customerName: customer.name,
          phone: '0900000000',
          address: 'test address',
          paymentMethod: 'COD',
          status: 'COMPLETED',
          total: product.price,
          items: { create: [{ productId: product.id, name: product.name, price: product.price, quantity: 1 }] },
        },
      });
    });

    it('reports eligible: true', async () => {
      const res = await request(app).get(`/api/reviews/eligibility/${product.id}`).set('Authorization', `Bearer ${token}`);
      expect(res.body.eligible).toBe(true);
    });

    it('accepts a valid review submission, defaulting to unapproved', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id, rating: 4, comment: 'Sản phẩm tốt' });

      expect(res.status).toBe(201);
      expect(res.body.approved).toBe(false);
      expect(res.body.rating).toBe(4);
    });

    it('reflects the just-submitted review in the eligibility check', async () => {
      const res = await request(app).get(`/api/reviews/eligibility/${product.id}`).set('Authorization', `Bearer ${token}`);
      expect(res.body.existingReview).not.toBeNull();
      expect(res.body.existingReview.rating).toBe(4);
    });

    it('editing the review upserts (same customer+product) instead of creating a duplicate row', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id, rating: 2, comment: 'Đổi ý' });

      const reviews = await prisma.review.findMany({ where: { productId: product.id, customerId: customer.id } });
      expect(reviews).toHaveLength(1);
      expect(reviews[0].rating).toBe(2);
    });
  });
});
