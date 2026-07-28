import { useEffect, useState } from 'react';
import { getAddressData } from '../api/address';

// Cache module-level (giống useSiteSettings.js) - danh sách tỉnh/phường gần
// như không đổi trong 1 phiên duyệt web, chỉ cần tải 1 lần dù mở lại form
// checkout nhiều lần.
let cache = null;

export function useAddressData() {
  const [data, setData] = useState(cache || { provinces: [], wards: [] });
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    getAddressData()
      .then((result) => {
        cache = result;
        setData(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { ...data, loading };
}
