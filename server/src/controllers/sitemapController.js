const prisma = require('../lib/prisma');

// Trang tĩnh quan trọng cho SEO - không gồm /gio-hang, /so-sanh, /dat-hang-thanh-cong,
// /dat-lai-mat-khau (không có giá trị tìm kiếm, xem thêm robots.txt).
const STATIC_PATHS = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/danh-muc', priority: '0.9', changefreq: 'daily' },
  { path: '/tin-tuc', priority: '0.6', changefreq: 'weekly' },
  { path: '/gioi-thieu', priority: '0.4', changefreq: 'monthly' },
  { path: '/huong-dan-mua-hang', priority: '0.4', changefreq: 'monthly' },
  { path: '/cau-hoi-thuong-gap', priority: '0.4', changefreq: 'monthly' },
  { path: '/chinh-sach-bao-hanh', priority: '0.3', changefreq: 'monthly' },
  { path: '/chinh-sach-doi-tra', priority: '0.3', changefreq: 'monthly' },
  { path: '/van-chuyen', priority: '0.3', changefreq: 'monthly' },
  { path: '/chinh-sach-thanh-toan', priority: '0.3', changefreq: 'monthly' },
  { path: '/chinh-sach-kiem-hang', priority: '0.3', changefreq: 'monthly' },
  { path: '/dieu-khoan-dich-vu', priority: '0.3', changefreq: 'monthly' },
  { path: '/chinh-sach-bao-mat', priority: '0.3', changefreq: 'monthly' },
  { path: '/chinh-sach-bao-ve-du-lieu-ca-nhan', priority: '0.3', changefreq: 'monthly' },
  { path: '/quy-trinh-giai-quyet-khieu-nai', priority: '0.3', changefreq: 'monthly' },
  { path: '/lien-he', priority: '0.4', changefreq: 'monthly' },
];

function xmlEscape(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function urlEntry(baseUrl, path, lastmod, priority, changefreq) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(baseUrl + path)}</loc>`,
    lastmod ? `    <lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : '',
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority ? `    <priority>${priority}</priority>` : '',
    '  </url>',
  ].filter(Boolean).join('\n');
}

async function sitemap(req, res) {
  // Sitemap phải trỏ về domain CLIENT (nơi thật sự phục vụ /san-pham/...,
  // /tin-tuc/... qua React Router) chứ không phải domain của chính server API
  // này - 2 domain có thể khác nhau khi deploy (vd client Vercel, server
  // Railway/VPS riêng, xem DEPLOY.md). CLIENT_URL có thể là danh sách nhiều
  // origin cách nhau dấu phẩy - lấy cái đầu tiên làm domain chính thức.
  const configuredClientUrl = (process.env.CLIENT_URL || '').split(',')[0].trim();
  const baseUrl = configuredClientUrl || `${req.protocol}://${req.get('host')}`;

  const [products, posts] = await Promise.all([
    prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.post.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const entries = [
    ...STATIC_PATHS.map((p) => urlEntry(baseUrl, p.path, null, p.priority, p.changefreq)),
    ...products.map((p) => urlEntry(baseUrl, `/san-pham/${p.slug}`, p.updatedAt, '0.7', 'weekly')),
    ...posts.map((p) => urlEntry(baseUrl, `/tin-tuc/${p.slug}`, p.updatedAt, '0.5', 'monthly')),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
}

module.exports = { sitemap };
