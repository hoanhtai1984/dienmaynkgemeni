// Edge Middleware của Vercel - chỉ chạy khi deploy client lên Vercel (bị bỏ
// qua hoàn toàn ở dev/Netlify/VPS). Vite SPA không render gì cho tới khi JS
// tải xong, nên crawler không chạy JS (Facebook/Zalo/Twitter link-preview,
// một số crawler tìm kiếm) sẽ không thấy title/mô tả/ảnh của TỪNG sản phẩm
// khi bấm vào link - chỉ thấy index.html rỗng ban đầu.
//
// Middleware này bắt các request có User-Agent là crawler tới /san-pham/* và
// /tin-tuc/*, lấy HTML đã render sẵn (đủ metadata) từ endpoint /prerender/...
// của server Node, rồi trả thẳng nội dung đó - URL trên thanh địa chỉ (và
// URL crawler ghi nhận) vẫn giữ nguyên /san-pham/..., không bị đổi thành URL
// của server. Người dùng thật (User-Agent trình duyệt bình thường) không đi
// qua nhánh này, luôn nhận SPA như cũ - middleware này không đổi trải nghiệm
// người dùng.
//
// Cấu hình bắt buộc: biến môi trường VITE_API_URL phải trỏ đúng domain server
// Node đã deploy (xem DEPLOY.md mục 5) - thiếu biến này middleware tự bỏ qua,
// không lỗi, chỉ đơn giản là crawler vẫn thấy SPA rỗng như trước khi có middleware.
export const config = {
  matcher: ['/san-pham/:path*', '/tin-tuc/:path*'],
};

const BOT_UA_RE =
  /facebookexternalhit|Facebot|Twitterbot|Slackbot|WhatsApp|TelegramBot|Zalo|LinkedInBot|Pinterest|Discordbot|Googlebot|bingbot|YandexBot|DuckDuckBot|Applebot/i;

export default async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';
  if (!BOT_UA_RE.test(userAgent)) return; // không trả gì - Vercel tự phục vụ SPA bình thường

  const apiBase = process.env.VITE_API_URL;
  if (!apiBase) return;

  const url = new URL(request.url);
  const prerenderPath = url.pathname.replace(/^\/(san-pham|tin-tuc)\//, '/prerender/$1/');

  try {
    const upstream = await fetch(`${apiBase}${prerenderPath}`);
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch {
    // Server API không phản hồi được - để crawler thấy SPA rỗng còn hơn báo lỗi.
    return;
  }
}
