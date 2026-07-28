const pino = require('pino');

// Log có cấu trúc (JSON: timestamp, level, message, stack...) thay vì
// console.error rải rác - dễ tìm kiếm/lọc khi xem log trên server thật,
// và là chỗ duy nhất cần đổi nếu sau này chuyển sang gửi log đi nơi khác.
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
});

module.exports = logger;
