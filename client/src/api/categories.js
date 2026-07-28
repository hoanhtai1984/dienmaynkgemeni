import apiClient from './client';

export async function getCategories() {
  const { data } = await apiClient.get('/categories');
  return data;
}

export async function getBrands(categorySlug, subSlug, subSubSlug) {
  const params = {};
  if (subSlug) params.sub = subSlug;
  if (subSubSlug) params.subsub = subSubSlug;
  const { data } = await apiClient.get(`/categories/${categorySlug || 'all'}/brands`, { params });
  return data;
}
