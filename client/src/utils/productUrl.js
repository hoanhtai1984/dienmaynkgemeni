// Fallback về id khi slug thiếu (vd: item giỏ hàng cũ lưu từ trước khi có
// slug) - server vẫn tra đúng sản phẩm vì luôn lấy số cuối cùng trong URL.
export function productUrl(product) {
  return `/san-pham/${product.slug || product.id}`;
}
