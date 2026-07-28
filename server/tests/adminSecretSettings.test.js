const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

let adminToken;
let adminId;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token;
  adminId = loginRes.body.admin.id;
  // /api/admin/settings/* (mail, oauth) yêu cầu OWNER/MANAGER - đọc role trực
  // tiếp từ DB mỗi request nên đổi giữa chừng có hiệu lực ngay, không cần
  // đăng nhập lại (xem requireAdmin.js).
  await prisma.admin.update({ where: { id: adminId }, data: { role: 'MANAGER' } });
});

afterAll(async () => {
  await prisma.admin.update({ where: { id: adminId }, data: { role: 'STAFF' } });
  await prisma.$disconnect();
});

describe('mail settings (/api/admin/settings/mail)', () => {
  it('rejects a STAFF admin with 403', async () => {
    await prisma.admin.update({ where: { id: adminId }, data: { role: 'STAFF' } });
    const res = await request(app).get('/api/admin/settings/mail').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
    await prisma.admin.update({ where: { id: adminId }, data: { role: 'MANAGER' } });
  });

  it('never returns the raw SMTP password, only a smtpPassSet flag', async () => {
    const res = await request(app)
      .put('/api/admin/settings/mail')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ smtpHost: 'smtp.test.local', smtpPort: 587, smtpUser: 'user@test.local', smtpPass: 'super-secret-password' });

    expect(res.status).toBe(200);
    expect(res.body.smtpPass).toBeUndefined();
    expect(res.body.smtpPassSet).toBe(true);

    const getRes = await request(app).get('/api/admin/settings/mail').set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.body.smtpPassSet).toBe(true);
    expect(getRes.body.smtpPass).toBeUndefined();
  });

  it('preserves the existing password when the field is left blank on update', async () => {
    await request(app)
      .put('/api/admin/settings/mail')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ smtpHost: 'smtp.test.local', smtpPass: 'first-password' });

    const before = await prisma.mailSettings.findUnique({ where: { id: 1 } });

    await request(app)
      .put('/api/admin/settings/mail')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ smtpHost: 'smtp2.test.local', smtpPass: '' });

    const after = await prisma.mailSettings.findUnique({ where: { id: 1 } });
    expect(after.smtpPass).toBe(before.smtpPass); // vẫn là mật khẩu (đã mã hoá) cũ, không bị xoá
    expect(after.smtpHost).toBe('smtp2.test.local');
  });
});
