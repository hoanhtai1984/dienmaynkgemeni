import { useEffect } from 'react';

// Set title + meta description/OG/Twitter/canonical trực tiếp bằng DOM API -
// không dùng react-helmet-async (thêm dependency cho việc mà 1 hook nhỏ đã
// đủ làm, vì app chỉ có 1 route active tại 1 thời điểm, không cần quản lý
// stack nhiều Helmet lồng nhau). Mỗi trang gọi hook này với nội dung thật của
// chính nó - trang sau load sẽ tự ghi đè giá trị của trang trước.
function setMetaTag(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  if (!href) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useDocumentMeta({ title, description, image, path }) {
  useEffect(() => {
    const url = path ? `${window.location.origin}${path}` : window.location.href;

    if (title) document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', url);
    if (image) setMetaTag('property', 'og:image', image);
    setMetaTag('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    if (image) setMetaTag('name', 'twitter:image', image);
    setCanonical(url);
  }, [title, description, image, path]);
}
