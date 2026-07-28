const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

let adminToken;
let category;
let counter = 0;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token;
  category = await prisma.category.findFirst();
});

afterAll(async () => {
  await prisma.$disconnect();
});

function uniqueSku() {
  counter += 1;
  return `TESTSKU-${Date.now()}-${counter}`;
}

// Endpoint dùng multer (upload.array('images', 8)) nên phải gửi
// multipart/form-data qua .field() - không đính kèm file nào cả (multer chấp
// nhận 0 file, convertToWebp cũng no-op khi req.files rỗng), đủ để test logic
// tạo/sửa sản phẩm mà không cần xử lý ảnh thật.
function baseFields(req, overrides = {}) {
  const fields = {
    name: 'Admin Products Test Item',
    brand: 'TestBrand',
    price: 150000,
    categoryId: category.id,
    ...overrides,
  };
  let r = req;
  for (const [key, value] of Object.entries(fields)) {
    r = r.field(key, String(value));
  }
  return r;
}

describe('GET /api/admin/products', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).get('/api/admin/products');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/products', () => {
  it('creates a product and auto-generates a slug ending in its id', async () => {
    const res = await baseFields(
      request(app).post('/api/admin/products').set('Authorization', `Bearer ${adminToken}`)
    );

    expect(res.status).toBe(201);
    expect(res.body.slug.endsWith(`-${res.body.id}`)).toBe(true);
    expect(res.body.images).toEqual([]);
  });

  it('defaults oldPrice to price when not provided', async () => {
    const res = await baseFields(
      request(app).post('/api/admin/products').set('Authorization', `Bearer ${adminToken}`),
      { price: 200000 }
    );
    expect(res.status).toBe(201);
    expect(res.body.oldPrice).toBe(200000);
  });

  it('rejects a duplicate SKU with a friendly 400 error', async () => {
    const sku = uniqueSku();
    const first = await baseFields(
      request(app).post('/api/admin/products').set('Authorization', `Bearer ${adminToken}`),
      { sku }
    );
    expect(first.status).toBe(201);

    const second = await baseFields(
      request(app).post('/api/admin/products').set('Authorization', `Bearer ${adminToken}`),
      { sku }
    );
    expect(second.status).toBe(400);
  });
});

describe('PUT /api/admin/products/:id', () => {
  it('returns 404 for a non-existent product', async () => {
    const res = await baseFields(
      request(app).put('/api/admin/products/999999999').set('Authorization', `Bearer ${adminToken}`)
    );
    expect(res.status).toBe(404);
  });

  it('updates fields and regenerates the slug from the new name, keeping the same id suffix', async () => {
    const created = await baseFields(
      request(app).post('/api/admin/products').set('Authorization', `Bearer ${adminToken}`)
    );

    const res = await baseFields(
      request(app).put(`/api/admin/products/${created.body.id}`).set('Authorization', `Bearer ${adminToken}`),
      { name: 'Renamed Product Name', price: 175000 }
    );

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed Product Name');
    expect(res.body.price).toBe(175000);
    expect(res.body.slug.endsWith(`-${created.body.id}`)).toBe(true);
  });

  it('does not reset rating/reviewCount when a product is edited (computed from Review table, not admin-editable)', async () => {
    const created = await baseFields(
      request(app).post('/api/admin/products').set('Authorization', `Bearer ${adminToken}`)
    );
    await prisma.product.update({ where: { id: created.body.id }, data: { rating: 4.5, reviewCount: 7 } });

    const res = await baseFields(
      request(app).put(`/api/admin/products/${created.body.id}`).set('Authorization', `Bearer ${adminToken}`),
      { price: 999000 }
    );

    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4.5);
    expect(res.body.reviewCount).toBe(7);
  });
});

describe('DELETE /api/admin/products/:id', () => {
  it('returns 404 for a non-existent product', async () => {
    const res = await request(app).delete('/api/admin/products/999999999').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('deletes an existing product', async () => {
    const created = await baseFields(
      request(app).post('/api/admin/products').set('Authorization', `Bearer ${adminToken}`)
    );

    const res = await request(app).delete(`/api/admin/products/${created.body.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);

    const after = await prisma.product.findUnique({ where: { id: created.body.id } });
    expect(after).toBeNull();
  });
});
