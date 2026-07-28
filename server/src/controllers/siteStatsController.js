const prisma = require('../lib/prisma');

// Dòng duy nhất (id=1) có thể chưa tồn tại nếu chưa ai like/visit lần nào -
// upsert với giá trị 0 thay vì migrate/seed riêng, đơn giản hơn.
async function ensureRow() {
  return prisma.siteStats.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
}

function serialize(row) {
  return { likeCount: row.likeCount, visitCount: row.visitCount };
}

async function get(req, res) {
  const row = await ensureRow();
  res.json(serialize(row));
}

// Gọi 1 lần mỗi lần tải trang (xem client/src/hooks/useSiteStats.js) - đếm
// tổng số lượt truy cập thô (không phải khách truy cập duy nhất), khớp đúng
// yêu cầu "số tổng truy cập".
async function recordVisit(req, res) {
  await ensureRow();
  const row = await prisma.siteStats.update({
    where: { id: 1 },
    data: { visitCount: { increment: 1 } },
  });
  res.json(serialize(row));
}

// Toggle thích/bỏ thích - client tự nhớ trạng thái đã thích qua localStorage
// (không cần tài khoản), gửi lên hướng tăng/giảm tương ứng. Chặn không cho
// xuống dưới 0 (phòng trường hợp double-click bỏ thích khi đã ở 0, hoặc dữ
// liệu cục bộ ở client lệch với server).
async function like(req, res) {
  const liked = req.body?.liked === true;
  await ensureRow();
  const current = await prisma.siteStats.findUnique({ where: { id: 1 } });
  const nextCount = liked ? current.likeCount + 1 : Math.max(0, current.likeCount - 1);
  const row = await prisma.siteStats.update({
    where: { id: 1 },
    data: { likeCount: nextCount },
  });
  res.json(serialize(row));
}

module.exports = { get, recordVisit, like };
