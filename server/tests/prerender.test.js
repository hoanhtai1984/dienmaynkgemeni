const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

let category;

beforeAll(async () => {
  category = await prisma.category.findFirst();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /prerender/san-pham/:slug', () => {
  it('returns 404 for a non-existent product id', async () => {
    const res = await request(app).get('/prerender/san-pham/nonexistent-999999999');
    expect(res.status).toBe(404);
  });

  it('renders og:*/JSON-LD metadata for a real product, and sets X-Robots-Tag: noindex', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Prerender Test Product', slug: `prerender-test-${Date.now()}`, brand: 'B', price: 123000, oldPrice: 123000,
        description: 'A description for prerender testing.', specs: {}, categoryId: category.id, stock: 5,
      },
    });

    // extractProductId() đọc dãy số CUỐI url làm id thật (xem slugify.js) -
    // slug đặt tùy ý ở đây không tận cùng bằng id thật, nên phải test bằng
    // chính product.id (dạng URL cũ/bare-id vẫn phải tra đúng).
    const res = await request(app).get(`/prerender/san-pham/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.headers['x-robots-tag']).toBe('noindex');
    expect(res.text).toContain('Prerender Test Product');
    expect(res.text).toContain('og:title');
    expect(res.text).toContain('application/ld+json');
    expect(res.text).toContain('"@type":"Product"');
  });

  it('HTML-escapes a product name containing markup, preventing injection', async () => {
    const product = await prisma.product.create({
      data: {
        name: '<script>alert(1)</script> XSS Test', slug: `prerender-xss-test-${Date.now()}`, brand: 'B', price: 1, oldPrice: 1,
        description: 'desc', specs: {}, categoryId: category.id,
      },
    });

    // extractProductId() đọc dãy số CUỐI url làm id thật (xem slugify.js) -
    // slug đặt tùy ý ở đây không tận cùng bằng id thật, nên phải test bằng
    // chính product.id (dạng URL cũ/bare-id vẫn phải tra đúng).
    const res = await request(app).get(`/prerender/san-pham/${product.id}`);
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('<script>alert(1)</script>');
    expect(res.text).toContain('&lt;script&gt;');
  });
});

describe('GET /prerender/tin-tuc/:slug', () => {
  it('returns 404 for a non-existent post slug', async () => {
    const res = await request(app).get('/prerender/tin-tuc/nonexistent-slug-xyz');
    expect(res.status).toBe(404);
  });

  it('renders metadata for a real post', async () => {
    const post = await prisma.post.create({
      data: {
        slug: `prerender-post-test-${Date.now()}`,
        title: 'Prerender Post Test Title',
        excerpt: 'excerpt text',
        content: 'content',
        category: 'tin-tuc',
        publishedAt: new Date(),
      },
    });

    const res = await request(app).get(`/prerender/tin-tuc/${post.slug}`);
    expect(res.status).toBe(200);
    expect(res.headers['x-robots-tag']).toBe('noindex');
    expect(res.text).toContain('Prerender Post Test Title');
    expect(res.text).toContain('application/ld+json');
    expect(res.text).toContain('"@type":"Article"');
  });
});
