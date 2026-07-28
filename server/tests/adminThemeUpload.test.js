const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

const uploadedFiles = [];

let adminToken;
let adminId;

// PNG 1x1 tối giản hợp lệ - đủ để sharp (dùng trong convertToWebp) xử lý
// thật, không phải mock.
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token;
  adminId = loginRes.body.admin.id;
  await prisma.admin.update({ where: { id: adminId }, data: { role: 'MANAGER' } });
});

afterAll(async () => {
  await prisma.admin.update({ where: { id: adminId }, data: { role: 'STAFF' } });
  // Test upload thật ghi file .webp thật ra đĩa (không mock) - dọn lại để
  // không để rác trong uploads/theme/ sau mỗi lần chạy test.
  for (const filename of uploadedFiles) {
    fs.unlink(path.join(__dirname, '../uploads/theme', filename), () => {});
  }
  await prisma.$disconnect();
});

describe('POST /api/admin/settings/theme-upload', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).post('/api/admin/settings/theme-upload');
    expect(res.status).toBe(401);
  });

  it('rejects a request with no file attached', async () => {
    const res = await request(app)
      .post('/api/admin/settings/theme-upload')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it('uploads an image and converts it to webp', async () => {
    const res = await request(app)
      .post('/api/admin/settings/theme-upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', MINIMAL_PNG, 'test.png');

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\/theme\/.+\.webp$/);
    uploadedFiles.push(res.body.url.replace('/uploads/theme/', ''));
  });
});
