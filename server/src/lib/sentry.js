const Sentry = require('@sentry/node');
const logger = require('./logger');

// Chưa cấu hình SENTRY_DSN (vd: máy dev, hoặc chưa tạo tài khoản Sentry) thì
// bỏ qua hoàn toàn - lỗi vẫn được log đầy đủ qua logger, chỉ là không có ai
// được báo tự động. Khi deploy thật, tạo tài khoản Sentry miễn phí, lấy DSN
// và khai báo SENTRY_DSN trong .env để bật báo lỗi tự động (xem .env.example).
const enabled = Boolean(process.env.SENTRY_DSN);

if (enabled) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'development' });
  logger.info('Sentry error tracking enabled');
} else {
  logger.info('SENTRY_DSN not set - error tracking disabled, errors are still logged locally');
}

function captureException(err) {
  if (enabled) Sentry.captureException(err);
}

module.exports = { Sentry, enabled, captureException };
