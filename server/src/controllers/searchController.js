const prisma = require('../lib/prisma');
const { serializeProduct } = require('../utils/serializeProduct');
const { PRODUCT_INCLUDE } = require('./productsController');

async function suggest(req, res) {
  const q = (req.query.q || '').trim();
  const limit = Math.min(Number(req.query.limit) || 6, 20);

  if (!q) return res.json([]);

  const products = await prisma.product.findMany({
    where: {
      OR: [{ name: { contains: q } }, { brand: { contains: q } }],
    },
    include: PRODUCT_INCLUDE,
    take: limit,
  });

  res.json(products.map(serializeProduct));
}

module.exports = { suggest };
