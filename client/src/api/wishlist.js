import apiClient from './client';

export async function getWishlist() {
  const { data } = await apiClient.get('/wishlist');
  return data;
}

export async function getWishlistIds() {
  const { data } = await apiClient.get('/wishlist/ids');
  return data;
}

export async function toggleWishlist(productId) {
  const { data } = await apiClient.post('/wishlist/toggle', { productId });
  return data;
}
