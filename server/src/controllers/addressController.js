const { provinces, wards } = require('../data/vietnamAddress');

// Trả cả 2 danh sách 1 lần (khoảng 200KB) thay vì endpoint riêng cho từng
// tỉnh - client tự lọc phường/xã theo tỉnh đã chọn, tránh round-trip mỗi lần
// đổi dropdown và cho phép cache 1 lần duy nhất trong phiên duyệt web.
function list(req, res) {
  res.json({ provinces, wards });
}

module.exports = { list };
