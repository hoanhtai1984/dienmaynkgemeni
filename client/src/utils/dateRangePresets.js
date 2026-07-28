export const DATE_PRESETS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'month', label: 'Tháng này' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'year', label: 'Năm này' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// Trả về { from, to } (Date hoặc null = không giới hạn phía đó) hoặc null
// nếu preset là 'all' (không lọc gì). `customFrom`/`customTo` là chuỗi
// "yyyy-mm-dd" từ <input type="date">, chỉ dùng khi preset === 'custom'.
export function resolveDateRange(preset, customFrom, customTo) {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return { from: new Date(now.getFullYear(), quarterStartMonth, 1), to: endOfDay(now) };
    }
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(now) };
    case 'custom':
      return {
        from: customFrom ? startOfDay(new Date(customFrom)) : null,
        to: customTo ? endOfDay(new Date(customTo)) : null,
      };
    default:
      return null;
  }
}

export function isWithinRange(dateValue, range) {
  if (!range) return true;
  const d = new Date(dateValue);
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}
