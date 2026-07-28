const prisma = require('../lib/prisma');
const { logAdminActivity } = require('../utils/activityLog');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const DISCOUNT_TYPES = ['PERCENT', 'FIXED'];

async function list(req, res) {
  const { limit, page, skip } = parsePagination(req.query);

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit, skip } : {}),
    }),
    prisma.coupon.count(),
  ]);

  res.json(paginatedResponse(coupons, total, page, limit));
}

function parseMaxUses(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

async function create(req, res) {
  const { code, discountType, discountValue, minOrderTotal, maxUses, active, expiresAt } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Thiếu mã giảm giá' });
  }
  if (!DISCOUNT_TYPES.includes(discountType)) {
    return res.status(400).json({ error: 'Loại giảm giá không hợp lệ' });
  }
  const value = Number(discountValue);
  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ error: 'Giá trị giảm giá không hợp lệ' });
  }
  if (discountType === 'PERCENT' && value > 100) {
    return res.status(400).json({ error: 'Phần trăm giảm giá không được vượt quá 100' });
  }

  const normalized = code.trim().toUpperCase();
  let coupon;
  try {
    coupon = await prisma.coupon.create({
      data: {
        code: normalized,
        discountType,
        discountValue: Math.floor(value),
        minOrderTotal: Math.max(0, Number(minOrderTotal) || 0),
        maxUses: parseMaxUses(maxUses),
        active: active !== false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Mã giảm giá này đã tồn tại' });
    throw err;
  }

  await logAdminActivity(req, { action: 'CREATE', entityType: 'COUPON', entityId: coupon.id, detail: `Tạo mã giảm giá "${coupon.code}"` });
  res.status(201).json(coupon);
}

async function update(req, res) {
  const id = Number(req.params.id);
  const { discountType, discountValue, minOrderTotal, maxUses, active, expiresAt } = req.body;

  const data = {};
  if (discountType !== undefined) {
    if (!DISCOUNT_TYPES.includes(discountType)) return res.status(400).json({ error: 'Loại giảm giá không hợp lệ' });
    data.discountType = discountType;
  }
  if (discountValue !== undefined) {
    const value = Number(discountValue);
    if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Giá trị giảm giá không hợp lệ' });
    data.discountValue = Math.floor(value);
  }
  if (minOrderTotal !== undefined) data.minOrderTotal = Math.max(0, Number(minOrderTotal) || 0);
  if (maxUses !== undefined) data.maxUses = parseMaxUses(maxUses);
  if (active !== undefined) data.active = active === true;
  if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

  const coupon = await prisma.coupon.update({ where: { id }, data }).catch(() => null);
  if (!coupon) return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });

  await logAdminActivity(req, { action: 'UPDATE', entityType: 'COUPON', entityId: coupon.id, detail: `Cập nhật mã giảm giá "${coupon.code}"` });
  res.json(coupon);
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const coupon = await prisma.coupon.delete({ where: { id } }).catch(() => null);
  if (!coupon) return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });

  await logAdminActivity(req, { action: 'DELETE', entityType: 'COUPON', entityId: coupon.id, detail: `Xóa mã giảm giá "${coupon.code}"` });
  res.json({ success: true });
}

module.exports = { list, create, update, remove };
