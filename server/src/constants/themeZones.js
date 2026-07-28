// Danh sách zone id cố định cho tính năng tuỳ chỉnh màu/ảnh nền theo khu vực
// (header/footer/section trang chủ). Chỉ dùng để validate/sanitize dữ liệu
// gửi lên - nhãn hiển thị (label) nằm ở client/src/constants/themeZones.js,
// phải sửa đồng thời cả 2 file khi thêm/bớt zone.
const THEME_ZONE_IDS = [
  'headerTopBar', 'headerMain', 'headerNav',
  'footerBody', 'footerBottom',
  'sectionCoreFeatures', 'sectionFlashSale',
  'sectionCategoryEven', 'sectionCategoryOdd',
  'sectionPromoBanners', 'sectionTopBrands',
  'sectionNewArrivals', 'sectionBlogTeaser',
];

module.exports = { THEME_ZONE_IDS };
