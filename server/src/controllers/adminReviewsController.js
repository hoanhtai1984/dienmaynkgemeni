const prisma = require('../lib/prisma');
const { logAdminActivity } = require('../utils/activityLog');
const { recomputeProductRating } = require('../utils/reviewAggregate');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

async function list(req, res) {
  const { approved } = req.query;
  const where = {};
  if (approved === 'true') where.approved = true;
  if (approved === 'false') where.approved = false;
  const { limit, page, skip } = parsePagination(req.query);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit, skip } : {}),
    }),
    prisma.review.count({ where }),
  ]);

  res.json(paginatedResponse(reviews, total, page, limit));
}

async function setApproved(req, res) {
  const id = Number(req.params.id);
  const { approved } = req.body;
  if (typeof approved !== 'boolean') return res.status(400).json({ error: 'Thiếu trạng thái duyệt' });

  const review = await prisma.review.update({ where: { id }, data: { approved } }).catch(() => null);
  if (!review) return res.status(404).json({ error: 'Không tìm thấy đánh giá' });

  await recomputeProductRating(review.productId);

  await logAdminActivity(req, {
    action: 'UPDATE',
    entityType: 'REVIEW',
    entityId: review.id,
    detail: `${approved ? 'Duyệt' : 'Ẩn'} đánh giá #${review.id}`,
  });

  res.json(review);
}

async function setReply(req, res) {
  const id = Number(req.params.id);
  const reply = typeof req.body.reply === 'string' ? req.body.reply.trim() : '';

  const review = await prisma.review
    .update({ where: { id }, data: { adminReply: reply || null, adminReplyAt: reply ? new Date() : null } })
    .catch(() => null);
  if (!review) return res.status(404).json({ error: 'Không tìm thấy đánh giá' });

  await logAdminActivity(req, {
    action: 'UPDATE',
    entityType: 'REVIEW',
    entityId: review.id,
    detail: reply ? `Phản hồi đánh giá #${review.id}` : `Xóa phản hồi đánh giá #${review.id}`,
  });

  res.json(review);
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const review = await prisma.review.delete({ where: { id } }).catch(() => null);
  if (!review) return res.status(404).json({ error: 'Không tìm thấy đánh giá' });

  await recomputeProductRating(review.productId);

  await logAdminActivity(req, {
    action: 'DELETE',
    entityType: 'REVIEW',
    entityId: review.id,
    detail: `Xóa đánh giá #${review.id}`,
  });

  res.json({ success: true });
}

module.exports = { list, setApproved, setReply, remove };
