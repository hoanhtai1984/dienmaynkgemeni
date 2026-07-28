const prisma = require('../lib/prisma');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function subscribe(req, res) {
  const { email } = req.body;
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Vui lòng nhập email hợp lệ' });
  }

  const existing = await prisma.newsletterSubscription.findUnique({ where: { email } });
  if (existing) {
    return res.status(200).json({ message: 'Email này đã đăng ký nhận tin trước đó' });
  }

  const customer = await prisma.customer.findFirst({ where: { email, deletedAt: null } });

  await prisma.newsletterSubscription.create({
    data: { email, customerId: customer?.id },
  });

  res.status(201).json({ message: 'Đăng ký nhận tin thành công' });
}

module.exports = { subscribe };
