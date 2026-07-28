const prisma = require('../lib/prisma');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

async function list(req, res) {
  const { limit, page, skip } = parsePagination(req.query);

  const [subscriptions, total] = await Promise.all([
    prisma.newsletterSubscription.findMany({
      orderBy: { subscribedAt: 'desc' },
      include: { customer: { select: { id: true, name: true, email: true } } },
      ...(limit ? { take: limit, skip } : {}),
    }),
    prisma.newsletterSubscription.count(),
  ]);

  res.json(paginatedResponse(subscriptions, total, page, limit));
}

module.exports = { list };
