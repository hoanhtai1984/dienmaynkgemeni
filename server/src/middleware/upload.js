const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

function fileFilter(req, file, cb) {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, png, webp, gif)'));
  }
}

// Giữ file tạm trong bộ nhớ (không ghi thẳng ra đĩa) - convertToWebp bên dưới
// dùng sharp chuyển sang .webp rồi mới ghi file thật, nên ảnh gốc (jpg/png/
// gif...) không bao giờ tồn tại trên server, kể cả tạm thời.
const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const PRODUCTS_DIR = path.join(__dirname, '../../uploads/products');

// Chạy sau upload.array(...): chuyển mỗi file trong bộ nhớ (req.files[i].buffer)
// sang .webp và ghi ra đĩa, rồi gắn lại `filename` giống hệt multer.diskStorage
// làm trước đây, để code ở controller (đọc file.filename) không cần đổi gì.
async function convertToWebp(req, res, next) {
  if (!req.files || req.files.length === 0) return next();
  try {
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const filename = `${Date.now()}-${i}-${Math.round(Math.random() * 1e9)}.webp`;
      await sharp(file.buffer).webp({ quality: 82 }).toFile(path.join(PRODUCTS_DIR, filename));
      file.filename = filename;
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, convertToWebp };
