const PDFDocument = require('pdfkit');

const PAYMENT_LABEL = { COD: 'Thanh toán khi nhận hàng (COD)', BANK_TRANSFER: 'Chuyển khoản ngân hàng' };

function formatMoney(n) {
  return `${Number(n).toLocaleString('vi-VN')}đ`;
}

// Xuất PDF hóa đơn trực tiếp vào response stream - không tạo file tạm trên
// đĩa, chỉ dùng cho admin tải về (xem adminOrdersController.downloadInvoice).
function streamInvoicePdf(order, res) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).text('ĐIỆN MÁY NK', { align: 'left' });
  doc.fontSize(10).fillColor('#666').text('Hóa đơn bán hàng', { align: 'left' });
  doc.moveDown(1.5);

  doc.fillColor('#000').fontSize(12).text(`Mã đơn hàng: ${order.code}`);
  doc.text(`Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`);
  doc.text(`Phương thức thanh toán: ${PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}`);
  doc.moveDown();

  doc.fontSize(12).text('Thông tin người nhận', { underline: true });
  doc.fontSize(10).text(`${order.customerName} - ${order.phone}`);
  doc.text(order.address);
  doc.moveDown();

  if (order.invoiceRequested) {
    doc.fontSize(12).text('Thông tin xuất hóa đơn công ty', { underline: true });
    doc.fontSize(10).text(`Tên công ty: ${order.companyName}`);
    doc.text(`Mã số thuế: ${order.companyTaxCode}`);
    if (order.companyAddress) doc.text(`Địa chỉ công ty: ${order.companyAddress}`);
    if (order.companyEmail) doc.text(`Email nhận hóa đơn: ${order.companyEmail}`);
    doc.moveDown();
  }

  doc.fontSize(12).text('Chi tiết đơn hàng', { underline: true });
  doc.moveDown(0.5);

  const tableTop = doc.y;
  doc.fontSize(10).fillColor('#000');
  doc.text('Sản phẩm', 50, tableTop, { width: 260 });
  doc.text('SL', 310, tableTop, { width: 40, align: 'right' });
  doc.text('Đơn giá', 350, tableTop, { width: 90, align: 'right' });
  doc.text('Thành tiền', 440, tableTop, { width: 100, align: 'right' });
  doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();

  let y = tableTop + 22;
  for (const item of order.items) {
    doc.text(item.name, 50, y, { width: 260 });
    doc.text(String(item.quantity), 310, y, { width: 40, align: 'right' });
    doc.text(formatMoney(item.price), 350, y, { width: 90, align: 'right' });
    doc.text(formatMoney(item.price * item.quantity), 440, y, { width: 100, align: 'right' });
    y += 20;
  }

  const subtotal = order.total - order.shippingFee + order.discountAmount;
  doc.moveTo(50, y + 5).lineTo(540, y + 5).stroke();
  y += 15;
  doc.text('Tạm tính', 350, y, { width: 90, align: 'right' });
  doc.text(formatMoney(subtotal), 440, y, { width: 100, align: 'right' });
  y += 18;
  doc.text('Phí vận chuyển', 350, y, { width: 90, align: 'right' });
  doc.text(formatMoney(order.shippingFee), 440, y, { width: 100, align: 'right' });
  y += 18;
  if (order.discountAmount > 0) {
    doc.text(`Giảm giá${order.couponCode ? ` (${order.couponCode})` : ''}`, 350, y, { width: 90, align: 'right' });
    doc.text(`-${formatMoney(order.discountAmount)}`, 440, y, { width: 100, align: 'right' });
    y += 18;
  }
  doc.fontSize(12).text('Tổng cộng', 350, y, { width: 90, align: 'right' });
  doc.text(formatMoney(order.total), 440, y, { width: 100, align: 'right' });

  doc.end();
}

module.exports = { streamInvoicePdf };
