import { useEffect, useState } from 'react';
import { CART_UPDATED_EVENT } from './useCartCount';
import { getCart, removeItem, updateQty, clearCart } from '../utils/cart';

export function useCart() {
  const [cart, setCart] = useState(getCart);

  useEffect(() => {
    const sync = () => setCart(getCart());
    window.addEventListener(CART_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return { cart, totalCount, totalPrice, removeItem, updateQty, clearCart };
}
