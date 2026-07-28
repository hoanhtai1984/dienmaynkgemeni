import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { resolveImageUrl, onImgError } from '../utils/resolveImageUrl';
import AuthModal from './AuthModal';

const SESSION_KEY = 'dmnk_welcome_popup_shown';
// Khác SESSION_KEY (tự xoá khi đóng tab, chỉ chặn hiện lại TRONG cùng phiên) -
// key này lưu ở localStorage (tồn tại vĩnh viễn qua nhiều lần ghé thăm) để
// khách bấm "Không hiển thị lại" thì popup thật sự không làm phiền nữa, dù
// mở tab mới hay quay lại hôm sau.
const DISMISSED_KEY = 'dmnk_welcome_popup_dismissed';
const SHOW_DELAY_MS = 1500;

// Trùng logic resolveBannerLink trong Home.jsx (categoryBanners/heroSideBanners)
// - lặp lại vì chỉ 3 dòng, chưa đáng tách thành util dùng chung.
function resolvePopupLink(popup) {
  if (popup.linkType === 'brand') return `/danh-muc?brands=${encodeURIComponent(popup.linkValue || '')}`;
  if (popup.linkType === 'category') return `/danh-muc?cat=${popup.linkValue || ''}`;
  return popup.linkValue || '/danh-muc';
}

// Hiện tối đa 1 lần/phiên truy cập, trễ 1.5s sau khi trang tải xong. Khách
// CHƯA đăng nhập luôn thấy lời mời đăng ký thành viên (không đọc cấu hình
// settings.welcomePopup - đó là nội dung dành riêng cho khách ĐÃ đăng nhập).
function WelcomePopup() {
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { isAuthenticated, loading: authLoading } = useCustomerAuth();
  const [mode, setMode] = useState(null); // null | 'signup' | 'promo'
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (settingsLoading || authLoading) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setMode('signup');
        sessionStorage.setItem(SESSION_KEY, '1');
      } else if (settings.welcomePopup?.enabled && settings.welcomePopup?.image) {
        setMode('promo');
        sessionStorage.setItem(SESSION_KEY, '1');
      }
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [settingsLoading, authLoading, isAuthenticated, settings.welcomePopup]);

  function close() {
    setMode(null);
  }

  // Khác close() (chỉ ẩn trong phiên hiện tại) - lưu vĩnh viễn vào
  // localStorage nên popup không tự hiện lại ở lần ghé thăm sau, kể cả mở
  // tab mới hay quay lại vào ngày khác. Muốn xem lại phải tự xoá dữ liệu
  // trình duyệt - chấp nhận được vì đây là lựa chọn chủ động của khách.
  function dismissForever() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setMode(null);
  }

  // Mở AuthModal thật thay cho popup của chính mình - đóng popup ngay lúc
  // này để 2 lớp nền mờ không chồng lên nhau, AuthModal tự lo phần còn lại.
  function openSignup() {
    setMode(null);
    setAuthOpen(true);
  }

  const popup = settings.welcomePopup;

  return (
    <>
      {mode === 'signup' && (
        <div className="auth-modal-backdrop" onClick={close}>
          <div className="auth-modal-card welcome-popup-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="auth-modal-close" onClick={close} aria-label="Đóng">
              <i className="bi bi-x-lg"></i>
            </button>
            <div className="welcome-popup-signup">
              <i className="bi bi-gift-fill mb-3 d-block"></i>
              <h5 className="fw-bold mb-2">Đăng ký thành viên Điện Máy NK</h5>
              <p className="text-muted small mb-4">
                Lưu thông tin đặt hàng, theo dõi đơn hàng dễ dàng và nhận ưu đãi dành riêng cho
                thành viên.
              </p>
              <button
                type="button"
                className="btn btn-warning w-100 fw-bold rounded-pill py-2"
                onClick={openSignup}
              >
                Đăng ký ngay
              </button>
              <button
                type="button"
                className="welcome-popup-dismiss"
                onClick={dismissForever}
                aria-label="Không hiển thị lại"
                title="Không hiển thị lại"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'promo' && popup && (
        <div className="auth-modal-backdrop" onClick={close}>
          <div className="auth-modal-card welcome-popup-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="auth-modal-close" onClick={close} aria-label="Đóng">
              <i className="bi bi-x-lg"></i>
            </button>
            <Link to={resolvePopupLink(popup)} className="welcome-popup-promo-link" onClick={close}>
              <img src={resolveImageUrl(popup.image)} alt={popup.title || ''} onError={onImgError} />
              {(popup.title || popup.buttonText) && (
                <div className="welcome-popup-promo-caption">
                  {popup.title && <h5>{popup.title}</h5>}
                  {popup.buttonText && (
                    <span className="btn btn-warning fw-bold rounded-pill px-4 py-2">{popup.buttonText}</span>
                  )}
                </div>
              )}
            </Link>
            <button
              type="button"
              className="welcome-popup-dismiss mx-auto d-block"
              onClick={dismissForever}
              aria-label="Không hiển thị lại"
              title="Không hiển thị lại"
            >
              <i className="bi bi-x-circle"></i>
            </button>
          </div>
        </div>
      )}

      <AuthModal show={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export default WelcomePopup;
