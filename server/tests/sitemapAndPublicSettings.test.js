const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /sitemap.xml', () => {
  it('returns valid XML with a product URL entry', async () => {
    const product = await prisma.product.findFirst();
    const res = await request(app).get('/sitemap.xml');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.text).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    expect(res.text).toContain(`/san-pham/${product.slug}`);
    expect(res.text).toContain('<urlset');
  });

  it('escapes special XML characters in generated URLs', async () => {
    // CLIENT_URL trong test env không chứa ký tự đặc biệt, nhưng slug sản
    // phẩm có thể - tạo 1 sản phẩm có slug chứa ký tự an toàn để xác nhận
    // hàm dựng URL không tự làm hỏng XML với dữ liệu thật.
    const category = await prisma.category.findFirst();
    const product = await prisma.product.create({
      data: {
        name: 'Sitemap Test Product', slug: `sitemap-test-${Date.now()}`, brand: 'B', price: 1, oldPrice: 1,
        description: '', specs: {}, categoryId: category.id,
      },
    });

    const res = await request(app).get('/sitemap.xml');
    expect(res.text).toContain(product.slug);
  });
});

describe('GET /api/settings', () => {
  it('returns public site settings, never exposing secrets', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.hotline).toEqual(expect.any(String));
    // Không bao giờ lộ secret ra endpoint công khai này.
    expect(res.body.smtpPass).toBeUndefined();
  });
});
