import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Vị trí cuộn được lưu theo location.key (mỗi lần vào 1 trang mới React
// Router cấp 1 key riêng, quay lại đúng trang cũ - kể cả cùng URL - vẫn
// đúng key cũ). Lưu ở module scope (không phải state) để sống qua mọi lần
// re-render và điều hướng trong suốt phiên dùng trang.
const scrollPositions = new Map();

// Tắt cơ chế khôi phục cuộn mặc định của trình duyệt - nó chạy quá sớm (trước
// khi React render xong nội dung sau khi back), nên tự làm lại bằng tay.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const currentKeyRef = useRef(location.key);

  useEffect(() => {
    currentKeyRef.current = location.key;
  }, [location.key]);

  // Luôn ghi lại vị trí cuộn hiện tại của đúng trang đang đứng, để dù người
  // dùng rời trang bằng cách nào (bấm link, back, forward) vị trí gần nhất
  // luôn được nhớ.
  useEffect(() => {
    function handleScroll() {
      scrollPositions.set(currentKeyRef.current, window.scrollY);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Bootstrap đặt sẵn `scroll-behavior: smooth` toàn site (cho anchor link
    // mượt) - nhưng khôi phục vị trí cuộn sau khi back phải nhảy NGAY LẬP
    // TỨC như trình duyệt vẫn làm mặc định, không animate, nên luôn chỉ định
    // rõ `behavior: 'instant'` để không bị CSS đó chi phối.
    if (navigationType === 'POP') {
      const saved = scrollPositions.get(location.key);
      if (saved == null) return;

      // Nội dung trang (đặc biệt là trang chủ) tải dữ liệu bất đồng bộ nên có
      // thể chưa đủ cao ngay khi vừa quay lại - thử lại vài lần cho tới khi
      // trang đủ cao để cuộn tới đúng vị trí hoặc hết lượt thử. Dùng
      // setTimeout thay vì requestAnimationFrame vì rAF có thể bị trình
      // duyệt tạm dừng khi tab đang chuyển nền, còn setTimeout luôn chạy.
      let attempts = 0;
      let timerId;
      function tryRestore() {
        attempts += 1;
        window.scrollTo({ top: saved, left: 0, behavior: 'instant' });
        const reached = Math.abs(window.scrollY - saved) < 5;
        if (!reached && attempts < 20) {
          timerId = setTimeout(tryRestore, 50);
        }
      }
      tryRestore();
      return () => clearTimeout(timerId);
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.key, navigationType]);

  return null;
}

export default ScrollManager;
