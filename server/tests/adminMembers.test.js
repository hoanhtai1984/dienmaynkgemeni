const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

let ownerToken;
let ownerId;
let counter = 0;

function uniqueEmail() {
  counter += 1;
  return `admin-members-test-${Date.now()}-${counter}@test.local`;
}

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  ownerToken = loginRes.body.token;
  ownerId = loginRes.body.admin.id;
  // requireRole đọc role trực tiếp từ DB mỗi request (xem requireAdmin.js) -
  // đổi role giữa chừng có hiệu lực ngay, không cần đăng nhập lại.
  await prisma.admin.update({ where: { id: ownerId }, data: { role: 'OWNER' } });
});

afterAll(async () => {
  await prisma.admin.update({ where: { id: ownerId }, data: { role: 'STAFF' } });
  await prisma.$disconnect();
});

describe('role gating (OWNER only)', () => {
  it('rejects a MANAGER admin with 403', async () => {
    await prisma.admin.update({ where: { id: ownerId }, data: { role: 'MANAGER' } });
    const res = await request(app).get('/api/admin/members').set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(403);
    await prisma.admin.update({ where: { id: ownerId }, data: { role: 'OWNER' } });
  });
});

describe('POST /api/admin/members', () => {
  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/admin/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: uniqueEmail(), name: 'No Role' });
    expect(res.status).toBe(400);
  });

  it('rejects creating a member with role OWNER', async () => {
    const res = await request(app)
      .post('/api/admin/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: uniqueEmail(), name: 'Wannabe Owner', role: 'OWNER' });
    expect(res.status).toBe(400);
  });

  it('creates a STAFF member and auto-generates a strong password when omitted', async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post('/api/admin/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email, name: 'Auto Password Staff', role: 'STAFF' });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('STAFF');
    expect(typeof res.body.password).toBe('string');
    expect(res.body.password.length).toBeGreaterThanOrEqual(12);
  });

  it('creates a MANAGER member with a custom strong password and does not echo it back', async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post('/api/admin/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email, name: 'Custom Password Manager', role: 'MANAGER', password: 'StrongPass123!' });

    expect(res.status).toBe(201);
    expect(res.body.password).toBeUndefined();
  });

  it('rejects a weak custom password', async () => {
    const res = await request(app)
      .post('/api/admin/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: uniqueEmail(), name: 'Weak Password', role: 'STAFF', password: '123456' });
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    const email = uniqueEmail();
    await request(app)
      .post('/api/admin/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email, name: 'First', role: 'STAFF' });

    const res = await request(app)
      .post('/api/admin/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email, name: 'Second', role: 'STAFF' });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/admin/members/:id', () => {
  it('rejects deleting yourself', async () => {
    const res = await request(app)
      .delete(`/api/admin/members/${ownerId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(400);
  });

  it('rejects deleting an OWNER account', async () => {
    const otherOwner = await prisma.admin.create({
      data: { email: uniqueEmail(), name: 'Other Owner', password: 'irrelevant-hash', role: 'OWNER' },
    });
    const res = await request(app)
      .delete(`/api/admin/members/${otherOwner.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(400);
  });

  it('deletes a STAFF/MANAGER member successfully', async () => {
    const created = await request(app)
      .post('/api/admin/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: uniqueEmail(), name: 'To Be Deleted', role: 'STAFF' });

    const res = await request(app)
      .delete(`/api/admin/members/${created.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(204);

    const after = await prisma.admin.findUnique({ where: { id: created.body.id } });
    expect(after).toBeNull();
  });
});

describe('POST /api/admin/members/:id/reset-password', () => {
  it('auto-generates a new password when body is empty and revokes old sessions', async () => {
    const created = await request(app)
      .post('/api/admin/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: uniqueEmail(), name: 'Reset Target', role: 'STAFF' });
    const before = await prisma.admin.findUnique({ where: { id: created.body.id } });

    const res = await request(app)
      .post(`/api/admin/members/${created.body.id}/reset-password`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(typeof res.body.password).toBe('string');

    const after = await prisma.admin.findUnique({ where: { id: created.body.id } });
    expect(after.tokenVersion).toBe(before.tokenVersion + 1);
  });

  it('rejects a weak custom password on reset', async () => {
    const created = await request(app)
      .post('/api/admin/members')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: uniqueEmail(), name: 'Weak Reset Target', role: 'STAFF' });

    const res = await request(app)
      .post(`/api/admin/members/${created.body.id}/reset-password`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ password: 'weak' });
    expect(res.status).toBe(400);
  });
});
