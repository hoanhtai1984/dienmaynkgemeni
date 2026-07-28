const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

let adminToken;
let counter = 0;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = loginRes.body.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

function uniqueEmail() {
  counter += 1;
  return `admin-customers-test-${Date.now()}-${counter}@test.local`;
}

async function makeCustomer(overrides = {}) {
  const hashed = await bcrypt.hash('password123', 10);
  return prisma.customer.create({
    data: { name: 'List Test Customer', email: uniqueEmail(), password: hashed, ...overrides },
  });
}

describe('GET /api/admin/customers', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(401);
  });

  it('marks needsHelp=true for a customer flagged needsAttention', async () => {
    const customer = await makeCustomer({ needsAttention: true });

    const res = await request(app).get('/api/admin/customers').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const found = res.body.items.find((c) => c.id === customer.id);
    expect(found).toBeDefined();
    expect(found.needsHelp).toBe(true);
  });

  it('marks needsHelp=false for a customer with no flags at all', async () => {
    const customer = await makeCustomer();

    const res = await request(app).get('/api/admin/customers').set('Authorization', `Bearer ${adminToken}`);
    const found = res.body.items.find((c) => c.id === customer.id);
    expect(found.needsHelp).toBe(false);
  });
});

describe('POST /api/admin/customers', () => {
  it('rejects a missing password', async () => {
    const res = await request(app)
      .post('/api/admin/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'No Password', email: uniqueEmail() });
    expect(res.status).toBe(400);
  });

  it('rejects a password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/admin/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Short Pass', email: uniqueEmail(), password: '123' });
    expect(res.status).toBe(400);
  });

  it('creates a customer with valid data', async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post('/api/admin/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Valid Customer', email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
    expect(res.body.password).toBeUndefined();
  });

  it('rejects a duplicate email', async () => {
    const email = uniqueEmail();
    await request(app)
      .post('/api/admin/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'First', email, password: 'password123' });

    const res = await request(app)
      .post('/api/admin/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Second', email, password: 'password123' });
    expect(res.status).toBe(409);
  });
});

describe('GET /api/admin/customers/:id', () => {
  it('returns 404 for a non-existent customer', async () => {
    const res = await request(app).get('/api/admin/customers/999999999').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('returns customer detail with empty related lists', async () => {
    const customer = await makeCustomer();
    const res = await request(app).get(`/api/admin/customers/${customer.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
    expect(res.body.contactMessages).toEqual([]);
    expect(res.body.chatMessages).toEqual([]);
  });
});

describe('PATCH /api/admin/customers/:id/needs-attention', () => {
  it('toggles the manual needsAttention flag', async () => {
    const customer = await makeCustomer();

    const res = await request(app)
      .patch(`/api/admin/customers/${customer.id}/needs-attention`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ needsAttention: true });

    expect(res.status).toBe(200);
    expect(res.body.needsAttention).toBe(true);

    const res2 = await request(app)
      .patch(`/api/admin/customers/${customer.id}/needs-attention`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ needsAttention: false });
    expect(res2.body.needsAttention).toBe(false);
  });
});
