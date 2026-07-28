// Giờ Việt Nam (UTC+7) để ngày đổi đúng theo giờ địa phương, không phụ thuộc
// timezone của máy chủ (production có thể chạy ở UTC).
function vnDateKey(date) {
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const yy = String(vnTime.getUTCFullYear()).slice(2);
  const mm = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(vnTime.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

// tx là Prisma transaction client (xem ordersController.js) - increment atomic
// trên OrderSequence đảm bảo 2 đơn tạo cùng lúc không bao giờ nhận cùng 1 số
// đếm, khác với việc COUNT(*) số đơn đã tạo trong ngày rồi +1 (có race condition).
async function generateOrderCode(tx) {
  const dateKey = vnDateKey(new Date());
  const seq = await tx.orderSequence.upsert({
    where: { dateKey },
    create: { dateKey, counter: 1 },
    update: { counter: { increment: 1 } },
  });
  return `DH${dateKey}-${String(seq.counter).padStart(4, '0')}`;
}

module.exports = { generateOrderCode };
