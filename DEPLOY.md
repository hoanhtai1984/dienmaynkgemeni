# Hướng Dẫn Deploy - Điện Máy NK

Runbook này hướng dẫn đưa ứng dụng full-stack (React + Node/Express/Prisma + Python/FastAPI + MySQL) từ máy local lên production. Xem [README.md](README.md) để biết cấu trúc repo và cách chạy local.

## 1. Kiến trúc tổng quan

```
client/       React + Vite    →  build tĩnh, deploy lên static host (Vercel/Netlify/Cloudflare Pages)
server/       Express + Prisma →  deploy lên Node host (Railway/Render/VPS)
ai-service/   FastAPI + APScheduler →  deploy lên Python host (Railway/Render/VPS) - có thể bỏ qua nếu chưa cần chatbot/gợi ý/báo cáo
MySQL         →  managed MySQL (Railway/PlanetScale/Aiven) hoặc MySQL cài trên VPS
```

Bốn mảnh chạy độc lập, chỉ liên lạc qua HTTP (client gọi Node qua `VITE_API_URL`, gọi thẳng ai-service qua `VITE_AI_SERVICE_URL` cho chatbot; ai-service và server cùng đọc/ghi một MySQL, không gọi trực tiếp lẫn nhau). Không bắt buộc phải cùng nhà cung cấp. `ai-service` không phải phụ thuộc bắt buộc — nếu tắt hoặc chưa deploy, toàn bộ site (trừ chatbot, gợi ý sản phẩm, báo cáo bán hàng trong admin) vẫn hoạt động bình thường.

**Lưu ý về ảnh upload:** `server/uploads/products/` là thư mục lưu ảnh admin upload trên **đĩa cục bộ** của server. Nếu host server trên nền tảng có đĩa tạm thời (ephemeral disk — ví dụ Render/Railway free tier khi redeploy sẽ mất file), ảnh upload sẽ biến mất sau lần deploy tiếp theo. Với dự án thật, nên chuyển sang lưu ảnh ở object storage (Cloudinary, S3, R2...). Với đồ án/học tập, deploy lên VPS có đĩa persistent (hoặc dùng volume mount nếu nền tảng hỗ trợ) là đủ.

**Quan trọng:** thư mục này hiện chứa ~540 ảnh sản phẩm thật (nhập từ Shopee qua `server/prisma/import-shopee-products.js`, dữ liệu nguồn ở `server/prisma/shopee-products-data.json`) — không phải ảnh demo. Thư mục bị gitignore nên **git không backup ảnh này** — cần tự sao lưu riêng (zip thư mục `server/uploads/products/`) trước khi xóa máy/đổi máy, vì file `shopee-products-data.json` chỉ chứa dữ liệu văn bản, không có ảnh.

**Checklist deploy lên server mới (để có đủ 539 sản phẩm thật + ảnh, không phải 83 sản phẩm demo):**

1. Deploy code lên server (git clone/pull — `git push` không mang theo ảnh, chỉ mang code).
2. Chạy `npx prisma migrate deploy` để tạo bảng (chưa có dữ liệu).
3. Copy thủ công ~230MB ảnh đã sao lưu vào đúng `server/uploads/products/` trên server mới (không dùng git, không dùng `prisma db seed`).
4. Chạy `node prisma/import-shopee-products.js` để nhập 539 sản phẩm thật (script này tự xóa sản phẩm cũ nếu có rồi nhập lại — **không** chạy `prisma db seed` sau bước này vì seed sẽ ghi đè lại bằng 83 sản phẩm demo).
5. Seed tài khoản admin riêng nếu cần, qua `ADMIN_EMAIL`/`ADMIN_PASSWORD` trong `.env` của server.

## 2. Chuẩn bị MySQL production

Chọn 1 trong 2 hướng:

- **Managed MySQL** (khuyến nghị, đơn giản): Railway MySQL, PlanetScale, Aiven — tạo database, lấy connection string dạng `mysql://user:password@host:3306/dbname`.
- **Tự cài trên VPS**: cài MySQL 8, tạo database + user riêng cho ứng dụng (không dùng `root`).

