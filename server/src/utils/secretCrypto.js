const crypto = require('crypto');

// Mã hoá 2 chiều (không phải hash 1 chiều như mật khẩu đăng nhập) vì server
// cần đọc lại giá trị thật để dùng: nodemailer cần mật khẩu SMTP thật để xác
// thực, Facebook Graph API cần App Secret thật để tính appsecret_proof.
// Trước đây 2 giá trị này lưu thẳng dạng văn bản trong DB - nếu DB bị lộ
// (backup rò rỉ, SQL injection ở chỗ khác...) thì lộ luôn cả thông tin đăng
// nhập hộp thư và app Facebook. Khoá mã hoá nằm ở biến môi trường
// SECRETS_ENCRYPTION_KEY, tách khỏi DB - lộ DB một mình không đủ để giải mã.
const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const hex = process.env.SECRETS_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'Thiếu hoặc sai SECRETS_ENCRYPTION_KEY trong .env - cần đúng 64 ký tự hex (32 byte). ' +
      'Tạo bằng: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, 'hex');
}

function encryptSecret(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

function decryptSecret(encoded) {
  if (!encoded) return encoded;
  const [ivHex, tagHex, dataHex] = encoded.split(':');
  if (!ivHex || !tagHex || !dataHex) return encoded;

  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return plaintext.toString('utf8');
}

module.exports = { encryptSecret, decryptSecret };
