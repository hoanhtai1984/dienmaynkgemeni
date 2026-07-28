const prisma = require('../lib/prisma');
const { serializeProduct } = require('../utils/serializeProduct');

const PRODUCT_INCLUDE = { category: true, subCategory: true, subSubCategory: true, images: true };

async function list(req, res) {
  const items = await prisma.wishlist.findMany({
    where: { customerId: req.customer.id },
    include: { product: { include: PRODUCT_INCLUDE } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(items.map((w) => serializeProduct(w.product)));
}

async function listIds(req, res) {
  const items = await prisma.wishlist.findMany({
    where: { customerId: req.customer.id },
    select: { productId: true },
  });

  res.json(items.map((w) => w.productId));
}

async function toggle(req, res) {
  const productId = Number(req.body.productId);
  if (!Number.isInteger(productId)) return res.status(400).json({ error: 'Sản phẩm không hợp lệ' });

  const existing = await prisma.wishlist.findUnique({
    where: { customerId_productId: { customerId: req.customer.id, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    return res.json({ added: false });
  }

  await prisma.wishlist.create({ data: { customerId: req.customer.id, productId } });
  res.json({ added: true });
}

module.exports = { list, listIds, toggle };
