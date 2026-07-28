const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%^&*-_=+?';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

function randomChar(charset) {
  return charset[Math.floor(Math.random() * charset.length)];
}

function shuffle(chars) {
  const arr = chars.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

// Sinh mật khẩu ngẫu nhiên đủ mạnh (>=12 ký tự, có hoa/thường/số/đặc biệt) -
// đảm bảo mỗi loại ký tự bắt buộc xuất hiện ít nhất 1 lần thay vì phó mặc
// cho xác suất, rồi trộn ngẫu nhiên vị trí để không lộ pattern cố định.
function generateStrongPassword(length = 14) {
  const required = [randomChar(UPPER), randomChar(LOWER), randomChar(DIGITS), randomChar(SPECIAL)];
  const rest = Array.from({ length: length - required.length }, () => randomChar(ALL));
  return shuffle([...required, ...rest].join(''));
}

function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 12) {
    return 'Mật khẩu phải có ít nhất 12 ký tự';
  }
  if (!/[A-Z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
  if (!/[a-z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ thường';
  if (!/[0-9]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ số';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt';
  return null;
}

// Quy tắc nhẹ hơn dành cho khách hàng tự đặt mật khẩu (đăng ký/đặt lại) - 12
// ký tự + đủ 4 loại như validatePasswordStrength ở trên là hợp lý cho tài
// khoản admin (được cấp/tự đặt 1 lần, ít khi phải gõ lại) nhưng sẽ gây khó
// chịu quá mức cho khách mua hàng thông thường. 8 ký tự + có chữ + có số là
// mức tối thiểu phổ biến ở các sàn TMĐT, cân bằng giữa an toàn và tiện dùng.
function validateCustomerPasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự';
  }
  if (!/[A-Za-z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ cái';
  if (!/[0-9]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ số';
  return null;
}

module.exports = { generateStrongPassword, validatePasswordStrength, validateCustomerPasswordStrength };
