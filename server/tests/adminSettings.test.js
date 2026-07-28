const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

let adminToken;
let adminId;
let originalSettings;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token;
  adminId = loginRes.body.admin.id;
  // SiteSettings là singleton dùng chung toàn site - phải chụp lại giá trị
  // gốc để khôi phục đúng sau khi test xong, nếu không các field đã sửa (vd
  // shippingFlatFee) sẽ rò rỉ sang orders.test.js chạy sau trong cùng lần
  // test suite (đã từng gây fail total đơn hàng do shippingFlatFee còn sót
  // lại từ lần chạy test này).
  originalSettings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
});

// requireAdmin đọc role trực tiếp từ DB ở mỗi request (không phải từ JWT
// payload) nên đổi role giữa chừng test có hiệu lực ngay, không cần đăng
// nhập lại - xem server/src/middleware/requireAdmin.js.
afterAll(async () => {
  // Trả admin seed về đúng role mặc định (STAFF) để không ảnh hưởng tới các
  // file test khác chạy sau (suite chạy --runInBand, tuần tự, nhưng vẫn nên
  // dọn dẹp trạng thái global này để mỗi file tự chịu trách nhiệm).
  await prisma.admin.update({ where: { id: adminId }, data: { role: 'STAFF' } });
  await prisma.siteSettings.update({
    where: { id: 1 },
    data: {
      hotline: originalSettings.hotline,
      companyName: originalSettings.companyName,
      shippingFlatFee: originalSettings.shippingFlatFee,
      freeShippingThreshold: originalSettings.freeShippingThreshold,
    },
  });
  await prisma.$disconnect();
});

describe('PUT /api/admin/settings (role gating)', () => {
  it('rejects a STAFF admin with 403', async () => {
    await prisma.admin.update({ where: { id: adminId }, data: { role: 'STAFF' } });

    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ hotline: '0900000000' });
    expect(res.status).toBe(403);
  });

  it('allows a MANAGER admin through', async () => {
    await prisma.admin.update({ where: { id: adminId }, data: { role: 'MANAGER' } });

    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ hotline: '0900000001' });
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/admin/settings (partial update safety)', () => {
  beforeAll(async () => {
    await prisma.admin.update({ where: { id: adminId }, data: { role: 'MANAGER' } });
  });

  it('rejects an empty value for a required field', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ hotline: '' });
    expect(res.status).toBe(400);
  });

  it('updating one field does not wipe fields from a different settings section', async () => {
    // Trang "Cài đặt chung" gửi companyName; trang khác (vd core features)
    // không gửi field này - phải giữ nguyên giá trị đã lưu trước đó.
    await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyName: 'Cong Ty Test ABC' });

    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ hotline: '0900000002' });

    expect(res.status).toBe(200);
    expect(res.body.hotline).toBe('0900000002');
    expect(res.body.companyName).toBe('Cong Ty Test ABC');
  });

  it('persists numeric shipping fields sent as partial update', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ shippingFlatFee: 25000, freeShippingThreshold: 300000 });

    expect(res.status).toBe(200);
    expect(res.body.shippingFlatFee).toBe(25000);
    expect(res.body.freeShippingThreshold).toBe(300000);
  });

  it('clears freeShippingThreshold back to null when sent as an empty string', async () => {
    await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ freeShippingThreshold: 300000 });

    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ freeShippingThreshold: '' });

    expect(res.status).toBe(200);
    expect(res.body.freeShippingThreshold).toBeNull();
  });
});
