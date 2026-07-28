import apiClient from './client';

export async function getPosts(params = {}) {
  const { data } = await apiClient.get('/posts', { params });
  return data;
}

export async function getPost(slug) {
  const { data } = await apiClient.get(`/posts/${slug}`);
  return data;
}
