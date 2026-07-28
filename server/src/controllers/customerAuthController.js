const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/mailer');
const { logCustomerActivity } = require('../utils/customerActivityLog');
const { setCustomerCookie, clearCustomerCookie } = require('../utils/authCookies');
const { validateCustomerPasswordStrength } = require('../utils/password');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 giờ

function serializeCustomer(customer) {
  return { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone };
}

function signToken(customer) {
  return jwt.sign(
    {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      role: 'customer',
      tokenVersion: customer.tokenVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

async function register(req, res) {
  const { name, phone, password, agreeTerms } = req.body;
  // Chuẩn hoá về chữ thường - "A@b.com" và "a@b.com" phải được coi là cùng
  // 1 email, không thì khách có thể vô tình tạo 2 tài khoản khác nhau chỉ vì
  // gõ hoa/thường khác lần trước.
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu' });
  }
  const passwordError = validateCustomerPasswordStrength(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }
  if (!agreeTerms) {
    return res.status(400).json({ error: 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật' });
  }

  // Chỉ chặn trùng với tài khoản CÒN hoạt động - email của tài khoản đã bị
  // xoá mềm (deletedAt khác null) được phép đăng ký lại bằng dòng mới. Đây
  // chỉ là kiểm tra "đường tắt" để trả lỗi sớm, không phải chốt chặn chính -
  // 2 request đăng ký cùng email gửi lên gần như đồng thời có thể cùng vượt
  // qua findFirst này trước khi request nào kịp create xong (race condition).
  // Chốt chặn thật nằm ở unique index emailActiveKey trong DB (xem migration
  // 20260725040000), bắt lỗi P2002 bên dưới khi create.
  const existing = await prisma.customer.findFirst({ where: { email, deletedAt: null } });
  if (existing) return res.status(409).json({ error: 'Email này đã được đăng ký' });

  const hashed = await bcrypt.hash(password, 10);
  let customer;
  try {
    customer = await prisma.customer.create({
      data: { name, email, phone: phone || null, password: hashed },
    });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email này đã được đăng ký' });
    throw err;
  }

  // Gửi email chào mừng theo kiểu "best effort" - lỗi gửi email (SMTP down,
  // sai cấu hình...) không được phép làm hỏng việc đăng ký đã thành công.
  sendWelcomeEmail(customer.email, customer.name).catch((err) => {
    console.error('Gửi email chào mừng thất bại:', err.message);
  });

  const token = signToken(customer);
  setCustomerCookie(res, token);
  res.status(201).json({ token, customer: serializeCustomer(customer) });
}

async function login(req, res) {
  const { password } = req.body;
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;
  if (!email || !password) return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });

  const customer = await prisma.customer.findFirst({ where: { email, deletedAt: null } });
  if (!customer) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

  const valid = await bcrypt.compare(password, customer.password);
  if (!valid) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

  // Kiểm tra sau khi đã xác thực mật khẩu đúng - tránh lộ trạng thái khóa
  // tài khoản cho người không biết mật khẩu (account enumeration).
  if (customer.blocked) {
    return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hotline để được hỗ trợ.' });
  }

  const token = signToken(customer);
  setCustomerCookie(res, token);
  res.json({ token, customer: serializeCustomer(customer) });
}

// Trả kèm 1 token mới mỗi lần gọi (dù cookie mới là thứ xác thực chính) - để
// ChatWidget lấy được token dùng riêng cho ai-service (dịch vụ Python tách
// biệt, domain/port khác nên không có sẵn cookie HttpOnly của server chính).
// Token này chỉ giữ tạm trong bộ nhớ React (không lưu localStorage), xem
// CustomerAuthContext.jsx.
async function me(req, res) {
  const customer = await prisma.customer.findUnique({ where: { id: req.customer.id } });
  if (!customer || customer.deletedAt) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
  if (customer.blocked) {
    return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hotline để được hỗ trợ.' });
  }
  res.json({ ...serializeCustomer(customer), token: signToken(customer) });
}

// Khách hàng tự sửa hồ sơ - chỉ name/phone, email luôn giữ nguyên (không
// nhận field email trong body dù có gửi lên). Ghi nhật ký dạng "trước -> sau"
// chỉ cho field thực sự đổi, bỏ qua nếu không có gì thay đổi.
async function updateProfile(req, res) {
  if (req.body.email !== undefined) {
    return res.status(400).json({ error: 'Không thể thay đổi email' });
  }
  const { name, phone } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập họ tên' });
  }

  const current = await prisma.customer.findUnique({ where: { id: req.customer.id } });
  if (!current || current.deletedAt) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });

  const nextName = name.trim();
  const nextPhone = phone?.trim() || null;
  const changes = [];
  if (current.name !== nextName) changes.push(`Đổi tên: "${current.name}" → "${nextName}"`);
  if (current.phone !== nextPhone) changes.push(`Đổi SĐT: "${current.phone || '(trống)'}" → "${nextPhone || '(trống)'}"`);

  const updated = await prisma.customer.update({
    where: { id: current.id },
    data: { name: nextName, phone: nextPhone },
  });

  if (changes.length) {
    await logCustomerActivity(updated, { action: 'UPDATE_PROFILE', detail: changes.join('; ') });
  }

  res.json(serializeCustomer(updated));
}

