const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { generateOrderCode } = require('../utils/orderCode');
const { getToken, CUSTOMER_COOKIE } = require('../utils/authCookies');
const { checkCouponEligibility, computeDiscount } = require('./couponsController');
const { sendOrderConfirmationEmail } = require('../utils/mailer');
const { provinceByCode, wardByCode } = require('../data/vietnamAddress');

// Phí ship cố định theo cấu hình admin (SiteSettings.shippingFlatFee), MIỄN
// PHÍ nếu đơn đạt ngưỡng freeShippingThreshold (null = không có ngưỡng, luôn
// tính phí ship). Tính trên subtotal (trước giảm giá) - giống cách các sàn
// TMĐT phổ biến tính ngưỡng freeship theo giá trị sản phẩm, không phải giá
// trị sau khi trừ coupon.
function computeShippingFee(settings, subtotal) {
  if (!settings) return 0;
  if (settings.freeShippingThreshold !== null && subtotal >= settings.freeShippingThreshold) return 0;
  return settings.shippingFlatFee || 0;
}

// Đặt hàng không bắt buộc đăng nhập (guest checkout). Nếu request có kèm
// token khách hàng hợp lệ thì gắn đơn hàng vào tài khoản đó, ngược lại (không
// có token, token hết hạn/không hợp lệ, hoặc tài khoản đã bị xoá - "Hủy đăng
// ký" trong customerAuthController.deleteAccount - trong khi cookie vẫn còn
// hạn tới 30 ngày) vẫn cho đặt hàng bình thường như khách vãng lai.
async function getOptionalCustomerId(req) {
  const token = getToken(req, CUSTOMER_COOKIE);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'customer') return null;
    const customer = await prisma.customer.findUnique({ where: { id: payload.id } });
    return customer ? payload.id : null;
  } catch {
    return null;
  }
}

