import apiClient from './client';

export async function getAddressData() {
  const { data } = await apiClient.get('/address');
  return data;
}
