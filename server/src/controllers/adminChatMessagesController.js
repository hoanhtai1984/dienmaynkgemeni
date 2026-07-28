const prisma = require('../lib/prisma');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

async function list(req, res) {
  const { needsHelp } = req.query;
  const where = needsHelp === 'true' ? { needsHelp: true } : {};
  const { limit, page, skip } = parsePagination(req.query);

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, email: true } } },
      ...(limit ? { take: limit, skip } : {}),
    }),
    prisma.chatMessage.count({ where }),
  ]);

  res.json(paginatedResponse(messages, total, page, limit));
}

module.exports = { list };