async function create(req, res) {
  const {
    customerName,
    phone,
    provinceCode,
    wardCode,
    addressDetail,
    note,
    paymentMethod,
    items,
    invoiceRequested,
    companyName,
    companyTaxCode,
    companyAddress,
    companyEmail,
    couponCode,
    customerEmail,
  } = req.body;

  if (!customerName || !phone || !provinceCode || !wardCode || !addressDetail || !addressDetail.trim()) {
    return res.status(400).json({ error: 'Thiếu họ tên, số điện thoại hoặc địa chỉ' });
  }
  // Không tin tên tỉnh/phường client gửi lên - chỉ nhận mã, tự tra cứu tên
  // thật từ dữ liệu hành chính chuẩn phía server (xem server/src/data/vietnamAddress.js).
  const province = provinceByCode.get(provinceCode);
  const ward = wardByCode.get(wardCode);
  if (!province || !ward || ward.provinceCode !== provinceCode) {
    return res.status(400).json({ error: 'Tỉnh/thành hoặc phường/xã không hợp lệ' });
  }
  const address = `${addressDetail.trim()}, ${ward.name}, ${province.name}`;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Giỏ hàng trống' });
  }
  if (paymentMethod && !['COD', 'BANK_TRANSFER'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
  }
  if (invoiceRequested && (!companyName || !companyName.trim() || !companyTaxCode || !companyTaxCode.trim())) {
    return res.status(400).json({ error: 'Vui lòng nhập tên công ty và mã số thuế để xuất hóa đơn' });
  }
  // Xuất hóa đơn công ty bắt buộc chuyển khoản 100% - COD không áp dụng (rủi ro
  // thất thoát công nợ khi giao hàng xong mà công ty chưa thanh toán đủ).
  if (invoiceRequested && paymentMethod !== 'BANK_TRANSFER') {
    return res.status(400).json({ error: 'Đơn xuất hóa đơn công ty bắt buộc thanh toán chuyển khoản 100%, không áp dụng thanh toán khi nhận hàng (COD).' });
  }

  const productIds = items.map((it) => Number(it.productId));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const orderItemsData = [];
  const stockDecrements = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productById.get(Number(item.productId));
    const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1));
    if (!product) {
      return res.status(400).json({ error: `Sản phẩm id=${item.productId} không tồn tại` });
    }
    if (product.stock < quantity) {
      return res.status(400).json({
        error: `${product.name} chỉ còn ${product.stock} sản phẩm trong kho, không đủ số lượng bạn đặt (${quantity}).`,
      });
    }
    const cover = [...product.images].sort((a, b) => a.position - b.position)[0];
    orderItemsData.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: cover ? cover.url : null,
    });
    stockDecrements.push({ id: product.id, name: product.name, quantity });
    subtotal += product.price * quantity;
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const shippingFee = computeShippingFee(settings, subtotal);

  // Validate lại coupon từ đầu ở server (không tin discountAmount client gửi
  // lên) - cùng logic đã dùng ở bước preview /api/coupons/validate trên giỏ hàng.
  let coupon = null;
  const normalizedCoupon = typeof couponCode === 'string' ? couponCode.trim().toUpperCase() : '';
  if (normalizedCoupon) {
    coupon = await prisma.coupon.findUnique({ where: { code: normalizedCoupon } });
    const couponError = checkCouponEligibility(coupon, subtotal);
    if (couponError) return res.status(coupon ? 400 : 404).json({ error: couponError });
  }
  const discountAmount = coupon ? computeDiscount(coupon, subtotal) : 0;
  const total = subtotal + shippingFee - discountAmount;

  // Trừ kho + tăng lượt dùng coupon + tạo đơn trong cùng 1 transaction, và trừ
  // kho bằng updateMany với điều kiện stock >= quantity (không phải đọc-rồi-ghi)
  // để tránh race condition: 2 khách đặt cùng lúc sản phẩm/coupon chỉ còn 1
  // vẫn có thể cùng đọc thấy "còn hàng/còn lượt" ở bước check phía trên nếu
  // chỉ dựa vào đó.
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      for (const { id, name, quantity } of stockDecrements) {
        const result = await tx.product.updateMany({
          where: { id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (result.count === 0) {
          throw new Error(`${name} vừa hết hàng, vui lòng thử lại hoặc giảm số lượng.`);
        }
      }

      if (coupon) {
        const result = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            ...(coupon.maxUses !== null ? { usedCount: { lt: coupon.maxUses } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (result.count === 0) {
          throw new Error('Mã giảm giá vừa hết lượt sử dụng, vui lòng thử lại.');
        }
      }

      const newOrder = await tx.order.create({
        data: {
          code: await generateOrderCode(tx),
          customerId: await getOptionalCustomerId(req),
          customerName,
          phone,
          address,
          provinceCode: province.code,
          provinceName: province.name,
          wardCode: ward.code,
          wardName: ward.name,
          addressDetail: addressDetail.trim(),
          note: note || null,
          paymentMethod: paymentMethod || 'COD',
          total,
          shippingFee,
          discountAmount,
          couponCode: coupon ? coupon.code : null,
          customerEmail: typeof customerEmail === 'string' && customerEmail.trim() ? customerEmail.trim() : null,
          invoiceRequested: invoiceRequested === true,
          companyName: invoiceRequested ? companyName.trim() : null,
          companyTaxCode: invoiceRequested ? companyTaxCode.trim() : null,
          companyAddress: invoiceRequested && companyAddress ? companyAddress.trim() : null,
          companyEmail: invoiceRequested && companyEmail ? companyEmail.trim() : null,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });

      await tx.orderStatusHistory.create({ data: { orderId: newOrder.id, status: 'PENDING' } });

      return newOrder;
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Đặt hàng thất bại, vui lòng thử lại.' });
  }

  // Best-effort: gửi mail không được làm hỏng response (đơn đã tạo/thanh toán
  // xong trong DB) nếu SMTP tạm thời lỗi.
  sendOrderConfirmationEmail(order).catch((err) => console.error('[mailer] Gửi mail xác nhận đơn hàng thất bại:', err));

  res.status(201).json(order);
}

module.exports = { create };
