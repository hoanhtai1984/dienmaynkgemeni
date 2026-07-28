const logger = require('../lib/logger');
const { captureException } = require('../lib/sentry');

function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  logger.error(
    { err, status, method: req.method, url: req.originalUrl },
    err.message || 'Unhandled error'
  );
  // Chỉ báo lên Sentry lỗi 5xx thật sự (bug/crash) - lỗi 4xx (validation,
  // sai mật khẩu...) là hành vi bình thường của người dùng, không phải sự
  // cố cần cảnh báo.
  if (status >= 500) captureException(err);

  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { notFound, errorHandler };
