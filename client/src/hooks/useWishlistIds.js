import { useEffect, useState } from 'react';
import { getWishlistIds, toggleWishlist } from '../api/wishlist';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { showToast } from '../utils/toast';

export const WISHLIST_UPDATED_EVENT = 'dmnk-wishlist-updated';

// Cache module-level (khác compare.js dùng localStorage vì wishlist gắn với
// tài khoản, không phải trình duyệt) - tránh gọi lại API mỗi lần một
// ProductCard khác mount, đồng bộ mọi ProductCard đang hiển thị qua sự kiện
// tùy chỉnh, giống hệt cơ chế COMPARE_UPDATED_EVENT.
let cachedIds = new Set();

function notify() {
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
}

export function useWishlistIds() {
  const { customer } = useCustomerAuth();
  const [ids, setIds] = useState(cachedIds);

  useEffect(() => {
    if (!customer) {
      cachedIds = new Set();
      setIds(cachedIds);
      return;
    }
    getWishlistIds()
      .then((list) => {
        cachedIds = new Set(list);
        notify();
      })
      .catch(() => {});

    function update() {
      setIds(new Set(cachedIds));
    }
    window.addEventListener(WISHLIST_UPDATED_EVENT, update);
    return () => window.removeEventListener(WISHLIST_UPDATED_EVENT, update);
  }, [customer]);

  async function toggle(productId) {
    if (!customer) {
      showToast('Vui lòng đăng nhập để lưu sản phẩm yêu thích');
      return;
    }
    const numId = Number(productId);
    const result = await toggleWishlist(numId);
    if (result.added) cachedIds.add(numId);
    else cachedIds.delete(numId);
    notify();
    return result;
  }

  return { ids, toggle, isWishlisted: (id) => ids.has(Number(id)) };
}
