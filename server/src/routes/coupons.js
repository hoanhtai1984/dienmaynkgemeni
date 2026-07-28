const express = require('express');
const { createAccountActionLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../controllers/couponsController');

const router = express.Router();

// Giới hạn dò mã giảm giá hàng loạt (brute-force) - dùng chung bucket với
// đăng ký/quên mật khẩu vì cùng mức độ rủi ro (không phải đăng nhập, nhưng
// vẫn không nên cho thử vô hạn lần).
router.post('/validate', createAccountActionLimiter(), validate);

module.exports = router;
