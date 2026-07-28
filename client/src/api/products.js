import apiClient from './client';

export async function getProducts(params = {}) {
  const { data } = await apiClient.get('/products', { params });
  return data;
}

export async function getProduct(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data;
}

export async function searchSuggest(q, limit = 6) {
  if (!q || !q.trim()) return [];
  const { data } = await apiClient.get('/search', { params: { q, limit } });
  return data;
}

export async function getRecommendations(id) {
  const { data } = await apiClient.get(`/products/${id}/recommendations`);
  return data;
}
