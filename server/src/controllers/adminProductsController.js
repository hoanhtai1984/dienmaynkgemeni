const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { LABEL_TO_BADGE, BADGE_TO_LABEL } = require('../utils/badge');
const { PRODUCT_INCLUDE } = require('./productsController');
const { buildProductSlug } = require('../utils/slugify');
const { logAdminActivity } = require('../utils/activityLog');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

function serializeAdminProduct(product) {
  const images = [...(product.images || [])].sort((a, b) => a.position - b.position);
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku || '',
    name: product.name,
    brand: product.brand,
    price: product.price,
    oldPrice: product.oldPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    sold: product.sold,
    stock: product.stock,
    weight: product.weight,
    badge: product.badge || '',
    badgeLabel: product.badge ? BADGE_TO_LABEL[product.badge] : '',
    description: product.description,
    specs: product.specs,
    categoryId: product.categoryId,
    subCategoryId: product.subCategoryId,
    subSubCategoryId: product.subSubCategoryId,
    promoEndsAt: product.promoEndsAt,
    promoSlots: product.promoSlots,
    promoSold: product.promoSold,
    images: images.map((img) => ({ id: img.id, url: img.url })),
    createdAt: product.createdAt,
  };
}

function parseBody(body) {
  const badge = body.badge ? LABEL_TO_BADGE[body.badge] || body.badge : null;
  let specs = {};
  if (body.specs) {
    specs = typeof body.specs === 'string' ? JSON.parse(body.specs) : body.specs;
  }
  return {
    name: body.name,
    // Rỗng phải lưu thành NULL (không phải '') vì unique index coi ''  là một
    // giá trị thật - nhiều sản phẩm cùng để trống SKU sẽ đụng unique constraint
    // nếu lưu thành chuỗi rỗng thay vì NULL.
    sku: body.sku && body.sku.trim() ? body.sku.trim() : null,
    brand: body.brand,
    price: Number(body.price),
    oldPrice: Number(body.oldPrice || body.price),
    sold: body.sold ? Number(body.sold) : 0,
    stock: body.stock ? Number(body.stock) : 0,
    weight: body.weight ? Number(body.weight) : null,
    badge,
    description: body.description || '',
    specs,
    categoryId: Number(body.categoryId),
    subCategoryId: body.subCategoryId ? Number(body.subCategoryId) : null,
    subSubCategoryId: body.subSubCategoryId ? Number(body.subSubCategoryId) : null,
    promoEndsAt: body.promoEndsAt ? new Date(body.promoEndsAt) : null,
    promoSlots: body.promoSlots ? Number(body.promoSlots) : null,
    promoSold: body.promoSold ? Number(body.promoSold) : 0,
  };
}

async function list(req, res) {
  const { q } = req.query;
  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { brand: { contains: q } },
          { sku: { contains: q } },
        ],
      }
    : {};
  const { limit, page, skip } = parsePagination(req.query);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: { id: 'desc' },
      ...(limit ? { take: limit, skip } : {}),
    }),
    prisma.product.count({ where }),
  ]);

  res.json(paginatedResponse(products.map(serializeAdminProduct), total, page, limit));
}

async function detail(req, res) {
  const id = Number(req.params.id);
  const product = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
  if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
  res.json(serializeAdminProduct(product));
}

// Prisma báo lỗi P2002 (đụng unique constraint) chung chung, không có thông
// điệp thân thiện - bắt riêng trường hợp trùng SKU để trả lỗi 400 dễ hiểu
// thay vì để lọt xuống errorHandler thành lỗi 500.
function rethrowFriendly(err) {
  if (err.code === 'P2002' && err.meta?.target?.includes('sku')) {
    const friendly = new Error('Mã SKU này đã được dùng cho sản phẩm khác, vui lòng chọn mã khác');
    friendly.status = 400;
    throw friendly;
  }
  throw err;
}

async function create(req, res) {
  const data = parseBody(req.body);
  const files = req.files || [];

  let created;
  try {
    created = await prisma.product.create({
      data: {
        ...data,
        // slug thật cần id (tự tăng) nên chỉ biết được sau khi tạo xong - dùng
        // placeholder duy nhất tạm thời để thỏa @unique, ghi đè ngay bằng slug
        // thật ở bước update ngay bên dưới, trong cùng request.
        slug: `tmp-${crypto.randomUUID()}`,
        images: {
          create: files.map((file, position) => ({
            url: `/uploads/products/${file.filename}`,
            position,
          })),
        },
      },
    });
  } catch (err) {
    rethrowFriendly(err);
  }

  const product = await prisma.product.update({
    where: { id: created.id },
    data: { slug: buildProductSlug(created.name, created.id) },
    include: PRODUCT_INCLUDE,
  });

  await logAdminActivity(req, {
    action: 'CREATE',
    entityType: 'PRODUCT',
    entityId: product.id,
    detail: `Thêm sản phẩm "${product.name}"`,
  });

  res.status(201).json(serializeAdminProduct(product));
}

function normalizeText(s) {
  return (s || '').toString().trim().toLowerCase();
}

// Danh mục con đôi khi có tên ghép nhiều cụm cách nhau bởi dấu phẩy (vd "Tủ
// Lạnh, Tủ Đông, Tủ Mát") - khớp theo TOÀN BỘ tên hoặc theo TỪNG cụm tách
// riêng, giống hệt cách chatbot (ai-service) khớp tên danh mục con.
function matchesCategoryName(fullName, target) {
  const normTarget = normalizeText(target);
  if (!normTarget) return false;
  if (normalizeText(fullName) === normTarget) return true;
  return fullName.split(',').some((part) => normalizeText(part) === normTarget);
}