Sau khi có `DATABASE_URL` thật, chạy migrate để khởi tạo schema (chưa có dữ liệu):

```bash
cd server
DATABASE_URL="mysql://..." npx prisma migrate deploy
```

(`migrate deploy` khác `migrate dev` — không hỏi tương tác, dùng đúng cho production, chỉ áp các migration đã có sẵn trong `prisma/migrations/`.)

Sau bước này, chọn **một** trong hai cách để có dữ liệu sản phẩm — **không chạy cả hai**:

- Muốn có ngay 539 sản phẩm thật (đã nhập từ Shopee, kèm ảnh) — làm theo đúng checklist ở mục 1 (copy ảnh + chạy `import-shopee-products.js`).
- Chỉ cần dữ liệu demo để test nhanh — chạy `DATABASE_URL="mysql://..." npx prisma db seed` (tạo ~83 sản phẩm mẫu, không có ảnh thật). **Không** chạy lệnh này sau khi đã import Shopee — seed sẽ xóa và ghi đè lại bằng dữ liệu demo.

**Nếu tự cài MySQL trên VPS (không dùng managed MySQL có backup tự động):** bắt buộc tự đặt lịch sao lưu, ví dụ cron chạy `mysqldump` mỗi đêm và đẩy file `.sql` ra khỏi VPS (S3, Google Drive, hoặc máy khác) — một khi có đơn hàng thật, mất dữ liệu ở đây đồng nghĩa mất toàn bộ lịch sử đơn hàng/khách hàng.

## 3. Deploy server (Express + Prisma)

1. Trên host (Railway/Render/VPS), trỏ root directory về `server/`.
2. Build command: `npm install && npx prisma generate`
3. Start command: `npm start` (chạy `node src/index.js`)
4. Khai báo biến môi trường theo [server/.env.production.example](server/.env.production.example):
   - `DATABASE_URL` — connection string MySQL production
   - `PORT` — cổng host yêu cầu (nhiều nền tảng tự set qua biến `PORT`, Express đã đọc `process.env.PORT`)
   - `JWT_SECRET` — chuỗi ngẫu nhiên dài, **khác** với giá trị dev, không commit vào git
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — chỉ dùng khi seed lần đầu, sau đó nên đăng nhập admin rồi đổi mật khẩu ngay qua "Đổi mật khẩu" ở góc trên bên phải (gọi `PUT /api/auth/change-password`), không để nguyên mật khẩu seed dùng lâu dài
   - `CLIENT_URL` — domain thật của client đã deploy (vd `https://dienmaynk.vercel.app`), **không để localhost**
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` — **bắt buộc để tính năng "Quên mật khẩu" của khách hàng gửi được email thật**. Nếu bỏ trống, link đặt lại mật khẩu chỉ được in ra log server (khách hàng sẽ không nhận được gì) — chỉ chấp nhận được khi test ở local, không dùng cho production.
   - `SENTRY_DSN` — khuyến nghị mạnh cho production. Không có thì lỗi ngầm (server crash, chatbot lỗi lúc nửa đêm...) chỉ nằm im trong log, không ai biết cho tới khi khách phàn nàn. Tạo tài khoản miễn phí tại [sentry.io](https://sentry.io), tạo project Node.js, dán DSN được cấp vào đây.
   - `SECRETS_ENCRYPTION_KEY` — bắt buộc, mã hoá mật khẩu SMTP/Facebook App Secret lưu trong DB. Tạo bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `NODE_ENV=production` — **bắt buộc set thủ công nếu host không tự set sẵn** (nhiều PaaS như Railway/Render tự set, VPS/PM2 thì không). Thiếu biến này, cookie phiên đăng nhập sẽ thiếu cờ `Secure` (vẫn hoạt động qua HTTPS nhưng kém an toàn hơn) và CORS sẽ lỏng lẻo hơn cần thiết (tự cho phép mọi origin dạng LAN/localhost).
   - `COOKIE_CROSS_SITE=true` — **chỉ set khi client và server ở 2 domain khác nhau** (đúng kịch bản dưới đây: client Vercel, server Railway). Cookie phiên đăng nhập mặc định `SameSite=Lax` (an toàn hơn, chặn CSRF tốt) chỉ hoạt động khi client/server "cùng site" (kể cả khác port, như localhost lúc dev) - khác domain thật sự thì bắt buộc `SameSite=None` mới được trình duyệt gửi kèm cookie, biến này bật đúng chế độ đó (kèm middleware kiểm tra Origin để bù lại phần CSRF protection bị mất).
5. Nếu dùng VPS thay vì PaaS: chạy bằng PM2 (`pm2 start src/index.js --name dienmaynk-api`) để tự restart khi crash, và đặt Nginx làm reverse proxy + HTTPS (Let's Encrypt/Certbot) phía trước cổng Node.

## 4. Deploy AI service (FastAPI + APScheduler)

Bỏ qua mục này nếu bạn chưa cần chatbot/gợi ý sản phẩm/báo cáo bán hàng — phần còn lại của site không phụ thuộc vào service này.

1. Trên host (Railway/Render/VPS), trỏ root directory về `ai-service/`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Khai báo biến môi trường theo [ai-service/.env.example](ai-service/.env.example):
   - `DATABASE_URL` — **cùng một MySQL production** với server Node, nhưng dùng driver `mysql+pymysql://` thay vì `mysql://` (khác cú pháp Prisma dùng)
   - `CLIENT_URL` — domain thật của client đã deploy, dùng để cấu hình CORS cho endpoint `/chatbot` (client gọi thẳng service này, không qua Node)
