const prisma = require('../lib/prisma');
const { recomputeProductRating } = require('../utils/reviewAggregate');

async function listForProduct(req, res) {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId)) return res.status(400).json({ error: 'Sản phẩm không hợp lệ' });

  const reviews = await prisma.review.findMany({
    where: { productId, approved: true },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      customerName: r.customer.name,
      createdAt: r.createdAt,
      adminReply: r.adminReply,
      adminReplyAt: r.adminReplyAt,
    }))
  );
}

// Chỉ khách hàng có đơn hàng COMPLETED chứa đúng sản phẩm này mới được đánh
// giá - kiểm tra ở tầng ứng dụng (join Order/OrderItem) vì không thể diễn
// đạt ràng buộc này thuần bằng constraint DB.
async function hasCompletedPurchase(customerId, productId) {
  const count = await prisma.order.count({
    where: { customerId, status: 'COMPLETED', items: { some: { productId } } },
  });
  return count > 0;
}

async function checkEligibility(req, res) {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId)) return res.status(400).json({ error: 'Sản phẩm không hợp lệ' });

  const [eligible, existing] = await Promise.all([
    hasCompletedPurchase(req.customer.id, productId),
    prisma.review.findUnique({ where: { productId_customerId: { productId, customerId: req.customer.id } } }),
  ]);

  res.json({
    eligible,
    existingReview: existing ? { rating: existing.rating, comment: existing.comment, approved: existing.approved } : null,
  });
}

// upsert - khách sửa lại đánh giá cũ thay vì tạo thêm dòng mới (đã chặn ở
// @@unique([productId, customerId])). Sửa lại luôn đưa approved về false -
// bắt buộc admin duyệt lại nội dung mới, không cho lách kiểm duyệt bằng cách
// sửa sau khi đã được duyệt.
async function submit(req, res) {
  const { productId, rating, comment } = req.body;
  const pid = Number(productId);
  const ratingNum = Number(rating);

  if (!Number.isInteger(pid)) return res.status(400).json({ error: 'Sản phẩm không hợp lệ' });
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Số sao đánh giá phải từ 1 đến 5' });
  }

  const purchased = await hasCompletedPurchase(req.customer.id, pid);
  if (!purchased) {
    return res.status(403).json({ error: 'Bạn cần mua và nhận sản phẩm này trước khi có thể đánh giá' });
  }

  const review = await prisma.review.upsert({
    where: { productId_customerId: { productId: pid, customerId: req.customer.id } },
    create: { productId: pid, customerId: req.customer.id, rating: ratingNum, comment: comment?.trim() || null, approved: false },
    update: { rating: ratingNum, comment: comment?.trim() || null, approved: false },
  });

  // Trường hợp sửa lại 1 review đã từng approved: true - phải tính lại ngay
  // để rating trung bình không còn tính review này cho tới khi admin duyệt lại.
  await recomputeProductRating(pid);

  res.status(201).json({ id: review.id, rating: review.rating, comment: review.comment, approved: review.approved });
}

module.exports = { listForProduct, checkEligibility, submit, hasCompletedPurchase };
