import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dmnk_cart_v1';
export const CART_UPDATED_EVENT = 'dmnk-cart-updated';

function readCount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const cart = raw ? JSON.parse(raw) : [];
    return cart.reduce((sum, item) => sum + item.qty, 0);
  } catch {
    return 0;
  }
}

export function useCartCount() {
  const [count, setCount] = useState(readCount);

  useEffect(() => {
    const update = () => setCount(readCount());
    window.addEventListener('storage', update);
    window.addEventListener(CART_UPDATED_EVENT, update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener(CART_UPDATED_EVENT, update);
    };
  }, []);

  return count;
}
