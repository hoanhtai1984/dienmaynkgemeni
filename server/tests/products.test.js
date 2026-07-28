const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

let category;
let otherCategory;
let cheapProduct;
let expensiveProduct;

beforeAll(async () => {
  const categories = await prisma.category.findMany({ take: 2 });
  category = categories[0];
  otherCategory = categories[1];

  const suffix = `${Date.now()}-${Math.random()}`;
  cheapProduct = await prisma.product.create({
    data: {
      name: `Filter Test Cheap Item ${suffix}`,
      slug: `filter-test-cheap-item-${suffix}`,
      brand: 'UniqueBrandCheap',
      price: 50000,
      oldPrice: 100000,
      description: 'test',
      specs: {},
      categoryId: category.id,
    },
  });
  expensiveProduct = await prisma.product.create({
    data: {
      name: `Filter Test Expensive Item ${suffix}`,
      slug: `filter-test-expensive-item-${suffix}`,
      brand: 'UniqueBrandExpensive',
      price: 5000000,
      oldPrice: 5000000,
      description: 'test',
      specs: {},
      categoryId: otherCategory.id,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/products', () => {
  it('returns the full catalog with pagination metadata when no limit is given', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.totalPages).toBe(1);
    expect(res.body.pageSize).toBe(res.body.total);
    expect(res.body.items.length).toBe(res.body.total);
  });

  it('respects limit/page for pagination', async () => {
    const res = await request(app).get('/api/products').query({ limit: 3, page: 1 });
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(3);
    expect(res.body.pageSize).toBe(3);
    expect(res.body.totalPages).toBe(Math.ceil(res.body.total / 3));
  });

  it('filters by category slug', async () => {
    const res = await request(app).get('/api/products').query({ category: category.slug, limit: 100 });
    expect(res.status).toBe(200);
    expect(res.body.items.every((p) => p.category === category.slug)).toBe(true);
    expect(res.body.items.some((p) => p.id === cheapProduct.id)).toBe(true);
  });

  it('filters by brand list', async () => {
    const res = await request(app).get('/api/products').query({ brands: 'UniqueBrandCheap,UniqueBrandExpensive' });
    expect(res.status).toBe(200);
    const ids = res.body.items.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining([cheapProduct.id, expensiveProduct.id]));
    expect(res.body.items.every((p) => ['UniqueBrandCheap', 'UniqueBrandExpensive'].includes(p.brand))).toBe(true);
  });

  it('filters by price range', async () => {
    const res = await request(app).get('/api/products').query({ minPrice: 4000000, maxPrice: 6000000 });
    expect(res.status).toBe(200);
    expect(res.body.items.some((p) => p.id === expensiveProduct.id)).toBe(true);
    expect(res.body.items.some((p) => p.id === cheapProduct.id)).toBe(false);
    expect(res.body.items.every((p) => p.price >= 4000000 && p.price <= 6000000)).toBe(true);
  });

  it('sorts by price-asc', async () => {
    const res = await request(app).get('/api/products').query({ sortBy: 'price-asc', limit: 200 });
    const prices = res.body.items.map((p) => p.price);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  it('searches by name/brand substring (q)', async () => {
    const res = await request(app).get('/api/products').query({ q: 'UniqueBrandCheap' });
    expect(res.status).toBe(200);
    expect(res.body.items.some((p) => p.id === cheapProduct.id)).toBe(true);
  });

  it('computes discount percentage from oldPrice vs price', async () => {
    const res = await request(app).get('/api/products/' + cheapProduct.id);
    expect(res.body.discount).toBe(50); // 100000 -> 50000 = 50% off
  });
});

describe('GET /api/products/:id', () => {
  it('resolves a product by bare numeric id', async () => {
    const res = await request(app).get(`/api/products/${cheapProduct.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(cheapProduct.id);
  });

  it('resolves a product by "slug-<id>" URL form even with a stale slug prefix', async () => {
    const res = await request(app).get(`/api/products/nonsense-old-slug-${cheapProduct.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(cheapProduct.id);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/api/products/999999999');
    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-numeric param', async () => {
    const res = await request(app).get('/api/products/not-a-number-at-all');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/products/:id/recommendations', () => {
  it('returns an empty array when no recommendation row exists', async () => {
    const res = await request(app).get(`/api/products/${cheapProduct.id}/recommendations`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns recommended products in the stored order', async () => {
    await prisma.productRecommendation.create({
      data: { sourceProductId: cheapProduct.id, recommendedIds: [expensiveProduct.id] },
    });

    const res = await request(app).get(`/api/products/${cheapProduct.id}/recommendations`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(expensiveProduct.id);
  });
});
