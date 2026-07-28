import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useSiteStats } from '../hooks/useSiteStats';
import { subscribeNewsletter } from '../api/newsletter';
import { themeZoneStyle } from '../utils/themeZoneStyle';
import { resolveImageUrl } from '../utils/resolveImageUrl';

function Footer() {
  const { settings } = useSiteSettings();
  const { likeCount, visitCount } = useSiteStats();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null); // null | 'submitting' | 'done' | 'error'

  const hotlineDigits = settings.hotline.replace(/\s+/g, '');

  async function handleNewsletterSubmit(e) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus('submitting');
    try {
      await subscribeNewsletter(newsletterEmail.trim());
      setNewsletterStatus('done');
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('error');
    }
  }

  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 300);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      const fab = document.getElementById('contactFab');
      if (fab && !fab.contains(e.target)) setFabOpen(false);
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  return (
    <>
      <footer className="site-footer" style={themeZoneStyle(settings.themeZones?.footerBody)}>
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-4 col-md-6">
              <img
                src="/assets/images/logo.png"
                alt="Điện Máy NK"
                className="footer-logo"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/190x50?text=DienMayNK'; }}
              />
              <p className="mt-3">Điện Máy NK chuyên cung cấp điện máy chính hãng, giá tốt, giao hàng toàn quốc.</p>
              <p><i className="bi bi-geo-alt-fill text-warning"></i> {settings.address}</p>
              <p><i className="bi bi-telephone-fill text-warning"></i> {settings.hotline}</p>
              <p><i className="bi bi-envelope-fill text-warning"></i> {settings.email}</p>
              <div className="compliance-badge">
                {settings.complianceBadgeImage ? (
                  settings.complianceBadgeUrl ? (
                    <a href={settings.complianceBadgeUrl} target="_blank" rel="noopener noreferrer">
                      <img src={resolveImageUrl(settings.complianceBadgeImage)} alt="Đã thông báo Bộ Công Thương" />
                    </a>
                  ) : (
                    <img src={resolveImageUrl(settings.complianceBadgeImage)} alt="Đã thông báo Bộ Công Thương" />
                  )
                ) : (
                  <div className="compliance-badge-placeholder">
                    <i className="bi bi-exclamation-triangle"></i> Chưa thông báo Bộ Công Thương
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-2 col-6">
              <h5>Chính sách</h5>
              <ul className="footer-menu">
                <li><Link to="/chinh-sach-bao-hanh">Chính sách bảo hành</Link></li>
                <li><Link to="/chinh-sach-doi-tra">Chính sách đổi trả</Link></li>
                <li><Link to="/van-chuyen">Vận chuyển</Link></li>
              </ul>
            </div>
            <div className="col-lg-2 col-6">
              <h5>Hỗ trợ</h5>
              <ul className="footer-menu">
                <li><Link to="/huong-dan-mua-hang">Hướng dẫn mua hàng</Link></li>
                <li><Link to="/cau-hoi-thuong-gap">Câu hỏi thường gặp</Link></li>
                <li><Link to="/lien-he">Liên hệ</Link></li>
              </ul>
            </div>
            <div className="col-lg-4 col-md-6">
              <h5>Kết nối với chúng tôi</h5>
              <div className="footer-social mb-3">
                <a href={settings.facebookUrl || '#'} target={settings.facebookUrl ? '_blank' : undefined} rel="noopener noreferrer">
                  <i className="bi bi-facebook"></i>
                </a>
                <a href={settings.youtubeUrl || '#'} target={settings.youtubeUrl ? '_blank' : undefined} rel="noopener noreferrer">
                  <i className="bi bi-youtube"></i>
                </a>
                <a href={settings.tiktokUrl || '#'} target={settings.tiktokUrl ? '_blank' : undefined} rel="noopener noreferrer">
                  <i className="bi bi-tiktok"></i>
                </a>
                <a href={settings.instagramUrl || '#'} target={settings.instagramUrl ? '_blank' : undefined} rel="noopener noreferrer">
                  <i className="bi bi-instagram"></i>
                </a>
              </div>
              <h5>Đăng ký nhận tin</h5>
              <form className="input-group mt-2" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email của bạn"
                  value={newsletterEmail}
                  onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterStatus(null); }}
                  required
                />
                <button className="btn btn-warning" type="submit" disabled={newsletterStatus === 'submitting'}>
                  {newsletterStatus === 'submitting' ? '...' : 'Gửi'}
                </button>
              </form>
              {newsletterStatus === 'done' && <div className="small text-success mt-1">Đăng ký thành công!</div>}
              {newsletterStatus === 'error' && <div className="small text-danger mt-1">Có lỗi xảy ra, vui lòng thử lại.</div>}
            </div>
          </div>
        </div>
        <div className="footer-bottom" style={themeZoneStyle(settings.themeZones?.footerBottom)}>
          <div>Vận hành bởi <strong>{settings.companyName}</strong> - MSDN: {settings.companyTaxCode} - Địa chỉ: {settings.address}</div>
          <div>&copy; 2026 <strong>dienmaynk.vn</strong> - Tất cả các quyền được bảo lưu.</div>
          <div className="footer-stats">
            <span className="text-danger fw-bold">
              <i className="bi bi-heart-fill"></i> {likeCount.toLocaleString('vi-VN')} lượt yêu thích
            </span>
            <span>
              <i className="bi bi-eye-fill"></i> {visitCount.toLocaleString('vi-VN')} lượt truy cập
            </span>
          </div>
        </div>
      </footer>

      <button
        id="backToTop"
        title="Lên đầu trang"
        className={showBackToTop ? 'show' : ''}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="bi bi-arrow-up"></i>
      </button>

      <div className={`contact-fab${fabOpen ? ' open' : ''}`} id="contactFab">
        <div className="contact-fab-menu">
          <a href={settings.zaloUrl || `https://zalo.me/${hotlineDigits}`} target="_blank" rel="noopener noreferrer" className="contact-fab-item zalo">
            <span className="contact-fab-icon">Za</span>
            <span className="contact-fab-label">Chat Zalo</span>
          </a>
          <a href={`tel:${hotlineDigits}`} className="contact-fab-item phone">
            <span className="contact-fab-icon"><i className="bi bi-telephone-fill"></i></span>
            <span className="contact-fab-label">Gọi ngay: {settings.hotline}</span>
          </a>
        </div>
        <button
          className="contact-fab-toggle"
          type="button"
          title="Liên hệ nhanh"
          onClick={(e) => { e.stopPropagation(); setFabOpen((v) => !v); }}
        >
          <i className="bi bi-headset"></i>
        </button>
      </div>
    </>
  );
}

export default Footer;
