const prisma = require('../lib/prisma');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const VALID_STATUSES = ['NEW', 'RESOLVED'];

async function list(req, res) {
  const { status } = req.query;
  const where = status && VALID_STATUSES.includes(status) ? { status } : {};
  const { limit, page, skip } = parsePagination(req.query);

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, email: true } } },
      ...(limit ? { take: limit, skip } : {}),
    }),
    prisma.contactMessage.count({ where }),
  ]);

  res.json(paginatedResponse(messages, total, page, limit));
}

async function updateStatus(req, res) {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  }

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { status },
  });
  res.json(message);
}

module.exports = { list, updateStatus };
