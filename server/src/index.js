require('dotenv').config();
const logger = require('./lib/logger');
const { captureException } = require('./lib/sentry'); // require sớm để khởi tạo trước khi app chạy
const app = require('./app');

// Một lỗi không được bắt (bug thật) trước đây sẽ chỉ in stack trace ra
// console rồi có thể khiến process chết âm thầm hoặc treo ở trạng thái không
// xác định - giờ được log có cấu trúc + báo lên Sentry (nếu đã cấu hình)
// trước khi thoát, để nodemon/PM2 tự khởi động lại tiến trình mới, sạch.
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception - process will exit');
  captureException(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
  captureException(reason instanceof Error ? reason : new Error(String(reason)));
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`);
});
