import { resolveImageUrl } from './resolveImageUrl';

// Chuyển 1 zone { bg, image } trong settings.themeZones thành inline style.
// Zone chưa tuỳ chỉnh gì (undefined/null hoặc cả bg lẫn image đều rỗng) trả
// về undefined - React bỏ hẳn thuộc tính style, màu/class CSS mặc định hiển
// thị y hệt như khi chưa có tính năng này.
export function themeZoneStyle(zone) {
  if (!zone || (!zone.bg && !zone.image)) return undefined;
  const style = {};
  if (zone.bg) style.backgroundColor = zone.bg;
  if (zone.image) {
    style.backgroundImage = `url(${resolveImageUrl(zone.image)})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  }
  return style;
}
