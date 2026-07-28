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

describe('GET /api/admin/contacts', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).get('/api/admin/contacts');
    expect(res.status).toBe(401);
  });

  it('filters by status', async () => {
    const newMsg = await prisma.contactMessage.create({
      data: { name: 'New Msg', phone: '0900000010', subject: 'KHAC', message: 'x', status: 'NEW' },
    });
    const resolvedMsg = await prisma.contactMessage.create({
      data: { name: 'Resolved Msg', phone: '0900000011', subject: 'KHAC', message: 'x', status: 'RESOLVED' },
    });

    const res = await request(app).get('/api/admin/contacts').query({ status: 'NEW' }).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.items.map((m) => m.id);
    expect(ids).toContain(newMsg.id);
    expect(ids).not.toContain(resolvedMsg.id);
  });
});

describe('PATCH /api/admin/contacts/:id', () => {
  it('rejects an invalid status value', async () => {
    const msg = await prisma.contactMessage.create({
      data: { name: 'X', phone: '0900000012', subject: 'KHAC', message: 'x' },
    });
    const res = await request(app)
      .patch(`/api/admin/contacts/${msg.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ARCHIVED_NOT_REAL' });
    expect(res.status).toBe(400);
  });

  it('updates the status', async () => {
    const msg = await prisma.contactMessage.create({
      data: { name: 'X', phone: '0900000013', subject: 'KHAC', message: 'x' },
    });
    const res = await request(app)
      .patch(`/api/admin/contacts/${msg.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('RESOLVED');
  });
});

describe('GET /api/admin/newsletter', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).get('/api/admin/newsletter');
    expect(res.status).toBe(401);
  });

  it('lists newsletter subscriptions', async () => {
    const email = `admin-newsletter-list-${Date.now()}@test.local`;
    await prisma.newsletterSubscription.create({ data: { email } });

    const res = await request(app).get('/api/admin/newsletter').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items.some((s) => s.email === email)).toBe(true);
  });
});

describe('GET /api/admin/chat-messages', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).get('/api/admin/chat-messages');
    expect(res.status).toBe(401);
  });

  it('filters by needsHelp=true', async () => {
    const needsHelpMsg = await prisma.chatMessage.create({
      data: { message: 'help me', reply: 'calling hotline', needsHelp: true },
    });
    const normalMsg = await prisma.chatMessage.create({
      data: { message: 'hi', reply: 'hello', needsHelp: false },
    });

    const res = await request(app).get('/api/admin/chat-messages').query({ needsHelp: 'true' }).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.items.map((m) => m.id);
    expect(ids).toContain(needsHelpMsg.id);
    expect(ids).not.toContain(normalMsg.id);
  });
});
