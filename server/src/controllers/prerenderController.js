const prisma = require('../lib/prisma');
const { serializeProduct } = require('../utils/serializeProduct');
const { serializePost } = require('./postsController');
const { extractProductId, PRODUCT_INCLUDE } = require('./productsController');
const { escapeHtml } = require('../utils/htmlEscape');

// Trang React (Vite SPA) không render gì cho tới khi JS chạy xong, nên
// crawler không thực thi JS (Facebook/Zalo/Twitter link-preview, một số
// crawler tìm kiếm) sẽ không thấy <title>/meta og:*/JSON-LD của TỪNG sản
// phẩm - chỉ thấy nội dung rỗng của index.html gốc. Route này render sẵn 1
// trang HTML tối giản (không cần React/JS) với đúng metadata + nội dung cơ
// bản, để cấu hình reverse proxy (Nginx, xem DEPLOY.md) hoặc edge middleware
// (client/middleware.js cho Vercel) chuyển hướng ĐÚNG những request có
// User-Agent là crawler tới đây - trình duyệt người dùng thật vẫn luôn thấy
// SPA bình thường như cũ, route này không thay thế trải nghiệm người dùng.
function clientBaseUrl() {
  return (process.env.CLIENT_URL || '').split(',')[0].trim();
}

function apiBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

// Ảnh sản phẩm/bài viết là đường dẫn tương đối "/uploads/..." (phục vụ bởi
// chính server này) hoặc URL tuyệt đối (ảnh ngoài, hiếm) - giống hệt logic
// resolveImageUrl.js phía client, viết lại ở đây vì server không import được
// code phía client.
function resolveImage(req, image) {
  if (!image) return null;
  if (/^https?:\/\//.test(image)) return image;
  return `${apiBaseUrl(req)}${image.startsWith('/') ? '' : '/'}${image}`;
}

function renderHtml({ title, description, image, canonicalUrl, jsonLd, bodyHtml }) {
  const jsonLdScript = jsonLd
    // Escape "<" trong JSON để < - phòng chuỗi trong dữ liệu (vd mô tả
    // sản phẩm chứa "</script>") vô tình đóng sớm thẻ <script> và chèn được
    // HTML/JS tuỳ ý vào trang.
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
${jsonLdScript}
<meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />
</head>
<body>
${bodyHtml}
<p><a href="${escapeHtml(canonicalUrl)}">Xem trang đầy đủ</a></p>
</body>
</html>`;
}

function truncate(text, max) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 3).trimEnd()}...`;
}

async function prerenderProduct(req, res) {
  const id = extractProductId(req.params.slug);
  if (!Number.isInteger(id)) return res.status(404).send('Không tìm thấy sản phẩm');

  const raw = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
  if (!raw) return res.status(404).send('Không tìm thấy sản phẩm');
  const product = serializeProduct(raw);

  const canonicalUrl = `${clientBaseUrl()}/san-pham/${product.slug}`;
  const image = resolveImage(req, product.image);
  const description = truncate(product.description, 160);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: image || undefined,
    description,
    sku: product.sku || undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'VND',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  const bodyHtml = `
<h1>${escapeHtml(product.name)}</h1>
${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" style="max-width:400px" />` : ''}
<p>${escapeHtml(description)}</p>
<p><strong>${escapeHtml(String(product.price))}đ</strong></p>`;

  // noindex - trang này chỉ nên được crawler đọc khi proxy/edge middleware
  // chuyển hướng tới đúng URL canonical (domain client), không phải để tự nó
  // được lập chỉ mục dưới domain API (sẽ thành nội dung trùng lặp).
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('X-Robots-Tag', 'noindex');
  res.send(renderHtml({ title: `${product.name} - Điện Máy NK`, description, image, canonicalUrl, jsonLd, bodyHtml }));
}

async function prerenderPost(req, res) {
  const raw = await prisma.post.findUnique({ where: { slug: req.params.slug } });
  if (!raw) return res.status(404).send('Không tìm thấy bài viết');
  const post = serializePost(raw);

  const canonicalUrl = `${clientBaseUrl()}/tin-tuc/${post.slug}`;
  const image = resolveImage(req, post.image);
  const description = truncate(post.excerpt, 160);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: image || undefined,
    description,
    datePublished: post.publishedAt,
  };

  const bodyHtml = `
<h1>${escapeHtml(post.title)}</h1>
${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(post.title)}" style="max-width:400px" />` : ''}
<p>${escapeHtml(description)}</p>`;

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('X-Robots-Tag', 'noindex');
  res.send(renderHtml({ title: `${post.title} - Điện Máy NK`, description, image, canonicalUrl, jsonLd, bodyHtml }));
}

module.exports = { prerenderProduct, prerenderPost };
