// Nhập catalog thật từ dữ liệu Shopee đã ghép sẵn (shopee-products-data.json).
// KHÁC với seed.js: đây là import một lần dữ liệu kinh doanh thật, không phải
// dữ liệu demo, nên không nằm trong `prisma db seed` mặc định.
//
// Yêu cầu trước khi chạy: đã tải ảnh bìa về server/uploads/products/ với tên
// file shopee-<id>.jpg (xem local_image trong shopee-products-data.json).
// Ảnh KHÔNG được commit vào git (server/uploads/products/* bị gitignore) -
// cần backup riêng thư mục này, không chỉ dựa vào git.
//
// Chạy: node prisma/import-shopee-products.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { buildProductSlug } = require('../src/utils/slugify');
const prisma = new PrismaClient();

// Các danh mục Shopee này khớp đúng với sub-subcategory đã có sẵn trong
// "Đồ Gia Dụng Nhà Bếp" (xem CATEGORIES trong seed.js).
const SUBSUB_BY_SHOPEE_CATEGORY_ID = {
  '100207': 'noi-com-dien',
  '100198': 'noi-chien-khong-dau',
  '100194': 'may-pha-ca-phe',
  '100200': 'lo-vi-song',
  '100193': 'may-xay-sinh-to',
};

function categoryId(raw) {
  return raw.split(' - ')[0].trim();
}

function stripBullet(line) {
  return line.replace(/^[\s*•·▪✔️✅➡️📍\-–—]+/u, '').trim();
}

// Mô tả Shopee gốc thường nhúng sẵn các dòng "Tên thông số: Giá trị" xen kẽ
// giữa các đoạn quảng cáo. Tách các dòng đó ra làm specs có cấu trúc, phần
// còn lại giữ làm mô tả sản phẩm (loại bỏ link ảnh nhúng).
function extractSpecsFromDescription(desc) {
  const specs = {};
  const descLines = [];
  for (const rawLine of desc.split('\n')) {
    if (rawLine.trim().startsWith('http')) continue;
    const line = stripBullet(rawLine);
    if (!line) { descLines.push(rawLine); continue; }
    const m = line.match(/^([^:：]{2,35}?)[:：]\s*(\S.{0,100})$/u);
    if (m) {
      const key = m[1].trim();
      const value = m[2].trim();
      const wordCount = key.split(/\s+/).length;
      if (wordCount <= 6 && !/[.!?]$/.test(key) && !/[.!?]$/.test(value) && value.length <= 100 && !(key in specs)) {
        specs[key] = value;
        continue;
      }
    }
    descLines.push(rawLine);
  }
  const description = descLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 2000);
  return { specs, description };
}

async function main() {
  const dataPath = path.join(__dirname, 'shopee-products-data.json');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const categories = await prisma.category.findMany();
  const subCategories = await prisma.subCategory.findMany();
  const subSubCategories = await prisma.subSubCategory.findMany();

  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  const subBySlug = Object.fromEntries(subCategories.map((s) => [s.slug, s.id]));
  const subSubBySlug = Object.fromEntries(subSubCategories.map((s) => [s.slug, s.id]));

  console.log('Deleting existing products...');
  const deleted = await prisma.product.deleteMany({});
  console.log(`  Deleted ${deleted.count} products.`);

  console.log('Importing Shopee products...');
  let created = 0;
  let missingImage = 0;
  for (const p of products) {
    const imagePath = path.join(__dirname, '../uploads', p.local_image.replace(/^\/uploads\//, ''));
    if (!fs.existsSync(imagePath)) missingImage++;

    const shopeeCategoryId = categoryId(p.category_raw);
    const subSubSlug = SUBSUB_BY_SHOPEE_CATEGORY_ID[shopeeCategoryId];

    const { specs, description } = extractSpecsFromDescription(p.description);
    const hasSizeSpec = Object.keys(specs).some((k) => k.includes('Kích thước'));
    const hasBrandSpec = Object.keys(specs).some((k) => k === 'Thương hiệu' || k === 'Nhà sản xuất');
    if (!('Cân nặng' in specs) && p.weight) specs['Cân nặng'] = `${Math.round(Number(p.weight))} g`;
    if (!hasSizeSpec && p.dims && p.dims[0] && p.dims[1] && p.dims[2]) {
      specs['Kích thước'] = `${p.dims[0]} x ${p.dims[1]} x ${p.dims[2]} cm`;
    }
    if (!hasBrandSpec && p.brand) specs['Thương hiệu'] = p.brand;
    // Giới hạn số dòng thông số để bảng không quá dài trên trang chi tiết.
    const cappedSpecs = Object.fromEntries(Object.entries(specs).slice(0, 20));

    const createdProduct = await prisma.product.create({
      data: {
        name: p.name.slice(0, 255),
        brand: p.brand || 'Khác',
        price: Math.round(p.price),
        oldPrice: Math.round(p.price),
        rating: 4.5,
        reviewCount: Math.floor(Math.random() * 40) + 3,
        sold: 0,
        stock: Math.max(0, Math.round(Number(p.stock) || 0)),
        description: description || p.name,
        specs: cappedSpecs,
        categoryId: catBySlug[p.category_slug],
        subCategoryId: subBySlug[p.subcategory_slug],
        subSubCategoryId: subSubSlug ? subSubBySlug[subSubSlug] : null,
        images: { create: [{ url: p.local_image, position: 0 }] },
      },
    });
    // slug cần id thật (tự tăng) nên phải update lại sau khi biết id.
    await prisma.product.update({
      where: { id: createdProduct.id },
      data: { slug: buildProductSlug(createdProduct.name, createdProduct.id) },
    });
    created++;
    if (created % 100 === 0) console.log(`  ... ${created}/${products.length}`);
  }

  console.log(`Done. Created ${created} products.`);
  if (missingImage > 0) {
    console.log(`WARNING: ${missingImage} products reference an image file that does not exist on disk.`);
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
