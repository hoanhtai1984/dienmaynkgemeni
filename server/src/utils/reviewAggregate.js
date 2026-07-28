const prisma = require('../lib/prisma');

// Product.rating/reviewCount không còn là field admin tự gõ tay - tính lại từ
// các Review đã duyệt (approved: true) mỗi khi trạng thái duyệt của 1 review
// thay đổi (duyệt/ẩn/xóa). Chỉ tính review approved để khách vãng lai không
// thấy rating bị ảnh hưởng bởi review spam/chưa kiểm duyệt.
async function recomputeProductRating(productId) {
  const agg = await prisma.review.aggregate({
    where: { productId, approved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: agg._avg.rating || 0,
      reviewCount: agg._count,
    },
  });
}

module.exports = { recomputeProductRating };
