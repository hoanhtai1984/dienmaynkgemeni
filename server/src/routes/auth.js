const express = require('express');
const { login, me, logout, changePassword } = require('../controllers/authController');
const requireAdmin = require('../middleware/requireAdmin');
const { createLoginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', createLoginLimiter(), login);
router.get('/me', requireAdmin, me);
router.post('/logout', requireAdmin, logout);
// Dùng chung limiter với login vì đây cũng là chỗ so khớp mật khẩu (rủi ro
// brute-force mật khẩu hiện tại), không dùng limiter lỏng hơn của các thao
// tác tài khoản khác.
router.put('/change-password', requireAdmin, createLoginLimiter(), changePassword);

module.exports = router;
