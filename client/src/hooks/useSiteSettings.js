import { useEffect, useState } from 'react';
import { getSettings } from '../api/settings';

// Giá trị mặc định chỉ dùng trong khoảnh khắc đầu tiên trước khi tải xong từ
// server (tránh "nháy" nội dung rỗng) - dữ liệu thật luôn lấy từ DB qua admin
// /admin/settings, đây không phải nơi chỉnh sửa nội dung.
const FALLBACK = {
  hotline: '0971 370 152',
  email: 'hoanhtaipro@gmail.com',
  address: '860/16 An Dương Vương, Phường Phú Lâm, Thành phố Hồ Chí Minh',
  companyName: 'Công ty TNHH Thương Mại và Dịch Vụ Kone',
  companyTaxCode: '0318653314',
  workingHours: '8:00 - 21:00, tất cả các ngày trong tuần',
  facebookUrl: null,
  zaloUrl: null,
  youtubeUrl: null,
  tiktokUrl: null,
  instagramUrl: null,
  aboutText: '',
  coreFeatures: [
    { title: 'Giao Hàng Siêu Tốc', description: 'Nội thành TP.HCM trong 2 giờ' },
    { title: 'Chính Hãng 100%', description: 'Bảo hành điện tử toàn quốc' },
    { title: 'Lỗi Là Đổi Mới', description: 'Đổi trả uy tín trong 35 ngày đầu' },
    { title: 'Trả Góp Lãi Suất 0%', description: 'Thủ tục nhanh, hỗ trợ qua thẻ' },
  ],
  buyingGuideSteps: [],
  faqItems: [],
  themeZones: null,
  complianceBadgeImage: null,
  complianceBadgeUrl: null,
  pageBackgroundImage: null,
  welcomePopup: null,
};

let cache = null;
const listeners = new Set();

export function useSiteSettings() {
  const [settings, setSettings] = useState(cache || FALLBACK);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    listeners.add(setSettings);
    if (!cache) {
      getSettings()
        .then((data) => {
          cache = data;
          setSettings(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    return () => listeners.delete(setSettings);
  }, []);

  return { settings, loading };
}

// Gọi ngay sau khi admin lưu cài đặt thành công - nếu không, các tab đang mở
// sẵn (kể cả tab admin vừa lưu xong quay lại xem trang chủ) vẫn hiển thị dữ
// liệu cache cũ trong bộ nhớ cho tới khi người dùng tự tải lại trang.
export function refreshSiteSettings() {
  return getSettings().then((data) => {
    cache = data;
    listeners.forEach((setSettings) => setSettings(data));
    return data;
  });
}
