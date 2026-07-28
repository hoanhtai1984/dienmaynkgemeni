// Escape an toàn cho nội dung chèn vào HTML server-render (prerenderController) -
// tên/mô tả sản phẩm là dữ liệu admin nhập/import Excel, không được tin tưởng
// tuyệt đối khi ghép thẳng vào chuỗi HTML thô (khác với React, vốn tự escape
// khi render qua JSX).
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { escapeHtml };
