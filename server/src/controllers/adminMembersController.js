const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { generateStrongPassword, validatePasswordStrength } = require('../utils/password');
const { logAdminActivity } = require('../utils/activityLog');

const CREATABLE_ROLES = ['MANAGER', 'STAFF'];

function serializeMember(admin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: admin.createdAt,
  };
}

async function list(req, res) {
  const members = await prisma.admin.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(members.map(serializeMember));
}

// Chỉ OWNER tạo được thành viên, và chỉ tạo được vai trò MANAGER/STAFF (không
// tự tạo thêm OWNER khác qua form này). Mật khẩu: để trống thì hệ thống tự
// sinh (12+ ký tự, đủ hoa/thường/số/ký tự đặc biệt); nếu OWNER tự nhập thì
// validate độ mạnh giống hệt tiêu chuẩn tự sinh, không hạ chuẩn. Chỉ trả
// password trong response khi TỰ SINH - nếu OWNER tự đặt thì họ đã biết rồi,
// không cần hiện lại (giảm nguy cơ lộ khi screen-share/chụp màn hình).
async function create(req, res) {
  const { email, name, role, password } = req.body;
  if (!email || !name || !role) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ email, họ tên và vai trò' });
  }
  if (!CREATABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ' });
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email này đã được sử dụng' });

  let plainPassword = null;
  if (password && password.trim()) {
    const strengthError = validatePasswordStrength(password);
    if (strengthError) return res.status(400).json({ error: strengthError });
  } else {
    plainPassword = generateStrongPassword();
  }
  const hashed = await bcrypt.hash(plainPassword || password, 10);

  const member = await prisma.admin.create({
    data: { email, name, role, password: hashed },
  });

  await logAdminActivity(req, {
    action: 'CREATE',
    entityType: 'MEMBER',
    entityId: member.id,
    detail: `Tạo thành viên "${member.name}" (${member.email}) - vai trò ${member.role}`,
  });

  res.status(201).json({ ...serializeMember(member), password: plainPassword || undefined });
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const member = await prisma.admin.findUnique({ where: { id } });
  if (!member) return res.status(404).json({ error: 'Không tìm thấy thành viên' });

  if (member.id === req.admin.id) {
    return res.status(400).json({ error: 'Không thể tự xóa chính mình' });
  }
  if (member.role === 'OWNER') {
    return res.status(400).json({ error: 'Không thể xóa tài khoản chủ' });
  }

  await prisma.admin.delete({ where: { id } });

  await logAdminActivity(req, {
    action: 'DELETE',
    entityType: 'MEMBER',
    entityId: member.id,
    detail: `Xóa thành viên "${member.name}" (${member.email})`,
  });

  res.status(204).send();
}

// Đặt lại mật khẩu cho thành viên bất cứ lúc nào (quên mật khẩu hoặc nghi bị
// lộ) - để trống thì hệ thống tự sinh mật khẩu mạnh mới, hoặc OWNER tự nhập
// mật khẩu mới (validate độ mạnh như khi tự sinh). Luôn tăng tokenVersion để
// thu hồi ngay mọi phiên đăng nhập cũ của thành viên đó (phòng trường hợp mật
// khẩu cũ đã bị lộ, kẻ có mật khẩu cũ vẫn đang giữ token thì cũng bị đăng
// xuất ngay), bất kể mật khẩu mới là tự sinh hay OWNER tự đặt.
async function resetPassword(req, res) {
  const id = Number(req.params.id);
  // req.body có thể là undefined khi client không gửi body nào cả (trường
  // hợp "để trống -> tự sinh mật khẩu" - client cố tình không gửi body).
  const { password } = req.body || {};
  const member = await prisma.admin.findUnique({ where: { id } });
  if (!member) return res.status(404).json({ error: 'Không tìm thấy thành viên' });

  let plainPassword = null;
  if (password && password.trim()) {
    const strengthError = validatePasswordStrength(password);
    if (strengthError) return res.status(400).json({ error: strengthError });
  } else {
    plainPassword = generateStrongPassword();
  }
  const hashed = await bcrypt.hash(plainPassword || password, 10);

  await prisma.admin.update({
    where: { id },
    data: { password: hashed, tokenVersion: { increment: 1 } },
  });

  await logAdminActivity(req, {
    action: 'UPDATE',
    entityType: 'MEMBER',
    entityId: member.id,
    detail: `Đặt lại mật khẩu cho thành viên "${member.name}" (${member.email})`,
  });

  res.json({ password: plainPassword || undefined });
}

// Nhật ký hành động - lọc theo thành viên (tùy chọn) và khoảng thời gian.
async function activity(req, res) {
  const { memberId, from, to } = req.query;
  const where = {};
  if (memberId) where.adminId = Number(memberId);
  if (from || to) {
    where.createdAt = {};
    // from/to là chuỗi "yyyy-mm-dd" (không có giờ) - phải hiểu "to" là HẾT
    // ngày đó (23:59:59.999), nếu không sẽ cắt mất toàn bộ hoạt động trong
    // ngày (new Date("yyyy-mm-dd") mặc định là 00:00:00 UTC).
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const logs = await prisma.adminActivityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  res.json(
    logs.map((l) => ({
      id: l.id,
      adminId: l.adminId,
      adminName: l.adminName,
      adminEmail: l.adminEmail,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      detail: l.detail,
      createdAt: l.createdAt,
    }))
  );
}

module.exports = { list, create, remove, resetPassword, activity };
