const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

let seededProduct;

beforeAll(async () => {
  // Cần tồn kho đủ cho các test đặt số lượng > 1 bên dưới - tránh chọn nhầm
  // sản phẩm đang hết hàng (stock=0), điều hoàn toàn có thể xảy ra với
  // findFirst() không lọc gì trên catalog seed thật.
  seededProduct = await prisma.product.findFirst({ where: { stock: { gte: 5 } } });
  if (!seededProduct) throw new Error('Seed did not create any in-stock products - cannot test order creation');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/orders (guest checkout)', () => {
  it('creates an order with no auth token at all', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Khach Vang Lai',
        phone: '0911111111',
        provinceCode: '01',
        wardCode: '00004',
        addressDetail: '123 Test Street',
        items: [{ productId: seededProduct.id, quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.customerId).toBeNull();
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.total).toBe(seededProduct.price * 2);
  });

  it('rejects an order missing required contact fields', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: seededProduct.id, quantity: 1 }] });

    expect(res.status).toBe(400);
  });

  it('rejects an order with an empty cart', async () => {
    const res = await request(app).post('/api/orders').send({
      customerName: 'Khach Vang Lai',
      phone: '0911111111',
      provinceCode: '01',
      wardCode: '00004',
      addressDetail: '123 Test Street',
      items: [],
    });

    expect(res.status).toBe(400);
  });

  it('rejects an order referencing a product id that does not exist', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Khach Vang Lai',
        phone: '0911111111',
        provinceCode: '01',
        wardCode: '00004',
        addressDetail: '123 Test Street',
        items: [{ productId: 999999999, quantity: 1 }],
      });

    expect(res.status).toBe(400);
  });

  it('links the order to the customer account when a valid customer token is sent', async () => {
    const registerRes = await request(app).post('/api/customer-auth/register').send({
      name: 'Order Owner',
      email: 'order-owner@test.local',
      password: 'password123',
      agreeTerms: true,
    });
    const token = registerRes.body.token;
    const customerId = registerRes.body.customer.id;

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Order Owner',
        phone: '0922222222',
        provinceCode: '01',
        wardCode: '00004',
        addressDetail: '456 Test Avenue',
        items: [{ productId: seededProduct.id, quantity: 1 }],
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.customerId).toBe(customerId);
  });
});
