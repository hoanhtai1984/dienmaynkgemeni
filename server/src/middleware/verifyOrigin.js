const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Phòng CSRF - quan trọng nhất khi COOKIE_CROSS_SITE=true (SameSite=None,
// xem authCookies.js), vì lúc đó cookie phiên đăng nhập được gửi kèm cả với
// request từ trang khác (SameSite=Lax vốn đã tự chặn phần lớn CSRF, None thì
// không). Yêu cầu đổi trạng thái (POST/PUT/PATCH/DELETE) có header Origin thì
// Origin đó phải nằm trong danh sách domain được phép (dùng chung logic với
// CORS qua isAllowedOrigin). Request không có Origin (curl, app di động,
// server gọi server...) vẫn cho qua - CSRF chỉ khai thác được qua trình
// duyệt, mà trình duyệt luôn tự gắn Origin cho request đổi trạng thái.
function createVerifyOrigin(isAllowedOrigin) {
  return function verifyOrigin(req, res, next) {
    if (!STATE_CHANGING.has(req.method)) return next();
    const origin = req.headers.origin;
    if (!origin || isAllowedOrigin(origin)) return next();
    res.status(403).json({ error: 'Yêu cầu bị từ chối (origin không hợp lệ)' });
  };
}

module.exports = createVerifyOrigin;
