import apiClient from './client';

export async function createOrder(payload) {
  const { data } = await apiClient.post('/orders', payload);
  return data;
}

export async function validateCoupon(code, subtotal) {
  const { data } = await apiClient.post('/coupons/validate', { code, subtotal });
  return data;
}
