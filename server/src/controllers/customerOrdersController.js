const prisma = require('../lib/prisma');

async function list(req, res) {
  const orders = await prisma.order.findMany({
    where: { customerId: req.customer.id },
    include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
}

async function cancel(req, res) {
  const id = Number(req.params.id);
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order || order.customerId !== req.customer.id) {
    return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
  }
  if (order.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Đơn hàng này đã được hủy trước đó.' });
  }
  // Đơn xuất hóa đơn công ty đã chuyển khoản (tiền đã thực sự vào tài khoản)
  // không cho tự hủy - phải gọi hotline để xử lý hoàn tiền đúng quy trình kế
  // toán, khác với COD/CK chưa thanh toán (chưa có tiền thật để hoàn).
  if (order.invoiceRequested && order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'PAID') {
    return res.status(400).json({ error: 'Đơn xuất hóa đơn công ty đã chuyển khoản không thể tự hủy. Vui lòng gọi hotline để được hỗ trợ hoàn tiền.' });
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.orderStatusHistory.create({ data: { orderId: id, status: 'CANCELLED' } });
    return tx.order.update({ where: { id }, data: { status: 'CANCELLED' }, include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } } });
  });

  res.json(updated);
}

module.exports = { list, cancel };
