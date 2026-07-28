import apiClient from './client';

export async function register(payload) {
  const { data } = await apiClient.post('/customer-auth/register', payload);
  return data;
}

export async function login(email, password) {
  const { data } = await apiClient.post('/customer-auth/login', { email, password });
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get('/customer-auth/me');
  return data;
}

export async function logout() {
  await apiClient.post('/customer-auth/logout');
}

export async function forgotPassword(email) {
  const { data } = await apiClient.post('/customer-auth/forgot-password', { email });
  return data;
}

export async function resetPassword(email, token, password) {
  const { data } = await apiClient.post('/customer-auth/reset-password', { email, token, password });
  return data;
}

export async function updateMe(payload) {
  const { data } = await apiClient.patch('/customer-auth/me', payload);
  return data;
}

export async function deleteMe() {
  await apiClient.delete('/customer-auth/me');
}

export async function getMyOrders() {
  const { data } = await apiClient.get('/customer-auth/orders');
  return data;
}

export async function cancelMyOrder(id) {
  const { data } = await apiClient.patch(`/customer-auth/orders/${id}/cancel`);
  return data;
}