// Xoá mềm - đánh dấu deletedAt thay vì xoá dòng thật (giữ lịch sử đơn hàng +
// vẫn hiện đúng email đã xoá trong báo cáo admin, xem ghi chú ở schema).
// Tăng tokenVersion luôn để token hiện tại (và mọi token cũ khác) hết hiệu
// lực ngay, giống logout/resetPassword.
async function deleteAccount(req, res) {
  const current = await prisma.customer.findUnique({ where: { id: req.customer.id } });
  if (!current || current.deletedAt) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });

  await logCustomerActivity(current, { action: 'DELETE_ACCOUNT', detail: 'Khách hàng tự xóa tài khoản' });

  await prisma.customer.update({
    where: { id: current.id },
    data: { deletedAt: new Date(), tokenVersion: { increment: 1 } },
  });

  clearCustomerCookie(res);
  res.status(204).send();
}

// Tăng tokenVersion để mọi JWT đã phát hành trước đó (kể cả token đang bị
// đánh cắp) đều bị từ chối ngay từ request tiếp theo, không đợi hết hạn 30 ngày.
async function logout(req, res) {
  await prisma.customer.update({
    where: { id: req.customer.id },
    data: { tokenVersion: { increment: 1 } },
  });
  clearCustomerCookie(res);
  res.status(204).send();
}

async function forgotPassword(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;
  if (!email) return res.status(400).json({ error: 'Thiếu email' });

  const genericResponse = { message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' };

  // Chỉ tài khoản còn hoạt động mới được đặt lại mật khẩu - email trùng với
  // dòng đã xoá mềm (nếu có) bị bỏ qua ở đây.
  const customer = await prisma.customer.findFirst({ where: { email, deletedAt: null } });
  if (!customer) return res.json(genericResponse);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.customer.update({
    where: { id: customer.id },
    data: { resetToken: hashedToken, resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });

  const resetLink = `${process.env.CLIENT_URL}/dat-lai-mat-khau?token=${rawToken}&email=${encodeURIComponent(email)}`;
  // Best effort - SMTP lỗi/sập (sai cấu hình, provider tạm ngưng...) không
  // được để lộ ra ngoài qua response, vẫn trả cùng thông báo chung để không
  // tiết lộ email nào tồn tại và không làm hỏng luồng quên mật khẩu.
  try {
    await sendPasswordResetEmail(email, resetLink);
  } catch (err) {
    console.error('Gửi email đặt lại mật khẩu thất bại:', err.message);
  }

  res.json(genericResponse);
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;
  if (!email || !token || !password) return res.status(400).json({ error: 'Thiếu thông tin đặt lại mật khẩu' });
  const passwordError = validateCustomerPasswordStrength(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const customer = await prisma.customer.findFirst({ where: { email, deletedAt: null } });
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const valid =
    customer &&
    customer.resetToken === hashedToken &&
    customer.resetTokenExpiry &&
    customer.resetTokenExpiry.getTime() > Date.now();

  if (!valid) return res.status(400).json({ error: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });

  const hashed = await bcrypt.hash(password, 10);
  await prisma.customer.update({
    where: { id: customer.id },
    // Đặt lại mật khẩu cũng thu hồi mọi phiên đăng nhập cũ (tokenVersion+1) -
    // quan trọng đúng lúc: đây thường là bước xử lý khi nghi ngờ tài khoản bị
    // lộ, nên các token cũ (kể cả token đã bị đánh cắp) phải mất hiệu lực luôn.
    data: { password: hashed, resetToken: null, resetTokenExpiry: null, tokenVersion: { increment: 1 } },
  });

  res.json({ message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.' });
}

module.exports = {
  register, login, me, logout, forgotPassword, resetPassword,
  updateProfile, deleteAccount,
};
