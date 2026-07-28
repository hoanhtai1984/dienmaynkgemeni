const prisma = require('../lib/prisma');
const { serializeProduct } = require('../utils/serializeProduct');

const PRODUCT_INCLUDE = { category: true, subCategory: true, subSubCategory: true, images: true };

function buildOrderBy(sortBy) {
  switch (sortBy) {
    case 'price-asc':
      return { price: 'asc' };
    case 'price-desc':
      return { price: 'desc' };
    case 'bestseller':
      return { sold: 'desc' };
    default:
      return { id: 'desc' };
  }
}

async function list(req, res) {
  const { category, sub, subsub, brands, minPrice, maxPrice, sortBy, q, page, limit } = req.query;

  const where = {};
  if (category && category !== 'all') where.category = { slug: category };
  if (sub) where.subCategory = { slug: sub };
  if (subsub) where.subSubCategory = { slug: subsub };
  if (brands) {
    const brandList = brands.split(',').map((b) => b.trim()).filter(Boolean);
    if (brandList.length) where.brand = { in: brandList };
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { brand: { contains: q } },
    ];
  }

  // `limit` là opt-in - không truyền thì trả về toàn bộ kết quả khớp như
  // trước đây (dùng cho trang chủ, nơi cần cả catalog để tự chia thành nhiều
  // khu vực khác nhau ở client). Category/tìm kiếm truyền limit để không phải
  // tải cả nghìn bản ghi mỗi lần chỉ để hiển thị 10 sản phẩm đầu.
  const take = limit ? Number(limit) : undefined;
  const currentPage = page ? Number(page) : 1;
  const skip = take ? (currentPage - 1) * take : undefined;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: buildOrderBy(sortBy),
      ...(take ? { take, skip } : {}),
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    items: products.map(serializeProduct),
    total,
    page: currentPage,
    pageSize: take || total,
    totalPages: take ? Math.ceil(total / take) : 1,
  });
}

// URL sản phẩm là "ten-san-pham-<id>" (xem server/src/utils/slugify.js) - id
// thật luôn nằm ở cuối, nên chỉ cần lấy dãy số cuối cùng là tra được đúng
// sản phẩm bất kể phần chữ. Một link cũ dạng bare "/san-pham/1702" (trước
// khi có slug) vẫn khớp vì toàn bộ chuỗi khi đó cũng chỉ là số.
function extractProductId(param) {
  const match = String(param).match(/(\d+)$/);
  return match ? Number(match[1]) : NaN;
}

async function detail(req, res) {
  const id = extractProductId(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
  });
  if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

  res.json(serializeProduct(product));
}

async function recommendations(req, res) {
  const id = extractProductId(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

  const rec = await prisma.productRecommendation.findUnique({ where: { sourceProductId: id } });
  if (!rec || !rec.recommendedIds.length) return res.json([]);

  const products = await prisma.product.findMany({
    where: { id: { in: rec.recommendedIds } },
    include: PRODUCT_INCLUDE,
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const ordered = rec.recommendedIds.map((pid) => byId.get(pid)).filter(Boolean);

  res.json(ordered.map(serializeProduct));
}

module.exports = { list, detail, recommendations, PRODUCT_INCLUDE, buildOrderBy, extractProductId };
