const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { validatePasswordStrength } = require('../utils/password');
const { setAdminCookie, clearAdminCookie } = require('../utils/authCookies');

function signToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, tokenVersion: admin.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

  const token = signToken(admin);
  // Cookie HttpOnly là nơi trình duyệt thật sự dùng để xác thực - token
  // trong JSON body chỉ giữ lại để test suite (supertest, không có cookie
  // jar) và client không phải trình duyệt vẫn dùng được qua header Bearer.
  setAdminCookie(res, token);
  res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
}

async function me(req, res) {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
  if (!admin) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
  res.json({ id: admin.id, email: admin.email, name: admin.name, role: admin.role });
}

// Tăng tokenVersion để mọi JWT admin đã phát hành trước đó (kể cả token đang
// bị đánh cắp) đều bị từ chối ngay từ request tiếp theo, không đợi hết hạn 7 ngày.
async function logout(req, res) {
  await prisma.admin.update({
    where: { id: req.admin.id },
    data: { tokenVersion: { increment: 1 } },
  });
  clearAdminCookie(res);
  res.status(204).send();
}

// Admin tự đổi mật khẩu của chính mình (khác reset-password ở adminMembers -
// chỗ đó là OWNER đặt lại cho NGƯỜI KHÁC, không cần biết mật khẩu cũ; ở đây
// bắt buộc phải đúng mật khẩu hiện tại). Vẫn tăng tokenVersion để thu hồi mọi
// phiên đăng nhập khác (phòng trường hợp đổi mật khẩu vì nghi bị lộ), nhưng
// trả về token MỚI ngay trong response để phiên hiện tại không bị đăng xuất
// giữa chừng - client tự thay token cũ bằng token mới này.
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới' });
  }

  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
  const valid = await bcrypt.compare(currentPassword, admin.password);
  if (!valid) return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });

  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) return res.status(400).json({ error: strengthError });

  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: { password: await bcrypt.hash(newPassword, 10), tokenVersion: { increment: 1 } },
  });

  const token = signToken(updated);
  setAdminCookie(res, token);
  res.json({ token });
}

module.exports = { login, me, logout, changePassword };
