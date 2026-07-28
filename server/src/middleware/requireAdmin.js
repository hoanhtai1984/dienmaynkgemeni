const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getToken, ADMIN_COOKIE } = require('../utils/authCookies');

async function requireAdmin(req, res, next) {
  const token = getToken(req, ADMIN_COOKIE);
  if (!token) return res.status(401).json({ error: 'Thiếu token xác thực' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Chữ ký hợp lệ không có nghĩa token còn hiệu lực - so tokenVersion với
    // giá trị hiện tại trong DB để token bị thu hồi (logout) từ chối ngay,
    // không cần đợi hết hạn 7 ngày.
    const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
    if (!admin || admin.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Token đã bị thu hồi, vui lòng đăng nhập lại' });
    }

    // Gắn role từ bản ghi DB vừa đọc (không phải từ payload JWT) để khi admin
    // gốc đổi quyền một thành viên, quyền mới có hiệu lực ngay từ request kế
    // tiếp - không cần đợi thành viên đó đăng xuất/đăng nhập lại.
    req.admin = { id: admin.id, email: admin.email, name: admin.name, role: admin.role, tokenVersion: admin.tokenVersion };
    next();
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

module.exports = requireAdmin;
