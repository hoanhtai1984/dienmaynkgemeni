const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

let adminToken;
let product;

// Mỗi test tạo đơn hàng RIÊNG (không dùng chung 1 đơn giữa các test) để tránh
// việc test này đổi trạng thái/kho ảnh hưởng tới test khác chạy sau nó trong
// cùng file - file test khác (orders.test.js) chạy song song trong worker
// process riêng nên không đụng chung sản phẩm/đơn này.
async function createTestOrder(quantity = 1) {
  const res = await request(app)
    .post('/api/orders')
    .send({
      customerName: 'Admin Orders Test',
      phone: '0933333333',
      provinceCode: '01',
      wardCode: '00004',
      addressDetail: '789 Test Blvd',
      items: [{ productId: product.id, quantity }],
    });
  return res.body;
}

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token;

  // Sản phẩm riêng cho file test này (không dùng chung findFirst với
  // orders.test.js) để không tranh chấp tồn kho giữa 2 file chạy song song.
  const category = await prisma.category.findFirst();
  product = await prisma.product.create({
    data: {
      name: 'Admin Orders Test Product',
      slug: `admin-orders-test-product-${Date.now()}`,
      brand: 'TestBrand',
      price: 100000,
      oldPrice: 100000,
      description: 'test',
      specs: {},
      stock: 20,
      categoryId: category.id,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/admin/orders', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).get('/api/admin/orders');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/admin/orders/:id (status transitions)', () => {
  it('rejects an invalid status value', async () => {
    const order = await createTestOrder();
    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'NOT_A_REAL_STATUS' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent order', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/999999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });
    expect(res.status).toBe(404);
  });

  it('moves PENDING -> CONFIRMED without touching stock', async () => {
    const order = await createTestOrder(2);
    const stockBefore = (await prisma.product.findUnique({ where: { id: product.id } })).stock;

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
    const stockAfter = (await prisma.product.findUnique({ where: { id: product.id } })).stock;
    expect(stockAfter).toBe(stockBefore);
  });

  it('restores stock when an order is cancelled', async () => {
    const order = await createTestOrder(3);
    const stockAfterOrder = (await prisma.product.findUnique({ where: { id: product.id } })).stock;

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    const stockAfterCancel = (await prisma.product.findUnique({ where: { id: product.id } })).stock;
    expect(stockAfterCancel).toBe(stockAfterOrder + 3);
  });

  it('re-decrements stock when a cancelled order is restored to an active status', async () => {
    const order = await createTestOrder(2);
    await request(app)
      .patch(`/api/admin/orders/${order.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED' });
    const stockAfterCancel = (await prisma.product.findUnique({ where: { id: product.id } })).stock;

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PENDING' });

    expect(res.status).toBe(200);
    const stockAfterRestore = (await prisma.product.findUnique({ where: { id: product.id } })).stock;
    expect(stockAfterRestore).toBe(stockAfterCancel - 2);
  });

  it('rejects restoring a cancelled order when stock is no longer sufficient', async () => {
    const order = await createTestOrder(5);
    await request(app)
      .patch(`/api/admin/orders/${order.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED' });

    // Bán hết sạch kho ngay sau khi hủy (mô phỏng đơn khác đã lấy hết hàng).
    await prisma.product.update({ where: { id: product.id }, data: { stock: 0 } });

    try {
      const res = await request(app)
        .patch(`/api/admin/orders/${order.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(400);
      const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });
      expect(orderAfter.status).toBe('CANCELLED');
    } finally {
      // Trả lại tồn kho cho các test chạy sau trong cùng file - không được để
      // sản phẩm dùng chung ở trạng thái hết hàng ảnh hưởng tới test khác.
      await prisma.product.update({ where: { id: product.id }, data: { stock: 20 } });
    }
  });
});

describe('PATCH /api/admin/orders/:id/payment-status', () => {
  it('rejects an invalid payment status value', async () => {
    const order = await createTestOrder();
    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}/payment-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ paymentStatus: 'REFUNDED' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent order', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/999999999/payment-status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ paymentStatus: 'PAID' });
    expect(res.status).toBe(404);
  });

  it('toggles UNPAID -> PAID', async () => {
    const order = await createTestOrder();
    expect(order.paymentStatus).toBe('UNPAID');

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}/payment-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ paymentStatus: 'PAID' });

    expect(res.status).toBe(200);
    expect(res.body.paymentStatus).toBe('PAID');
  });
});
