import { useEffect, useState } from 'react';
import { getSiteStats, recordVisit, toggleLike as apiToggleLike } from '../api/siteStats';

// Cùng mẫu với useCartCount/useCompareCount: cache cấp module + custom event
// để Header (nút thích) và Footer (hiển thị số) đồng bộ ngay lập tức dù
// không phải cha-con trực tiếp, không cần Context riêng cho 1 cặp component.
const LIKED_KEY = 'dmnk_liked';
export const SITE_STATS_UPDATED_EVENT = 'dmnk-site-stats-updated';

let cache = null;
// Chỉ ghi nhận 1 lượt truy cập cho mỗi lần tải trang (app boot), dù bao
// nhiêu component gọi hook này - không phải mỗi lần chuyển trang trong SPA.
let visitRecorded = false;

function readLiked() {
  return localStorage.getItem(LIKED_KEY) === 'true';
}

function broadcast(data) {
  cache = data;
  window.dispatchEvent(new CustomEvent(SITE_STATS_UPDATED_EVENT, { detail: data }));
}

export function useSiteStats() {
  const [stats, setStats] = useState(cache || { likeCount: 0, visitCount: 0 });
  const [liked, setLiked] = useState(readLiked);

  useEffect(() => {
    function onUpdate(e) {
      setStats(e.detail);
    }
    window.addEventListener(SITE_STATS_UPDATED_EVENT, onUpdate);

    if (!visitRecorded) {
      visitRecorded = true;
      recordVisit().then(broadcast).catch(() => {});
    } else if (cache) {
      setStats(cache);
    } else {
      getSiteStats().then((data) => { cache = data; setStats(data); }).catch(() => {});
    }

    return () => window.removeEventListener(SITE_STATS_UPDATED_EVENT, onUpdate);
  }, []);

  // Chỉ tăng, không cho bỏ thích - đã thích rồi thì bấm lại không có tác
  // dụng gì (tránh vô tình bấm trúng 2 lần làm giảm số liệu, và tránh spam
  // bấm liên tục để tăng ảo).
  async function like() {
    if (liked) return;
    setLiked(true);
    localStorage.setItem(LIKED_KEY, 'true');
    try {
      const data = await apiToggleLike(true);
      broadcast(data);
      setStats(data);
    } catch {
      setLiked(false);
      localStorage.setItem(LIKED_KEY, 'false');
    }
  }

  return { likeCount: stats.likeCount, visitCount: stats.visitCount, liked, like };
}
