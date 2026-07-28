const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

let adminToken;
let category;
let customerCounter = 0;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token;
  category = await prisma.category.findFirst();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function makeProduct() {
  return prisma.product.create({
    data: {
      name: 'Admin Reviews Test Product',
      slug: `admin-reviews-test-product-${Date.now()}-${Math.random()}`,
      brand: 'TestBrand',
      price: 100000,
      oldPrice: 100000,
      description: 'test',
      specs: {},
      stock: 10,
      categoryId: category.id,
    },
  });
}

async function makeCustomer() {
  customerCounter += 1;
  const hashed = await bcrypt.hash('password123', 10);
  return prisma.customer.create({
    data: { name: `Reviewer ${customerCounter}`, email: `reviewer-${Date.now()}-${customerCounter}@test.local`, password: hashed },
  });
}

async function makeReview(productId, customerId, rating, approved = false) {
  return prisma.review.create({ data: { productId, customerId, rating, comment: 'test comment', approved } });
}

describe('GET /api/admin/reviews', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).get('/api/admin/reviews');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/admin/reviews/:id (approve/reject)', () => {
  it('rejects a non-boolean approved value', async () => {
    const product = await makeProduct();
    const customer = await makeCustomer();
    const review = await makeReview(product.id, customer.id, 5);

    const res = await request(app)
      .patch(`/api/admin/reviews/${review.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: 'yes' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent review', async () => {
    const res = await request(app)
      .patch('/api/admin/reviews/999999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: true });
    expect(res.status).toBe(404);
  });

  it('approving a review recomputes Product.rating/reviewCount', async () => {
    const product = await makeProduct();
    const customer = await makeCustomer();
    const review = await makeReview(product.id, customer.id, 4);

    const res = await request(app)
      .patch(`/api/admin/reviews/${review.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: true });

    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(true);

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct.rating).toBe(4);
    expect(updatedProduct.reviewCount).toBe(1);
  });

  it('averages rating correctly across multiple approved reviews', async () => {
    const product = await makeProduct();
    const c1 = await makeCustomer();
    const c2 = await makeCustomer();
    const r1 = await makeReview(product.id, c1.id, 5);
    const r2 = await makeReview(product.id, c2.id, 3);

    await request(app).patch(`/api/admin/reviews/${r1.id}`).set('Authorization', `Bearer ${adminToken}`).send({ approved: true });
    await request(app).patch(`/api/admin/reviews/${r2.id}`).set('Authorization', `Bearer ${adminToken}`).send({ approved: true });

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct.rating).toBe(4); // (5 + 3) / 2
    expect(updatedProduct.reviewCount).toBe(2);
  });

  it('un-approving a review removes it from the rating average', async () => {
    const product = await makeProduct();
    const customer = await makeCustomer();
    const review = await makeReview(product.id, customer.id, 2, true);
    // approved=true đã set trực tiếp qua Prisma, nhưng Product.rating chưa
    // được tính lại cho tới khi đi qua endpoint - gọi 1 lần để đồng bộ trước.
    await request(app).patch(`/api/admin/reviews/${review.id}`).set('Authorization', `Bearer ${adminToken}`).send({ approved: true });

    const res = await request(app)
      .patch(`/api/admin/reviews/${review.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: false });

    expect(res.status).toBe(200);
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct.rating).toBe(0);
    expect(updatedProduct.reviewCount).toBe(0);
  });
});

describe('DELETE /api/admin/reviews/:id', () => {
  it('returns 404 for a non-existent review', async () => {
    const res = await request(app)
      .delete('/api/admin/reviews/999999999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('deletes a review and recomputes the product rating', async () => {
    const product = await makeProduct();
    const customer = await makeCustomer();
    const review = await makeReview(product.id, customer.id, 5, true);
    await prisma.product.update({ where: { id: product.id }, data: { rating: 5, reviewCount: 1 } });

    const res = await request(app)
      .delete(`/api/admin/reviews/${review.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const deletedReview = await prisma.review.findUnique({ where: { id: review.id } });
    expect(deletedReview).toBeNull();

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct.rating).toBe(0);
    expect(updatedProduct.reviewCount).toBe(0);
  });
});
