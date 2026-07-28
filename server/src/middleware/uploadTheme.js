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

// Giống upload.js (ảnh sản phẩm) nhưng chỉ nhận 1 file/lần - dùng cho ảnh nền
// theo từng khu vực (header/footer/section) ở Admin > Cài đặt > Giao diện.
const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const THEME_DIR = path.join(__dirname, '../../uploads/theme');

async function convertToWebp(req, res, next) {
  if (!req.file) return next();
  try {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    await sharp(req.file.buffer).webp({ quality: 82 }).toFile(path.join(THEME_DIR, filename));
    req.file.filename = filename;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, convertToWebp };
