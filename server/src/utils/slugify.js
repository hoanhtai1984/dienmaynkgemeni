// Bỏ dấu tiếng Việt + chuẩn hóa thành dạng URL-friendly (chữ thường, chỉ
// a-z0-9, cách nhau bằng gạch ngang). "đ"/"Đ" phải xử lý riêng TRƯỚC khi
// strip diacritics NFD vì đây là chữ cái Latin riêng, không phải a/e/o...
// kèm dấu, nên Unicode NFD không tự tách được.
function slugify(text) {
  const base = text
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base.slice(0, 80).replace(/-+$/g, '');
}

// Luôn gắn id thật ở cuối - đảm bảo duy nhất tuyệt đối bất kể tên trùng
// nhau (vd 2 sản phẩm khác màu cùng tên), và URL vẫn tra cứu đúng ngay cả
// khi tên sản phẩm đổi sau này (phần chữ trong URL có thể lỗi thời nhưng id
// ở cuối vẫn luôn đúng).
function buildProductSlug(name, id) {
  return `${slugify(name) || 'san-pham'}-${id}`;
}

module.exports = { slugify, buildProductSlug };
