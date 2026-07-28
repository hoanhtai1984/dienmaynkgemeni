const prisma = require('../lib/prisma');

async function list(req, res) {
  const categories = await prisma.category.findMany({
    orderBy: { position: 'asc' },
    include: {
      subCategories: {
        orderBy: { position: 'asc' },
        include: { subSubCategories: { orderBy: { position: 'asc' } } },
      },
    },
  });
  res.json(categories);
}

async function brands(req, res) {
  const { slug } = req.params;
  const { sub, subsub } = req.query;

  const where = {};
  if (slug && slug !== 'all') where.category = { slug };
  if (sub) where.subCategory = { slug: sub };
  if (subsub) where.subSubCategory = { slug: subsub };

  const products = await prisma.product.findMany({
    where,
    select: { brand: true },
    distinct: ['brand'],
    orderBy: { brand: 'asc' },
  });

  res.json(products.map((p) => p.brand));
}

module.exports = { list, brands };
