import apiClient from './client';

export async function getSiteStats() {
  const { data } = await apiClient.get('/site-stats');
  return data;
}

export async function recordVisit() {
  const { data } = await apiClient.post('/site-stats/visit');
  return data;
}

export async function toggleLike(liked) {
  const { data } = await apiClient.post('/site-stats/like', { liked });
  return data;
}
