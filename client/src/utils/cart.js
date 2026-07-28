import { CART_UPDATED_EVENT } from '../hooks/useCartCount';

const STORAGE_KEY = 'dmnk_cart_v1';

export function getCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addItem(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => String(item.id) === String(product.id));

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      qty,
    });
  }
  saveCart(cart);
  return cart;
}

export function removeItem(id) {
  const cart = getCart().filter((item) => String(item.id) !== String(id));
  saveCart(cart);
  return cart;
}

export function updateQty(id, qty) {
  const cart = getCart();
  const item = cart.find((item) => String(item.id) === String(id));
  if (item) item.qty = Math.max(1, Math.min(99, qty));
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}
