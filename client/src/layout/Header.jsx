import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useCartCount } from '../hooks/useCartCount';
import { useCompareIds } from '../hooks/useCompareCount';
import { searchSuggest } from '../api/products';
import { formatMoney } from '../utils/format';
import { resolveImageUrl, onImgError } from '../utils/resolveImageUrl';
import { productUrl } from '../utils/productUrl';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useSiteStats } from '../hooks/useSiteStats';
import { themeZoneStyle } from '../utils/themeZoneStyle';
import AuthModal from '../components/AuthModal';
import CustomerProfileModal from '../components/CustomerProfileModal';

function Header() {
  const { categories } = useCategories();
  const { settings } = useSiteSettings();
  const cartCount = useCartCount();
  const compareIds = useCompareIds();
  const { liked, like: onLike } = useSiteStats();
  const navigate = useNavigate();
  const { customer, isAuthenticated } = useCustomerAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showCompareHint, setShowCompareHint] = useState(false);

  const [sticky, setSticky] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState(null);
  const flyoutRef = useRef(null);

  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (categories.length && !activeCategorySlug) {
      setActiveCategorySlug(categories[0].slug);
    }
  }, [categories, activeCategorySlug]);

  useEffect(() => {
    function onScroll() {
      setSticky(window.scrollY > 80);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!showCompareHint) return;
    const timer = setTimeout(() => setShowCompareHint(false), 3000);
    return () => clearTimeout(timer);
  }, [showCompareHint]);

  useEffect(() => {
    function onClickOutside(e) {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target)) {
        setFlyoutOpen(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  function handleSearchChange(e) {
    const value = e.target.value;
    setKeyword(value);
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchSuggest(value).then((results) => {
        setSuggestions(results);
        setShowSuggestions(true);
      });
    }, 300);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed) {
      setShowSuggestions(false);
      navigate(`/danh-muc?q=${encodeURIComponent(trimmed)}`);
    }
  }

  function handleCompareClick(e) {
    if (compareIds.length < 2) {
      e.preventDefault();
      setShowCompareHint(true);
    }
  }

  const activeCategory = categories.find((c) => c.slug === activeCategorySlug);

  return (
    <header id="site-header" className={sticky ? 'sticky' : ''}>
      <div className="top-bar" style={themeZoneStyle(settings.themeZones?.headerTopBar)}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-6 col-12 text-center text-md-start">
              <div className="top-left">
                <i className="bi bi-telephone-fill"></i> Hotline: <strong>{settings.hotline}</strong>
              </div>
            </div>
            <div className="col-lg-6 col-md-6 d-none d-md-block">
              <ul className="top-menu">
                <li><Link to="/gioi-thieu">Giới thiệu</Link></li>
                <li><Link to="/huong-dan-mua-hang">Hướng dẫn mua hàng</Link></li>
                <li><Link to="/cau-hoi-thuong-gap">Câu hỏi thường gặp</Link></li>
                <li><Link to="/lien-he">Liên hệ</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="main-header" style={themeZoneStyle(settings.themeZones?.headerMain)}>
        <div className="container">
          <div className="row align-items-center gy-3">
            <div className="col-lg-2 col-md-3 col-6">
              <Link to="/" className="logo">
                <img
                  src={settings.logoImage ? resolveImageUrl(settings.logoImage) : '/assets/images/logo.png'}
                  alt="Điện Máy NK"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/190x50?text=DienMayNK'; }}
                />
              </Link>
            </div>
            <div className="col-lg-2 d-none d-lg-block">
              <div className="category-nav" id="categoryNav" ref={flyoutRef}>
                <button
                  className="category-nav-btn"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFlyoutOpen((v) => !v); }}
                >
                  <i className="bi bi-grid-fill"></i> Danh Mục
                  <i className="bi bi-chevron-down"></i>
                </button>
                <div className={`category-flyout${flyoutOpen ? ' show' : ''}`}>
                  <ul className="category-flyout-sidebar">
                    {categories.map((cat) => (
                      <li
                        key={cat.slug}
                        className={cat.slug === activeCategorySlug ? 'active' : ''}
                        onMouseEnter={() => setActiveCategorySlug(cat.slug)}
                      >
                        <Link to={`/danh-muc?cat=${cat.slug}`} onClick={() => setFlyoutOpen(false)}>
                          <i className={`bi ${cat.icon || 'bi-tag'}`}></i> {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="category-flyout-panel">
                    {activeCategory && (
                      <div className="flyout-panel-content active">
                        <div className="flyout-icon-grid">
                          {activeCategory.subCategories.map((sub) => (
                            <Link
                              key={sub.slug}
                              to={`/danh-muc?cat=${activeCategory.slug}&sub=${sub.slug}`}
                              onClick={() => setFlyoutOpen(false)}
                            >
                              <span className="flyout-icon"><i className={`bi ${sub.icon || 'bi-tag'}`}></i></span>
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-12 order-3 order-md-2">
              <form className="search-form" onSubmit={handleSearchSubmit}>
                <div className="search-box" ref={searchBoxRef}>
                  <i className="bi bi-search"></i>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Bạn cần tìm gì hôm nay?"
                    value={keyword}
                    onChange={handleSearchChange}
                    onFocus={() => { if (keyword.trim()) setShowSuggestions(true); }}
                  />
                  <button type="submit">Tìm kiếm</button>
                  <div id="search-suggestions" className={showSuggestions ? '' : 'd-none'}>
                    {suggestions.length === 0 ? (
                      <div className="p-3 text-muted text-center small">
                        <i className="bi bi-exclamation-circle"></i> Không tìm thấy sản phẩm phù hợp
                      </div>
                    ) : (
                      suggestions.map((p) => (
                        <Link
                          key={p.id}
                          to={productUrl(p)}
                          className="suggestion-item"
                          onClick={() => setShowSuggestions(false)}
                        >
                          <img src={resolveImageUrl(p.image)} alt={p.name} className="suggestion-img" onError={onImgError} />
                          <div className="flex-grow-1 min-width-0">
                            <h6 className="suggestion-title text-dark text-truncate">{p.name}</h6>
                            <span className="suggestion-price">{formatMoney(p.price)}</span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className="col-lg-4 col-md-3 col-6 order-2 order-md-3">
              <div className="header-right">
                <button
                  type="button"
                  className={`header-icon d-none d-lg-flex${liked ? ' liked' : ''}`}
                  onClick={onLike}
                  title={liked ? 'Đã thích trang này' : 'Yêu thích trang này'}
                >
                  <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                </button>
                <div className="position-relative d-none d-lg-block">
                  <Link
                    to="/so-sanh"
                    className="header-icon position-relative"
                    title="So sánh sản phẩm"
                    onClick={handleCompareClick}
                  >
                    <i className="bi bi-bar-chart-fill"></i>
                    {compareIds.length > 0 && <span className="cart-count">{compareIds.length}</span>}
                  </Link>
                  {showCompareHint && (
                    <div className="compare-hint-popover">
                      <p className="small mb-2">
                        Vui lòng thêm ít nhất 2 sản phẩm vào danh sách so sánh để tiến hành so sánh.
                      </p>
                      <div className="d-flex gap-2">
                        <Link
                          to="/danh-muc"
                          className="btn btn-sm btn-outline-dark fw-bold flex-fill"
                          onClick={() => setShowCompareHint(false)}
                        >
                          Xem sản phẩm
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning fw-bold flex-fill"
                          onClick={() => setShowCompareHint(false)}
                        >
                          Tôi hiểu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {isAuthenticated ? (
                  <div
                    className="header-item account-item d-none d-lg-flex position-relative"
                    role="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setProfileModalOpen(true)}
                  >
                    <i className="bi bi-person-check-fill"></i>
                    <div>
                      <small>Xin chào</small>
                      <strong>{customer.name.split(' ')[0]}</strong>
                    </div>
                    <div className="account-hover-preview">
                      <div className="fw-bold">{customer.name}</div>
                      <div><i className="bi bi-telephone-fill"></i> {customer.phone || 'Chưa cập nhật'}</div>
                      <div><i className="bi bi-envelope-fill"></i> {customer.email}</div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="header-item d-none d-lg-flex"
                    role="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setAuthModalOpen(true)}
                  >
                    <i className="bi bi-person-circle"></i>
                    <div>
                      <small>Tài khoản</small>
                      <strong>Đăng nhập</strong>
                    </div>
                  </div>
                )}
                <Link to="/gio-hang" className="cart-btn">
                  <i className="bi bi-cart3"></i>
                  <span className="cart-count">{cartCount}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="main-nav navbar navbar-expand-lg" style={themeZoneStyle(settings.themeZones?.headerNav)}>
        <div className="container">
          <button
            className="navbar-toggler me-auto my-2"
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <i className="bi bi-list"></i> Danh Mục Sản Phẩm
          </button>
          <div className={`collapse navbar-collapse${mobileMenuOpen ? ' show' : ''}`} id="mainMenu">
            <ul className="navbar-nav w-100 justify-content-between">
              {categories.map((cat) => (
                <li className="nav-item" key={cat.slug}>
                  <Link
                    className="nav-link"
                    to={`/danh-muc?cat=${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className={`bi ${cat.icon || 'bi-tag'}`}></i> {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      <AuthModal show={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      {profileModalOpen && customer && (
        <CustomerProfileModal onClose={() => setProfileModalOpen(false)} />
      )}
    </header>
  );
}

export default Header;
