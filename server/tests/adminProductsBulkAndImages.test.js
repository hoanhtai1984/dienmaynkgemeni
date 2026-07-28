const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

let adminToken;
let category;
let subCategoryWithSubSub;
let subSubCategory;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token;

  category = await prisma.category.findFirst({ include: { subCategories: { include: { subSubCategories: true } } } });
  subCategoryWithSubSub = category.subCategories.find((s) => s.subSubCategories.length > 0);
  if (subCategoryWithSubSub) subSubCategory = subCategoryWithSubSub.subSubCategories[0];
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/admin/products/bulk', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).post('/api/admin/products/bulk').send({ rows: [] });
    expect(res.status).toBe(401);
  });

  it('rejects an empty rows array', async () => {
    const res = await request(app)
      .post('/api/admin/products/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rows: [] });
    expect(res.status).toBe(400);
  });

  it('reports a row-level error for a missing required field, without failing the whole request', async () => {
    const res = await request(app)
      .post('/api/admin/products/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rows: [{ name: 'No Brand Or Price', categoryName: category.name }] });

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].success).toBe(false);
    expect(res.body.results[0].row).toBe(2); // dòng 1 là header
  });

  it('reports a row-level error for an unknown category name', async () => {
    const res = await request(app)
      .post('/api/admin/products/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rows: [{ name: 'X', brand: 'Y', price: 10000, categoryName: 'Danh Mục Không Tồn Tại XYZ' }] });

    expect(res.body.results[0].success).toBe(false);
    expect(res.body.results[0].error).toMatch(/Không tìm thấy danh mục/);
  });

  it('creates a product for a valid row using only the top-level category', async () => {
    const res = await request(app)
      .post('/api/admin/products/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rows: [{ name: 'Bulk Import Test Product', brand: 'TestBrand', price: 50000, categoryName: category.name }] });

    expect(res.body.results[0].success).toBe(true);
    const created = await prisma.product.findUnique({ where: { id: res.body.results[0].id } });
    expect(created).not.toBeNull();
    expect(created.categoryId).toBe(category.id);
    expect(created.subCategoryId).toBeNull();
  });

  it('resolves category/subCategory/subSubCategory names case-insensitively', async () => {
    if (!subSubCategory) return; // môi trường seed không có cấp 2, bỏ qua an toàn

    const res = await request(app)
      .post('/api/admin/products/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        rows: [
          {
            name: 'Bulk Import Sub-Sub Product',
            brand: 'TestBrand',
            price: 60000,
            categoryName: category.name.toUpperCase(),
            subCategoryName: subCategoryWithSubSub.name.toLowerCase(),
            subSubCategoryName: subSubCategory.name,
          },
        ],
      });

    expect(res.body.results[0].success).toBe(true);
    const created = await prisma.product.findUnique({ where: { id: res.body.results[0].id } });
    expect(created.subCategoryId).toBe(subCategoryWithSubSub.id);
    expect(created.subSubCategoryId).toBe(subSubCategory.id);
  });

  it('processes multiple rows independently - one bad row does not block the others', async () => {
    const res = await request(app)
      .post('/api/admin/products/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        rows: [
          { name: 'Good Row', brand: 'B', price: 10000, categoryName: category.name },
          { name: 'Bad Row - unknown category', brand: 'B', price: 10000, categoryName: 'Nope' },
        ],
      });

    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0].success).toBe(true);
    expect(res.body.results[1].success).toBe(false);
  });
});

describe('DELETE /api/admin/products/:id/images/:imageId', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).delete('/api/admin/products/1/images/1');
    expect(res.status).toBe(401);
  });

  it('returns 404 for an image that does not exist', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Image Test Product',
        slug: `image-test-product-${Date.now()}`,
        brand: 'TestBrand',
        price: 10000,
        oldPrice: 10000,
        description: '',
        specs: {},
        categoryId: category.id,
      },
    });

    const res = await request(app)
      .delete(`/api/admin/products/${product.id}/images/999999999`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 when the image belongs to a different product', async () => {
    const productA = await prisma.product.create({
      data: {
        name: 'Product A', slug: `product-a-${Date.now()}`, brand: 'B', price: 1, oldPrice: 1,
        description: '', specs: {}, categoryId: category.id,
      },
    });
    const productB = await prisma.product.create({
      data: {
        name: 'Product B', slug: `product-b-${Date.now()}`, brand: 'B', price: 1, oldPrice: 1,
        description: '', specs: {}, categoryId: category.id,
      },
    });
    const image = await prisma.productImage.create({ data: { url: '/uploads/products/fake.webp', productId: productA.id } });

    const res = await request(app)
      .delete(`/api/admin/products/${productB.id}/images/${image.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('deletes an existing image belonging to the given product', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Image Owner Product', slug: `image-owner-${Date.now()}`, brand: 'B', price: 1, oldPrice: 1,
        description: '', specs: {}, categoryId: category.id,
      },
    });
    const image = await prisma.productImage.create({ data: { url: '/uploads/products/fake2.webp', productId: product.id } });

    const res = await request(app)
      .delete(`/api/admin/products/${product.id}/images/${image.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);

    const after = await prisma.productImage.findUnique({ where: { id: image.id } });
    expect(after).toBeNull();
  });
});
