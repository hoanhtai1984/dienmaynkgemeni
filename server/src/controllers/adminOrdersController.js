const prisma = require('../lib/prisma');
const { logAdminActivity } = require('../utils/activityLog');
const { sendOrderStatusUpdateEmail } = require('../utils/mailer');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { streamInvoicePdf } = require('../utils/invoicePdf');

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
const VALID_PAYMENT_STATUSES = ['UNPAID', 'PAID'];

async function list(req, res) {
  const { status } = req.query;
  const where = status ? { status } : {};
  const { limit, page, skip } = parsePagination(req.query);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit, skip } : {}),
    }),
    prisma.order.count({ where }),
  ]);

  res.json(paginatedResponse(orders, total, page, limit));
}

async function updateStatus(req, res) {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  }

  const current = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!current) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

  const enteringCancelled = status === 'CANCELLED' && current.status !== 'CANCELLED';
  const leavingCancelled = status !== 'CANCELLED' && current.status === 'CANCELLED';

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      if (enteringCancelled) {
        // Hủy đơn - hoàn lại đúng số lượng đã trừ lúc đặt hàng.
        for (const item of current.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      } else if (leavingCancelled) {
        // Đổi 1 đơn đã hủy sang trạng thái khác (khôi phục nhầm) - trừ lại
        // kho như lúc đặt hàng ban đầu, chặn nếu kho không còn đủ.
        for (const item of current.items) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            throw new Error(`Không thể khôi phục đơn - "${item.name}" không còn đủ hàng trong kho.`);
          }
        }
      }
      if (status !== current.status) {
        await tx.orderStatusHistory.create({ data: { orderId: id, status } });
      }
      return tx.order.update({
        where: { id },
        data: { status },
        include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
      });
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Đổi trạng thái thất bại, vui lòng thử lại.' });
  }

  await logAdminActivity(req, {
    action: 'UPDATE',
    entityType: 'ORDER',
    entityId: order.id,
    detail: `Đổi trạng thái đơn hàng #${order.id} thành "${status}"`,
  });

  // Best-effort: gửi mail không được làm hỏng response (trạng thái đơn đã
  // update DB thành công) nếu SMTP tạm thời lỗi.
  sendOrderStatusUpdateEmail(order, status).catch((err) => console.error('[mailer] Gửi mail cập nhật trạng thái đơn hàng thất bại:', err));

  res.json(order);
}

async function updatePaymentStatus(req, res) {
  const id = Number(req.params.id);
  const { paymentStatus } = req.body;
  if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
    return res.status(400).json({ error: 'Trạng thái thanh toán không hợp lệ' });
  }

  const current = await prisma.order.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

  const order = await prisma.order.update({ where: { id }, data: { paymentStatus }, include: { items: true } });

  await logAdminActivity(req, {
    action: 'UPDATE',
    entityType: 'ORDER',
    entityId: order.id,
    detail: `Đổi trạng thái thanh toán đơn hàng #${order.id} thành "${paymentStatus}"`,
  });

  res.json(order);
}

async function downloadInvoice(req, res) {
  const id = Number(req.params.id);
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="hoa-don-${order.code}.pdf"`);
  streamInvoicePdf(order, res);
}

module.exports = { list, updateStatus, updatePaymentStatus, downloadInvoice };
