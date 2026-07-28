import apiClient from './client';

export async function subscribeNewsletter(email) {
  const { data } = await apiClient.post('/newsletter', { email });
  return data;
}
