import { API_BASE_URL } from '../api/client';

const FALLBACK = '/assets/images/no-image.svg';

export function resolveImageUrl(url) {
  if (!url) return FALLBACK;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE_URL}${url}`;
  return `/${url.replace(/^\/+/, '')}`;
}

export { FALLBACK as FALLBACK_IMAGE };

export function onImgError(e) {
  if (e.currentTarget.src.endsWith(FALLBACK)) return;
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK;
}
