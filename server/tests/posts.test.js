const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

let post;

beforeAll(async () => {
  post = await prisma.post.create({
    data: {
      slug: `public-posts-test-${Date.now()}`,
      title: 'Public Posts Test Article',
      excerpt: 'excerpt',
      content: 'full content here',
      category: 'tin-tuc',
      publishedAt: new Date(),
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/posts', () => {
  it('returns posts including the one just created', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(res.body.items.some((p) => p.slug === post.slug)).toBe(true);
  });

  it('respects the limit query param', async () => {
    const res = await request(app).get('/api/posts').query({ limit: 2 });
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(2);
  });
});

describe('GET /api/posts/:slug', () => {
  it('returns the post by slug', async () => {
    const res = await request(app).get(`/api/posts/${post.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Public Posts Test Article');
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await request(app).get('/api/posts/this-slug-does-not-exist-at-all');
    expect(res.status).toBe(404);
  });
});
