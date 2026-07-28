const isProd = process.env.NODE_ENV === 'production';
// Mặc định SameSite=Lax - đúng cho deploy chung domain (client+API sau 1
// reverse proxy) hoặc dev local (localhost:5173 gọi localhost:4000 vẫn được
// tính "same-site" vì cùng domain, chỉ khác port), và chặn CSRF tốt hơn.
// Deploy client/server ở 2 domain khác nhau (vd client Vercel, server
// Railway - xem .env.production.example) phải set COOKIE_CROSS_SITE=true ở
// server, khi đó bắt buộc SameSite=None (trình duyệt không gửi cookie
// cross-site với Lax/Strict) kèm Secure (bắt buộc HTTPS - SameSite=None
// thiếu Secure sẽ bị trình duyệt từ chối set cookie).
const crossSite = process.env.COOKIE_CROSS_SITE === 'true';
const sameSite = crossSite ? 'none' : 'lax';
const secure = isProd || crossSite;

const ADMIN_COOKIE = 'dmnk_admin_token';
const CUSTOMER_COOKIE = 'dmnk_customer_token';
const ADMIN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // khớp expiresIn '7d' khi ký JWT admin
const CUSTOMER_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // khớp expiresIn '30d' khi ký JWT khách hàng

function cookieOpts(maxAge) {
  return { httpOnly: true, secure, sameSite, path: '/', maxAge };
}

function setAdminCookie(res, token) {
  res.cookie(ADMIN_COOKIE, token, cookieOpts(ADMIN_MAX_AGE));
}

function clearAdminCookie(res) {
  res.clearCookie(ADMIN_COOKIE, { httpOnly: true, secure, sameSite, path: '/' });
}

function setCustomerCookie(res, token) {
  res.cookie(CUSTOMER_COOKIE, token, cookieOpts(CUSTOMER_MAX_AGE));
}

function clearCustomerCookie(res) {
  res.clearCookie(CUSTOMER_COOKIE, { httpOnly: true, secure, sameSite, path: '/' });
}

// Đọc token từ cookie HttpOnly trước (cách chính, trình duyệt tự gửi kèm) -
// rơi về header Authorization: Bearer nếu không có cookie, để tương thích
// với test suite (supertest dùng header) và các client không phải trình
// duyệt (app di động, script gọi API trực tiếp...) không có cookie jar.
function getToken(req, cookieName) {
  if (req.cookies?.[cookieName]) return req.cookies[cookieName];
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

module.exports = {
  ADMIN_COOKIE,
  CUSTOMER_COOKIE,
  setAdminCookie,
  clearAdminCookie,
  setCustomerCookie,
  clearCustomerCookie,
  getToken,
};
