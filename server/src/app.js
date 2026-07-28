const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const createVerifyOrigin = require('./middleware/verifyOrigin');

const healthRouter = require('./routes/health');
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const searchRouter = require('./routes/search');
const ordersRouter = require('./routes/orders');
const contactRouter = require('./routes/contact');
const authRouter = require('./routes/auth');
const customerAuthRouter = require('./routes/customerAuth');
const postsRouter = require('./routes/posts');
const adminProductsRouter = require('./routes/adminProducts');
const adminOrdersRouter = require('./routes/adminOrders');
const adminReportsRouter = require('./routes/adminReports');
const adminPostsRouter = require('./routes/adminPosts');
const adminCustomersRouter = require('./routes/adminCustomers');
const settingsRouter = require('./routes/settings');
const adminSettingsRouter = require('./routes/adminSettings');
const newsletterRouter = require('./routes/newsletter');
const adminContactsRouter = require('./routes/adminContacts');
const adminChatMessagesRouter = require('./routes/adminChatMessages');
const adminNewsletterRouter = require('./routes/adminNewsletter');
const adminMembersRouter = require('./routes/adminMembers');
const siteStatsRouter = require('./routes/siteStats');
const couponsRouter = require('./routes/coupons');
const adminCouponsRouter = require('./routes/adminCoupons');
const reviewsRouter = require('./routes/reviews');
const adminReviewsRouter = require('./routes/adminReviews');
const wishlistRouter = require('./routes/wishlist');
const addressRouter = require('./routes/address');
const { sitemap } = require('./controllers/sitemapController');
const { prerenderProduct, prerenderPost } = require('./controllers/prerenderController');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Bắt buộc khi server đứng sau reverse proxy (Nginx/VPS, hoặc PaaS như
// Railway/Render) - không có dòng này, req.protocol luôn báo "http" dù
// khách truy cập qua HTTPS thật (proxy nói chuyện nội bộ với Node qua HTTP),
// làm sai URL tuyệt đối build trong prerenderController.js, và req.ip trả về
// IP của chính reverse proxy thay vì IP khách hàng thật (làm rate limiter ở
// rateLimiter.js đếm nhầm tất cả request là cùng 1 IP).
app.set('trust proxy', 1);

// contentSecurityPolicy tắt vì server này chỉ là API JSON + phục vụ ảnh tĩnh
// (/uploads), không render HTML - CSP mặc định của helmet nhắm vào trang
// HTML nên không có tác dụng thật ở đây. crossOriginResourcePolicy phải nới
// thành 'cross-origin' (khác mặc định 'same-origin' của helmet) vì client
// (port/domain khác) cần load ảnh sản phẩm trực tiếp từ /uploads - để mặc
// định sẽ khiến trình duyệt chặn tải ảnh.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CLIENT_URL có thể là danh sách nhiều origin cách nhau bởi dấu phẩy. Ngoài
// production, còn tự cho phép mọi origin dạng localhost/IP mạng LAN riêng
// (192.168.x.x, 10.x.x.x, 172.16-31.x.x) để mở web từ điện thoại thật cùng
// mạng luôn hoạt động mà không cần sửa .env mỗi khi đổi mạng/đổi IP.
const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
const LAN_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
function isAllowedOrigin(origin) {
  if (allowedOrigins.includes(origin)) return true;
  return process.env.NODE_ENV !== 'production' && LAN_ORIGIN_RE.test(origin);
}
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    // Bắt buộc để trình duyệt gửi/nhận cookie phiên đăng nhập (dmnk_admin_token/
    // dmnk_customer_token) qua request cross-origin - client (port 5173) và
    // server (port 4000) là 2 origin khác nhau dù cùng máy.
    credentials: true,
  })
);
app.use(cookieParser());
app.use(createVerifyOrigin(isAllowedOrigin));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Không đặt dưới /api - crawler tìm sitemap.xml ở gốc domain theo quy ước.
app.get('/sitemap.xml', sitemap);

// HTML tối giản có đủ metadata cho crawler không chạy JS - xem giải thích
// đầy đủ ở đầu prerenderController.js. Reverse proxy/edge middleware chuyển
// hướng crawler tới đây, người dùng thật không bao giờ thấy route này.
app.get('/prerender/san-pham/:slug', prerenderProduct);
app.get('/prerender/tin-tuc/:slug', prerenderPost);

app.use('/api/health', healthRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/search', searchRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authRouter);
app.use('/api/customer-auth', customerAuthRouter);
app.use('/api/posts', postsRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/reports', adminReportsRouter);
app.use('/api/admin/posts', adminPostsRouter);
app.use('/api/admin/customers', adminCustomersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin/settings', adminSettingsRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/admin/contacts', adminContactsRouter);
app.use('/api/admin/chat-messages', adminChatMessagesRouter);
app.use('/api/admin/newsletter', adminNewsletterRouter);
app.use('/api/admin/members', adminMembersRouter);
app.use('/api/site-stats', siteStatsRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/admin/coupons', adminCouponsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin/reviews', adminReviewsRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/address', addressRouter);

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
