// Điền slug cho các sản phẩm đã tồn tại trước khi cột slug có (one-off, an
// toàn chạy lại nhiều lần - không xóa/tạo lại gì, chỉ set slug nếu thiếu).
// Chạy: node prisma/backfill-product-slugs.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { buildProductSlug } = require('../src/utils/slugify');

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });

  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { slug: buildProductSlug(p.name, p.id) },
    });
  }

  console.log(`Backfilled slug for ${products.length} product(s).`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
