const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { sendWelcomeEmail } = require('../utils/mailer');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { logAdminActivity } = require('../utils/activityLog');

function serializeCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    needsAttention: customer.needsAttention,
    createdAt: customer.createdAt,
    deletedAt: customer.deletedAt,
    blocked: customer.blocked,
  };
}

async function list(req, res) {
  const { q, needsHelp } = req.query;
  // 2 điều kiện lọc độc lập (tìm theo từ khóa, chỉ hiện cần hỗ trợ) đều tự
  // thân là 1 khối OR - gộp bằng AND ở ngoài để áp dụng đồng thời cả 2 khi
  // cả 2 cùng được truyền, thay vì để khối OR sau đè mất khối OR trước.
  const filters = [];
  if (q) {
    filters.push({
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ],
    });
  }
  if (needsHelp === 'true') {
    filters.push({
      OR: [
        { needsAttention: true },
        { contactMessages: { some: { status: 'NEW' } } },
        { chatMessages: { some: { needsHelp: true } } },
      ],
    });
  }
  const where = filters.length ? { AND: filters } : {};

  const { limit, page, skip } = parsePagination(req.query);

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        orders: { select: { total: true } },
        contactMessages: { select: { status: true } },
        chatMessages: { select: { needsHelp: true } },
      },
      ...(limit ? { take: limit, skip } : {}),
    }),
    prisma.customer.count({ where }),
  ]);

  const items = customers.map((c) => ({
    ...serializeCustomer(c),
    orderCount: c.orders.length,
    totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
    // "Cần hỗ trợ" - tự động (liên hệ chưa xử lý, hoặc chatbot phải gợi ý
    // gọi hotline) HOẶC admin tự đánh dấu thủ công.
    needsHelp:
      c.needsAttention ||
      c.contactMessages.some((m) => m.status === 'NEW') ||
      c.chatMessages.some((m) => m.needsHelp),
  }));

  res.json(paginatedResponse(items, total, page, limit));
}

async function create(req, res) {
  const { name, phone, password } = req.body;
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }
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

  sendWelcomeEmail(customer.email, customer.name).catch((err) => {
    console.error('Gửi email chào mừng thất bại:', err.message);
  });

  res.status(201).json(serializeCustomer(customer));
}

async function detail(req, res) {
  const id = Number(req.params.id);
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { include: { items: true }, orderBy: { createdAt: 'desc' } },
      contactMessages: { orderBy: { createdAt: 'desc' } },
      chatMessages: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!customer) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });

  // Khớp thêm theo email phòng trường hợp khách đăng ký nhận tin TRƯỚC khi
  // tạo tài khoản (customerId lúc đăng ký nhận tin sẽ là null, chỉ có email
  // trùng) - không chỉ dựa vào customerId đã gắn sẵn.
  const newsletter = await prisma.newsletterSubscription.findFirst({
    where: { OR: [{ customerId: id }, { email: customer.email }] },
  });

  res.json({
    ...serializeCustomer(customer),
    orders: customer.orders,
    contactMessages: customer.contactMessages,
    chatMessages: customer.chatMessages,
    newsletterSubscribedAt: newsletter?.subscribedAt || null,
  });
}

async function setNeedsAttention(req, res) {
  const id = Number(req.params.id);
  const { needsAttention } = req.body;
  const customer = await prisma.customer.update({
    where: { id },
    data: { needsAttention: !!needsAttention },
  });
  res.json(serializeCustomer(customer));
}

// Khoá/mở khoá đăng nhập - khác xoá, dữ liệu/lịch sử đơn hàng giữ nguyên
// hoàn toàn, khách chỉ không đăng nhập được nữa (xem check ở
// customerAuthController.login/me). Tăng tokenVersion khi khoá để phiên đăng
// nhập hiện tại (nếu có) bị từ chối ngay từ request kế tiếp, không đợi JWT hết hạn.
async function setBlocked(req, res) {
  const id = Number(req.params.id);
  const { blocked } = req.body;
  const current = await prisma.customer.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });

  const customer = await prisma.customer.update({
    where: { id },
    data: { blocked: !!blocked, ...(blocked ? { tokenVersion: { increment: 1 } } : {}) },
  });

  await logAdminActivity(req, {
    action: 'UPDATE',
    entityType: 'CUSTOMER',
    entityId: customer.id,
    detail: `${blocked ? 'Khóa' : 'Mở khóa'} tài khoản khách hàng "${customer.email}"`,
  });

  res.json(serializeCustomer(customer));
}

// Xoá mềm do ADMIN thực hiện - cùng cơ chế deletedAt như khách tự xoá tài
// khoản (customerAuthController.deleteAccount), chỉ khác nguồn gốc hành động
// (ghi vào AdminActivityLog thay vì CustomerActivityLog).
async function remove(req, res) {
  const id = Number(req.params.id);
  const current = await prisma.customer.findUnique({ where: { id } });
  if (!current || current.deletedAt) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });

  const customer = await prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date(), tokenVersion: { increment: 1 } },
  });

  await logAdminActivity(req, {
    action: 'DELETE',
    entityType: 'CUSTOMER',
    entityId: customer.id,
    detail: `Xóa tài khoản khách hàng "${customer.email}"`,
  });

  res.json(serializeCustomer(customer));
}

// Nhật ký khách hàng tự thay đổi hồ sơ/xoá tài khoản - lọc theo khách hàng
// (tùy chọn) và khoảng thời gian, cùng mẫu với adminMembersController.activity.
async function activity(req, res) {
  const { customerId, from, to } = req.query;
  const where = {};
  if (customerId) where.customerId = Number(customerId);
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const logs = await prisma.customerActivityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  res.json(
    logs.map((l) => ({
      id: l.id,
      customerId: l.customerId,
      customerName: l.customerName,
      customerEmail: l.customerEmail,
      action: l.action,
      detail: l.detail,
      createdAt: l.createdAt,
    }))
  );
}

module.exports = { list, create, detail, setNeedsAttention, setBlocked, remove, activity };
