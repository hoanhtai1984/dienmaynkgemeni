const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

let category;
let searchProduct;

beforeAll(async () => {
  category = await prisma.category.findFirst({ include: { subCategories: true } });
  const suffix = `${Date.now()}-${Math.random()}`;
  searchProduct = await prisma.product.create({
    data: {
      name: `Zzyx Uniquely Searchable Blender ${suffix}`,
      slug: `zzyx-uniquely-searchable-blender-${suffix}`,
      brand: 'ZzyxSearchBrand',
      price: 100000,
      oldPrice: 100000,
      description: 'test',
      specs: {},
      categoryId: category.id,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/search', () => {
  it('returns an empty array for a blank query', async () => {
    const res = await request(app).get('/api/search').query({ q: '' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('matches by product name substring', async () => {
    const res = await request(app).get('/api/search').query({ q: 'Zzyx Uniquely Searchable' });
    expect(res.status).toBe(200);
    expect(res.body.some((p) => p.id === searchProduct.id)).toBe(true);
  });

  it('matches by brand substring', async () => {
    const res = await request(app).get('/api/search').query({ q: 'ZzyxSearchBrand' });
    expect(res.body.some((p) => p.id === searchProduct.id)).toBe(true);
  });

  it('returns no results for a nonsense query', async () => {
    const res = await request(app).get('/api/search').query({ q: 'qwertyuiop-nonexistent-zzz-999' });
    expect(res.body).toEqual([]);
  });

  it('caps the result count at 20 even if a larger limit is requested', async () => {
    const res = await request(app).get('/api/search').query({ q: 'a', limit: 500 });
    expect(res.body.length).toBeLessThanOrEqual(20);
  });
});

describe('GET /api/categories', () => {
  it('returns categories with nested subCategories/subSubCategories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const found = res.body.find((c) => c.id === category.id);
    expect(found).toBeDefined();
    expect(Array.isArray(found.subCategories)).toBe(true);
  });
});

describe('GET /api/categories/:slug/brands', () => {
  it('returns a distinct, alphabetically sorted brand list scoped to the category', async () => {
    const res = await request(app).get(`/api/categories/${category.slug}/brands`);
    expect(res.status).toBe(200);
    expect(res.body).toContain('ZzyxSearchBrand');
    const sorted = [...res.body].sort();
    expect(res.body).toEqual(sorted);
    // Không lẫn duplicate.
    expect(new Set(res.body).size).toBe(res.body.length);
  });

  it('returns brands across all categories when slug is "all"', async () => {
    const res = await request(app).get('/api/categories/all/brands');
    expect(res.status).toBe(200);
    expect(res.body).toContain('ZzyxSearchBrand');
  });

  it('returns an empty list for a category slug with no products', async () => {
    const emptyCategory = await prisma.category.create({
      data: { slug: `empty-cat-${Date.now()}`, name: 'Empty Test Category', icon: 'bi-box', position: 999 },
    });
    const res = await request(app).get(`/api/categories/${emptyCategory.slug}/brands`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
