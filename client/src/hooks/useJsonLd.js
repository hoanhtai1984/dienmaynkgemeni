import { useEffect } from 'react';

// Inject 1 thẻ <script type="application/ld+json"> theo id - dùng cho
// structured data (Product, BreadcrumbList, Organization, FAQPage...).
// Truyền data=null để không hiện gì (vd sản phẩm chưa tải xong hoặc không tìm
// thấy). Luôn dọn thẻ cũ khi unmount/chuyển route bằng SPA (Link, không tải
// lại trang) - nếu không, JSON-LD của trang trước sẽ còn sót lại lẫn với
// trang sau vì đây là thao tác DOM trực tiếp, React không tự dọn giúp.
export function useJsonLd(id, data) {
  useEffect(() => {
    if (!data) return undefined;
    const el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
    return () => el.remove();
  }, [id, data]);
}
