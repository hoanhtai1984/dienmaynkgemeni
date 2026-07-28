const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

let category;
let product;
let customerA;
let tokenA;
let customerB;
let tokenB;

beforeAll(async () => {
  category = await prisma.category.findFirst();
  product = await prisma.product.create({
    data: {
      name: 'Customer Orders Test Product',
      slug: `customer-orders-test-${Date.now()}`,
      brand: 'TestBrand',
      price: 80000,
      oldPrice: 80000,
      description: 'test',
      specs: {},
      stock: 20,
      categoryId: category.id,
    },
  });

  const regA = await request(app).post('/api/customer-auth/register').send({
    name: 'Customer A', email: `customer-orders-a-${Date.now()}@test.local`, password: 'password123', agreeTerms: true,
  });
  tokenA = regA.body.token;
  customerA = regA.body.customer;

  const regB = await request(app).post('/api/customer-auth/register').send({
    name: 'Customer B', email: `customer-orders-b-${Date.now()}@test.local`, password: 'password123', agreeTerms: true,
  });
  tokenB = regB.body.token;
  customerB = regB.body.customer;
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function placeOrderAs(token, quantity = 1) {
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      customerName: 'Test',
      phone: '0900000000',
      provinceCode: '01',
      wardCode: '00004',
      addressDetail: 'test address',
      items: [{ productId: product.id, quantity }],
    });
  return res.body;
}

describe('GET /api/customer-auth/orders', () => {
  it('rejects requests with no token', async () => {
    const res = await request(app).get('/api/customer-auth/orders');
    expect(res.status).toBe(401);
  });

  it('only returns the logged-in customer\'s own orders', async () => {
    const orderA = await placeOrderAs(tokenA);
    await placeOrderAs(tokenB);

    const res = await request(app).get('/api/customer-auth/orders').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    const ids = res.body.map((o) => o.id);
    expect(ids).toContain(orderA.id);
    expect(res.body.every((o) => o.customerId === customerA.id)).toBe(true);
  });
});

describe('PATCH /api/customer-auth/orders/:id/cancel', () => {
  it('rejects requests with no token', async () => {
    const res = await request(app).patch('/api/customer-auth/orders/1/cancel');
    expect(res.status).toBe(401);
  });

  it('returns 404 when cancelling another customer\'s order', async () => {
    const orderA = await placeOrderAs(tokenA);
    const res = await request(app)
      .patch(`/api/customer-auth/orders/${orderA.id}/cancel`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-existent order id', async () => {
    const res = await request(app)
      .patch('/api/customer-auth/orders/999999999/cancel')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
  });

  it('cancels a PENDING order and restores stock', async () => {
    const stockBefore = (await prisma.product.findUnique({ where: { id: product.id } })).stock;
    const order = await placeOrderAs(tokenA, 3);

    const res = await request(app)
      .patch(`/api/customer-auth/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
    const stockAfter = (await prisma.product.findUnique({ where: { id: product.id } })).stock;
    expect(stockAfter).toBe(stockBefore); // -3 lúc đặt, +3 lúc hủy = về lại bằng ban đầu
  });

  it('cancels a CONFIRMED order too (self-cancel is not limited to PENDING)', async () => {
    const order = await placeOrderAs(tokenA);
    await prisma.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } });

    const res = await request(app)
      .patch(`/api/customer-auth/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  it('rejects cancelling a company invoice order already paid by bank transfer', async () => {
    const order = await placeOrderAs(tokenA);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        invoiceRequested: true,
        companyName: 'Test Corp',
        companyTaxCode: '0123456789',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PAID',
      },
    });

    const res = await request(app)
      .patch(`/api/customer-auth/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(400);
  });

  it('allows cancelling a company invoice order that has not been paid yet', async () => {
    const order = await placeOrderAs(tokenA);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        invoiceRequested: true,
        companyName: 'Test Corp',
        companyTaxCode: '0123456789',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'UNPAID',
      },
    });

    const res = await request(app)
      .patch(`/api/customer-auth/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
  });

  it('rejects cancelling an already-cancelled order', async () => {
    const order = await placeOrderAs(tokenA);
    await request(app).patch(`/api/customer-auth/orders/${order.id}/cancel`).set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app)
      .patch(`/api/customer-auth/orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(400);
  });
});