5. Chạy 1 process duy nhất là đủ — các job (cập nhật giá, phân tích bán hàng, gợi ý sản phẩm) chạy nền trong cùng process qua APScheduler, không cần cron riêng ở tầng OS.
6. Nếu dùng VPS: chạy bằng PM2 hoặc systemd (`pm2 start "venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000" --name dienmaynk-ai`), Nginx reverse proxy như server Node.

## 5. Deploy client (React build tĩnh)

1. Trước khi build, đảm bảo `client/.env.production` (tự tạo, không commit) có:
   ```
   VITE_API_URL=https://your-backend-domain.com
   VITE_AI_SERVICE_URL=https://your-ai-service-domain.com
   ```
   trỏ đúng domain server/ai-service đã deploy ở bước 3-4 — **không phải localhost**. Nếu chưa deploy `ai-service`, để trống hoặc trỏ tạm về server Node cũng được — chatbot sẽ chỉ báo lỗi kết nối, không crash cả trang.
2. Build: `cd client && npm install && npm run build` → sinh ra thư mục `client/dist/`.
3. Deploy `dist/` lên static host (Vercel/Netlify/Cloudflare Pages): trỏ root directory `client/`, build command `npm run build`, output directory `dist`.
4. **Bắt buộc cấu hình SPA fallback**: mọi route không khớp file tĩnh phải trả về `index.html` (để React Router xử lý), nếu không các URL như `/san-pham/12` sẽ ra lỗi 404 khi truy cập trực tiếp/refresh. Vercel/Netlify tự nhận diện Vite SPA và làm điều này mặc định; nếu tự host bằng Nginx, thêm `try_files $uri /index.html;`.

## 6. SEO cho crawler không chạy JS (Facebook/Zalo/Twitter share preview)

Client là Vite SPA - không render gì cho tới khi JS tải xong, nên crawler không thực thi JS (Facebook/Zalo/Twitter link-preview khi dán link, một số crawler tìm kiếm) sẽ không thấy `<title>`/mô tả/ảnh của từng sản phẩm/bài viết, chỉ thấy `index.html` gốc rỗng.

Server Node có sẵn 2 route render sẵn HTML tối giản (đủ `<title>`/`og:*`/JSON-LD, không cần JS) tại `GET /prerender/san-pham/:slug` và `GET /prerender/tin-tuc/:slug` (xem `server/src/controllers/prerenderController.js`). Cần **chuyển hướng đúng request của crawler** (không phải người dùng thật) từ URL thật (`/san-pham/...`, `/tin-tuc/...` trên domain client) sang các route này mà **vẫn giữ nguyên URL** crawler nhìn thấy - chọn 1 trong 2 cách theo đúng cách bạn deploy client ở mục 5:

