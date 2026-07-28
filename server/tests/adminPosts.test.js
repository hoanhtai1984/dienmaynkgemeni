const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

let adminToken;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Endpoint dùng multer (uploadPost.single('image')) - gửi multipart/form-data
// qua .field() không kèm file, giống hệt cách test adminProducts xử lý upload.
// Title mặc định LUÔN kèm hậu tố ngẫu nhiên - nếu không, các test khác nhau
// không truyền title riêng sẽ tự đụng slug (slugify ra cùng 1 chuỗi), khiến
// lần tạo thứ 2 trở đi bị 400 do trùng slug dù test không cố ý kiểm tra điều đó.
let counter = 0;
function baseFields(req, overrides = {}) {
  counter += 1;
  const fields = {
    title: `Admin Posts Test Article ${Date.now()}-${counter}`,
    excerpt: 'excerpt text',
    content: 'full content',
    category: 'tin-tuc',
    ...overrides,
  };
  let r = req;
  for (const [key, value] of Object.entries(fields)) {
    r = r.field(key, String(value));
  }
  return r;
}

describe('GET /api/admin/posts', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).get('/api/admin/posts');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/posts', () => {
  it('creates a post with an auto-slugified title', async () => {
    const res = await baseFields(
      request(app).post('/api/admin/posts').set('Authorization', `Bearer ${adminToken}`),
      { title: `Tiêu Đề Có Dấu ${Date.now()}` }
    );
    expect(res.status).toBe(201);
    expect(res.body.slug).not.toMatch(/[^a-z0-9-]/);
  });

  it('rejects a duplicate slug', async () => {
    const slug = `dup-slug-${Date.now()}`;
    const first = await baseFields(
      request(app).post('/api/admin/posts').set('Authorization', `Bearer ${adminToken}`),
      { slug }
    );
    expect(first.status).toBe(201);

    const second = await baseFields(
      request(app).post('/api/admin/posts').set('Authorization', `Bearer ${adminToken}`),
      { slug, title: 'Different Title' }
    );
    expect(second.status).toBe(400);
  });
});

describe('GET /api/admin/posts/:id', () => {
  it('returns 404 for a non-existent post', async () => {
    const res = await request(app).get('/api/admin/posts/999999999').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/admin/posts/:id', () => {
  it('returns 404 for a non-existent post', async () => {
    const res = await baseFields(
      request(app).put('/api/admin/posts/999999999').set('Authorization', `Bearer ${adminToken}`)
    );
    expect(res.status).toBe(404);
  });

  it('updates fields and keeps the same slug when slug is not changed', async () => {
    const created = await baseFields(
      request(app).post('/api/admin/posts').set('Authorization', `Bearer ${adminToken}`)
    );

    const res = await baseFields(
      request(app).put(`/api/admin/posts/${created.body.id}`).set('Authorization', `Bearer ${adminToken}`),
      { title: 'Updated Title' }
    );
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
    expect(res.body.slug).toBe(created.body.slug);
  });

  it('rejects changing the slug to one already used by another post', async () => {
    const postA = await baseFields(
      request(app).post('/api/admin/posts').set('Authorization', `Bearer ${adminToken}`),
      { slug: `slug-a-${Date.now()}` }
    );
    const postB = await baseFields(
      request(app).post('/api/admin/posts').set('Authorization', `Bearer ${adminToken}`),
      { slug: `slug-b-${Date.now()}` }
    );

    const res = await baseFields(
      request(app).put(`/api/admin/posts/${postB.body.id}`).set('Authorization', `Bearer ${adminToken}`),
      { slug: postA.body.slug }
    );
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/admin/posts/:id', () => {
  it('returns 404 for a non-existent post', async () => {
    const res = await request(app).delete('/api/admin/posts/999999999').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('deletes an existing post', async () => {
    const created = await baseFields(
      request(app).post('/api/admin/posts').set('Authorization', `Bearer ${adminToken}`)
    );
    const res = await request(app).delete(`/api/admin/posts/${created.body.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);

    const after = await prisma.post.findUnique({ where: { id: created.body.id } });
    expect(after).toBeNull();
  });
});