// Nhập hàng loạt qua Excel - mỗi dòng là 1 sản phẩm, danh mục được ghi bằng
// TÊN (không phải id) để admin không cần tra id thủ công; khớp không phân
// biệt hoa/thường và khoảng trắng thừa.
async function bulkCreate(req, res) {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  if (rows.length === 0) return res.status(400).json({ error: 'Không có dòng dữ liệu nào để nhập' });

  const categories = await prisma.category.findMany({
    include: { subCategories: { include: { subSubCategories: true } } },
  });

  function resolveCategory(categoryName, subCategoryName, subSubCategoryName) {
    const category = categories.find((c) => matchesCategoryName(c.name, categoryName));
    if (!category) return { error: `Không tìm thấy danh mục "${categoryName}"` };

    let subCategory = null;
    if (subCategoryName) {
      subCategory = category.subCategories.find((s) => matchesCategoryName(s.name, subCategoryName));
      if (!subCategory) return { error: `Không tìm thấy danh mục con "${subCategoryName}" trong danh mục "${categoryName}"` };
    }

    let subSubCategory = null;
    if (subSubCategoryName) {
      if (!subCategory) return { error: `Cần có danh mục con trước khi dùng danh mục con cấp 2 "${subSubCategoryName}"` };
      subSubCategory = subCategory.subSubCategories.find((s) => matchesCategoryName(s.name, subSubCategoryName));
      if (!subSubCategory) return { error: `Không tìm thấy danh mục con cấp 2 "${subSubCategoryName}" trong "${subCategoryName}"` };
    }

    return { categoryId: category.id, subCategoryId: subCategory?.id ?? null, subSubCategoryId: subSubCategory?.id ?? null };
  }

  const results = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || {};
    const rowNum = i + 2; // dòng 1 là header trong file Excel

    if (!row.name || !row.brand || !row.price || !row.categoryName) {
      results.push({ row: rowNum, success: false, error: 'Thiếu tên sản phẩm, thương hiệu, giá bán hoặc danh mục' });
      continue;
    }

    const resolved = resolveCategory(row.categoryName, row.subCategoryName, row.subSubCategoryName);
    if (resolved.error) {
      results.push({ row: rowNum, success: false, error: resolved.error });
      continue;
    }

    try {
      const price = Number(row.price);
      const badge = row.badgeLabel ? LABEL_TO_BADGE[row.badgeLabel] || null : null;

      const created = await prisma.product.create({
        data: {
          name: String(row.name),
          brand: String(row.brand),
          price,
          oldPrice: row.oldPrice ? Number(row.oldPrice) : price,
          description: row.description ? String(row.description) : '',
          specs: {},
          stock: row.stock ? Number(row.stock) : 0,
          sold: row.sold ? Number(row.sold) : 0,
          badge,
          categoryId: resolved.categoryId,
          subCategoryId: resolved.subCategoryId,
          subSubCategoryId: resolved.subSubCategoryId,
          slug: `tmp-${crypto.randomUUID()}`,
        },
      });

      const product = await prisma.product.update({
        where: { id: created.id },
        data: { slug: buildProductSlug(created.name, created.id) },
      });

      results.push({ row: rowNum, success: true, id: product.id, name: product.name });
    } catch (err) {
      results.push({ row: rowNum, success: false, error: err.message || 'Lỗi không xác định' });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  if (successCount > 0) {
    await logAdminActivity(req, {
      action: 'CREATE',
      entityType: 'PRODUCT',
      detail: `Nhập hàng loạt ${successCount}/${rows.length} sản phẩm từ file Excel`,
    });
  }

  res.json({ results });
}

async function update(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

  const data = parseBody(req.body);
  const files = req.files || [];
  const startPosition = existing.images.length;

  let product;
  try {
    product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        // Cập nhật lại slug theo tên mới nhất - id ở cuối không đổi nên URL cũ
        // (kể cả đã chia sẻ/bookmark) vẫn luôn tra cứu đúng sản phẩm.
        slug: buildProductSlug(data.name, id),
        images: {
          create: files.map((file, i) => ({
            url: `/uploads/products/${file.filename}`,
            position: startPosition + i,
          })),
        },
      },
      include: PRODUCT_INCLUDE,
    });
  } catch (err) {
    rethrowFriendly(err);
  }

  await logAdminActivity(req, {
    action: 'UPDATE',
    entityType: 'PRODUCT',
    entityId: product.id,
    detail: `Sửa sản phẩm "${product.name}"`,
  });

  res.json(serializeAdminProduct(product));
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

  await prisma.product.delete({ where: { id } });

  for (const img of existing.images) {
    deleteUploadedFile(img.url);
  }

  await logAdminActivity(req, {
    action: 'DELETE',
    entityType: 'PRODUCT',
    entityId: existing.id,
    detail: `Xóa sản phẩm "${existing.name}"`,
  });

  res.status(204).send();
}

async function removeImage(req, res) {
  const productId = Number(req.params.id);
  const imageId = Number(req.params.imageId);

  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) {
    return res.status(404).json({ error: 'Không tìm thấy ảnh' });
  }

  await prisma.productImage.delete({ where: { id: imageId } });
  deleteUploadedFile(image.url);

  res.status(204).send();
}

function deleteUploadedFile(url) {
  if (!url.startsWith('/uploads/')) return;
  const filePath = path.join(__dirname, '../../', url);
  fs.unlink(filePath, () => {});
}

module.exports = { list, detail, create, bulkCreate, update, remove, removeImage };