- **Deploy client lên Vercel:** đã có sẵn `client/middleware.js` (Vercel Edge Middleware, tự động được Vercel nhận diện khi build) - chỉ cần đảm bảo biến môi trường `VITE_API_URL` được khai báo trong Vercel project settings (không chỉ trong `.env.production` lúc build, vì Edge Middleware đọc `process.env` lúc runtime). Không cần làm gì thêm.
- **Tự host bằng Nginx (VPS):** thêm vào server block của Nginx (đứng trước block `try_files $uri /index.html;` phục vụ SPA):
  ```nginx
  map $http_user_agent $is_bot {
      default 0;
      "~*facebookexternalhit|Facebot|Twitterbot|Slackbot|WhatsApp|TelegramBot|Zalo|LinkedInBot|Pinterest|Discordbot|Googlebot|bingbot|YandexBot|DuckDuckBot|Applebot" 1;
  }

  location ~ ^/(san-pham|tin-tuc)/(.+)$ {
      if ($is_bot) {
          rewrite ^/(san-pham|tin-tuc)/(.+)$ /prerender/$1/$2 break;
          proxy_pass http://127.0.0.1:4000;  # đổi thành host:port thật của server Node
      }
      try_files $uri /index.html;
  }
  ```
  Đổi `http://127.0.0.1:4000` thành địa chỉ thật của server Node nếu chạy khác máy. Test bằng `curl -A "facebookexternalhit/1.1" https://your-domain.com/san-pham/ten-slug` - phải thấy HTML có đủ thẻ `og:*`, không phải SPA rỗng.

Nếu bỏ qua mục này: site vẫn hoạt động bình thường với người dùng thật và Googlebot (Google thực thi JS tốt) - chỉ ảnh hưởng preview khi chia sẻ link sản phẩm/bài viết lên Facebook/Zalo/Twitter (sẽ hiện tiêu đề/ảnh trang chủ chung thay vì đúng của từng sản phẩm).

## 7. Sau khi deploy — checklist kiểm tra

- [ ] `GET https://your-backend-domain.com/api/health` trả `{"status":"ok"}`
- [ ] `GET https://your-ai-service-domain.com/health` trả `{"status":"ok"}` (nếu đã deploy ai-service)
- [ ] Trang chủ client load được sản phẩm thật (không phải lỗi CORS — nếu thấy request bị chặn, kiểm tra lại `CLIENT_URL` trên server/ai-service có khớp đúng domain client)
- [ ] Đăng nhập admin (`/admin/login`) hoạt động với `ADMIN_EMAIL`/`ADMIN_PASSWORD` đã seed, sau đó đổi mật khẩu ngay qua "Đổi mật khẩu"
- [ ] Đặt thử 1 đơn hàng thật, xem xuất hiện trong `/admin/orders`
- [ ] Refresh trực tiếp một trang con (vd `/danh-muc?cat=dien-tu`) không bị lỗi 404 (xác nhận SPA fallback đã cấu hình đúng)
- [ ] Upload ảnh sản phẩm mới trong admin, tải lại trang xem ảnh còn hiển thị đúng (kiểm tra vấn đề ephemeral disk nêu ở mục 1)
- [ ] Mở chat widget (góc dưới phải), gửi thử tin nhắn, nhận được phản hồi từ ai-service
- [ ] Trang chi tiết sản phẩm hiển thị "Sản phẩm liên quan", trang `/admin/reports` hiển thị báo cáo bán hàng
- [ ] Nếu đã cấu hình `SENTRY_DSN`: cố tình gây 1 lỗi (vd gọi API với dữ liệu sai) rồi kiểm tra lỗi đó xuất hiện trong dashboard Sentry
- [ ] Đã cấu hình prerender cho crawler (mục 6): `curl -A "facebookexternalhit/1.1" https://your-frontend-domain.com/san-pham/ten-slug-that` trả về HTML có `og:title`/`og:image` đúng sản phẩm, không phải SPA rỗng
