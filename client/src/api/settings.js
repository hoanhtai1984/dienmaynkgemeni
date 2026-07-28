import apiClient from './client';

export async function getSettings() {
  const { data } = await apiClient.get('/settings');
  return data;
}

export async function updateSettings(payload) {
  const { data } = await apiClient.put('/admin/settings', payload);
  return data;
}

export async function uploadThemeImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await apiClient.post('/admin/settings/theme-upload', formData);
  return data;
}

export async function getMailSettings() {
  const { data } = await apiClient.get('/admin/settings/mail');
  return data;
}

export async function updateMailSettings(payload) {
  const { data } = await apiClient.put('/admin/settings/mail', payload);
  return data;
}

export async function updatePolicyPage(slug, sections) {
  const { data } = await apiClient.patch(`/admin/settings/policy-pages/${slug}`, { sections });
  return data;
}
