import apiClient from './client';

export async function getProductReviews(productId) {
  const { data } = await apiClient.get(`/reviews/product/${productId}`);
  return data;
}

export async function getReviewEligibility(productId) {
  const { data } = await apiClient.get(`/reviews/eligibility/${productId}`);
  return data;
}

export async function submitReview(payload) {
  const { data } = await apiClient.post('/reviews', payload);
  return data;
}
