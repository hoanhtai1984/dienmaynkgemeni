// robots.txt trước đây khai báo "Sitemap: /sitemap.xml" (đường dẫn tương
// đối) - chỉ đúng khi client và server API phục vụ cùng domain (vd VPS +
// Nginx reverse proxy). Nếu deploy client/server ở 2 domain khác nhau (vd
// client Vercel, server Railway riêng - đúng như .env.production.example),
// crawler sẽ tìm sitemap ở domain client và không thấy gì.
// Script này chạy trước dev/build (xem package.json "predev"/"prebuild"),
// đọc VITE_API_URL - biến môi trường client đã dùng sẵn để gọi API - để tự
// sinh public/robots.txt với URL sitemap tuyệt đối trỏ đúng domain server.
// Để trống VITE_API_URL (mặc định khi dev/deploy chung domain) thì vẫn dùng
// đường dẫn tương đối như cũ, không cần cấu hình thêm gì.
const fs = require('fs');
const path = require('path');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const result = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return result;
}

const rootDir = path.join(__dirname, '..');
// .env.production (nếu có, tự tạo khi deploy thật - xem .env.production.example)
// ghi đè .env dev, giống cách Vite tự chọn file env theo mode. Không dựa vào
// NODE_ENV để chọn file (npm script "VAR=value cmd" không chạy được trên cmd.exe
// của Windows) - đơn giản là đọc cả 2, file production tồn tại thì ưu tiên.
const env = {
  ...readEnvFile(path.join(rootDir, '.env')),
  ...readEnvFile(path.join(rootDir, '.env.production')),
  ...process.env,
};

const apiUrl = (env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const sitemapUrl = apiUrl ? `${apiUrl}/sitemap.xml` : '/sitemap.xml';

const content = `User-agent: *
Disallow: /admin/
Disallow: /gio-hang
Disallow: /dat-hang-thanh-cong
Disallow: /dat-lai-mat-khau
Disallow: /so-sanh

Sitemap: ${sitemapUrl}
`;

fs.writeFileSync(path.join(rootDir, 'public', 'robots.txt'), content);
console.log(`[generate-robots] public/robots.txt -> Sitemap: ${sitemapUrl}`);
