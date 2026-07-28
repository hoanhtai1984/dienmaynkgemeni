import apiClient from './client';

export async function sendContact(payload) {
  const { data } = await apiClient.post('/contact', payload);
  return data;
}
