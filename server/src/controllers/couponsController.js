const prisma = require('../lib/prisma');

// Giảm giá % làm tròn xuống (Math.floor) để tránh lệch 1đ giữa số tiền hiển
// thị lúc validate và số tiền thực trừ lúc tạo đơn (ordersController.create
// gọi lại đúng hàm này) - luôn cap theo subtotal, không cho giảm nhiều hơn
// giá trị đơn hàng.
function computeDiscount(coupon, subtotal) {
  const raw = coupon.discountType === 'PERCENT' ? Math.floor((subtotal * coupon.discountValue) / 100) : coupon.discountValue;
  return Math.max(0, Math.min(raw, subtotal));
}

// Kiểm tra coupon còn hợp lệ hay không (active, chưa hết hạn, chưa hết lượt,
// đơn đạt tối thiểu) - dùng chung cho cả API validate công khai (preview ở
// giỏ hàng) lẫn bước tạo đơn thật (ordersController.create validate lại từ
// đầu, không tin dữ liệu discountAmount client gửi lên).
function checkCouponEligibility(coupon, subtotal) {
  if (!coupon || !coupon.active) return 'Mã giảm giá không tồn tại hoặc đã ngừng áp dụng';
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return 'Mã giảm giá đã hết hạn';
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return 'Mã giảm giá đã hết lượt sử dụng';
  if (subtotal < coupon.minOrderTotal) {
    return `Đơn hàng cần tối thiểu ${coupon.minOrderTotal.toLocaleString('vi-VN')}đ để áp dụng mã này`;
  }
  return null;
}

async function validate(req, res) {
  const { code, subtotal } = req.body;
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá' });
  }

  const normalized = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  const sub = Number(subtotal) || 0;
  const error = checkCouponEligibility(coupon, sub);
  if (error) return res.status(coupon ? 400 : 404).json({ error });

  res.json({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: computeDiscount(coupon, sub),
  });
}

module.exports = { validate, computeDiscount, checkCouponEligibility };
