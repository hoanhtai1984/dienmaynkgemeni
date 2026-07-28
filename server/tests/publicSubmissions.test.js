const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/contact', () => {
  it('rejects a missing required field', async () => {
    const res = await request(app).post('/api/contact').send({ name: 'No Phone', message: 'hi' });
    expect(res.status).toBe(400);
  });

  it('creates a contact message, mapping a slug subject to its enum value', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Contact Test', phone: '0900000001', message: 'Cần tư vấn', subject: 'bao-hanh',
    });
    expect(res.status).toBe(201);
    expect(res.body.subject).toBe('BAO_HANH');
  });

  it('defaults to KHAC for an unrecognized subject', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Contact Test 2', phone: '0900000002', message: 'test', subject: 'not-a-real-subject',
    });
    expect(res.status).toBe(201);
    expect(res.body.subject).toBe('KHAC');
  });

  it('links the message to a logged-in customer when a token is sent', async () => {
    const registerRes = await request(app).post('/api/customer-auth/register').send({
      name: 'Contact Customer', email: `contact-customer-${Date.now()}@test.local`, password: 'password123', agreeTerms: true,
    });
    const res = await request(app)
      .post('/api/contact')
      .set('Authorization', `Bearer ${registerRes.body.token}`)
      .send({ name: 'Contact Customer', phone: '0900000003', message: 'test' });

    expect(res.status).toBe(201);
    expect(res.body.customerId).toBe(registerRes.body.customer.id);
  });
});

describe('POST /api/newsletter', () => {
  it('rejects an invalid email', async () => {
    const res = await request(app).post('/api/newsletter').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('subscribes a new email', async () => {
    const email = `newsletter-${Date.now()}@test.local`;
    const res = await request(app).post('/api/newsletter').send({ email });
    expect(res.status).toBe(201);

    const stored = await prisma.newsletterSubscription.findUnique({ where: { email } });
    expect(stored).not.toBeNull();
  });

  it('does not error on a duplicate subscription, and does not create a second row', async () => {
    const email = `newsletter-dup-${Date.now()}@test.local`;
    await request(app).post('/api/newsletter').send({ email });

    const res = await request(app).post('/api/newsletter').send({ email });
    expect(res.status).toBe(200);

    const count = await prisma.newsletterSubscription.count({ where: { email } });
    expect(count).toBe(1);
  });

  it('links the subscription to an existing customer account by email', async () => {
    const email = `newsletter-linked-${Date.now()}@test.local`;
    await request(app).post('/api/customer-auth/register').send({
      name: 'Newsletter Customer', email, password: 'password123', agreeTerms: true,
    });

    await request(app).post('/api/newsletter').send({ email });

    const stored = await prisma.newsletterSubscription.findUnique({ where: { email } });
    expect(stored.customerId).not.toBeNull();
  });
});
