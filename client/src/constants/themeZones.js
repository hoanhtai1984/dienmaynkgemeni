// Danh sách zone tuỳ chỉnh màu/ảnh nền (header/footer/section trang chủ),
// dùng để dựng UI ở AdminSettings.jsx. Id phải khớp với
// server/src/constants/themeZones.js - sửa ở đây thì nhớ sửa cả bên server.
export const THEME_ZONE_GROUPS = [
  {
    label: 'Header',
    zones: [
      { id: 'headerTopBar', label: 'Thanh trên cùng (hotline, menu phụ)' },
      { id: 'headerMain', label: 'Header chính (logo, tìm kiếm, giỏ hàng)' },
      { id: 'headerNav', label: 'Thanh danh mục điều hướng' },
    ],
  },
  {
    label: 'Footer',
    zones: [
      { id: 'footerBody', label: 'Nội dung footer' },
      { id: 'footerBottom', label: 'Dải bản quyền cuối trang' },
    ],
  },
  {
    label: 'Các khu vực trang chủ',
    zones: [
      { id: 'sectionCoreFeatures', label: 'Cam kết dịch vụ' },
      { id: 'sectionFlashSale', label: 'Giá sốc giờ vàng' },
      { id: 'sectionCategoryEven', label: 'Danh mục trang chủ (hàng chẵn: 1, 3, 5...)' },
      { id: 'sectionCategoryOdd', label: 'Danh mục trang chủ (hàng lẻ: 2, 4, 6...)' },
      { id: 'sectionPromoBanners', label: 'Banner khuyến mãi' },
      { id: 'sectionTopBrands', label: 'Thương hiệu nổi bật' },
      { id: 'sectionNewArrivals', label: 'Hàng mới về' },
      { id: 'sectionBlogTeaser', label: 'Tin tức & mẹo hay' },
    ],
  },
];

export const THEME_ZONE_IDS = THEME_ZONE_GROUPS.flatMap((g) => g.zones.map((z) => z.id));
