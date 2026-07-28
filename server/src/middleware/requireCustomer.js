const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getToken, CUSTOMER_COOKIE } = require('../utils/authCookies');

async function requireCustomer(req, res, next) {
  const token = getToken(req, CUSTOMER_COOKIE);
  if (!token) return res.status(401).json({ error: 'Thiếu token xác thực' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'customer') return res.status(401).json({ error: 'Token không hợp lệ' });

    // Chữ ký hợp lệ không có nghĩa token còn hiệu lực - so tokenVersion với
    // giá trị hiện tại trong DB để token bị thu hồi (logout/đặt lại mật khẩu)
    // từ chối ngay, không cần đợi hết hạn 30 ngày.
    const customer = await prisma.customer.findUnique({ where: { id: payload.id } });
    if (!customer || customer.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Token đã bị thu hồi, vui lòng đăng nhập lại' });
    }

    req.customer = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

module.exports = requireCustomer;
