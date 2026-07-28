import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '../components/ChatWidget';
import CompareBar from '../components/CompareBar';
import WelcomePopup from '../components/WelcomePopup';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useJsonLd } from '../hooks/useJsonLd';
import { resolveImageUrl } from '../utils/resolveImageUrl';

function Layout() {
  const { settings } = useSiteSettings();

  // Organization/WebSite schema - hiện diện trên mọi trang công khai, dùng
  // dữ liệu thật từ SiteSettings (tên công ty, mạng xã hội đã có sẵn) thay vì
  // hardcode lại lần nữa.
  useJsonLd('organization-jsonld', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.companyName,
    url: window.location.origin,
    logo: `${window.location.origin}/assets/images/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: settings.hotline,
      contactType: 'customer service',
    },
    sameAs: [settings.facebookUrl, settings.youtubeUrl, settings.tiktokUrl, settings.instagramUrl].filter(Boolean),
  });

  // Nền trang trí (màu thương hiệu mặc định hoặc ảnh admin tự upload) - áp
  // dụng cho TẤT CẢ trang công khai, không riêng trang chủ. Chưa upload ảnh
  // thì dùng gradient mặc định định nghĩa sẵn trong CSS .site-bg-wrap.
  const hasBgImage = !!settings.pageBackgroundImage;
  const bgStyle = hasBgImage ? { backgroundImage: `url(${resolveImageUrl(settings.pageBackgroundImage)})` } : undefined;

  return (
    <>
      <div className={`site-bg-wrap${hasBgImage ? ' has-bg-image' : ''}`} style={bgStyle}>
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
      <ChatWidget />
      <CompareBar />
      <WelcomePopup />
    </>
  );
}

export default Layout;
