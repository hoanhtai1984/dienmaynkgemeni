import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts } from '../api/products';
import { getPosts } from '../api/posts';
import { useCategories } from '../hooks/useCategories';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { themeZoneStyle } from '../utils/themeZoneStyle';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import ProductCard from '../components/ProductCard';
import ExpandableProductGrid from '../components/ExpandableProductGrid';
import { formatMoney } from '../utils/format';
import { resolveImageUrl, onImgError } from '../utils/resolveImageUrl';
import { productUrl } from '../utils/productUrl';
import { formatDate } from '../utils/formatDate';
import { addItem } from '../utils/cart';
import { showToast } from '../utils/toast';
import { toggleCompare, MAX_COMPARE } from '../utils/compare';
import { useCompareIds } from '../hooks/useCompareCount';

// 3 slide mặc định cho banner chính đầu trang chủ - dùng khi admin CHƯA cấu
// hình gì trong settings.heroSlides (Admin > Cài đặt). Admin thêm dù chỉ 1
// slide có ảnh thì thay thế TOÀN BỘ mảng mặc định này, không gộp chung.
const DEFAULT_HERO_SLIDES = [
  {
    image: '/assets/images/hero-slide-1.jpg',
    badgeText: 'Khuyến Mãi Lớn',
    badgeColor: 'danger',
    title: 'Điện Gia Dụng Ưu Đãi Đến 49%',
    subtitle: 'Tặng thêm voucher trị giá 500.000đ khi mua dòng nồi chiên không dầu thế hệ mới và lò vi sóng Panasonic chính hãng.',
    buttonText: 'Mua Ngay',
    buttonLink: '/danh-muc?cat=dien-gia-dung',
  },
  {
    image: '/assets/images/hero-slide-2.jpg',
    badgeText: 'Bảo Hành 5 Năm',
    badgeColor: 'primary',
    title: 'Điện Lạnh Giá Tốt Hỗ Trợ Trả Góp 0%',
    subtitle: 'Miễn phí công lắp đặt và tặng kèm combo vật tư đồng ống đồng chính hãng trị giá 1 triệu cho các dòng máy lạnh.',
    buttonText: 'Xem Ngay',
    buttonLink: '/danh-muc?cat=dien-lanh',
  },
  {
    image: '/assets/images/hero-slide-3.jpg',
    badgeText: 'Vì Sức Khỏe Gia Đình',
    badgeColor: 'success',
    title: 'Nước Sạch Chuẩn Vị Giảm Sốc Đến 35%',
    subtitle: 'Hệ thống lọc nước RO thông minh công nghệ bổ sung Hydrogen tự nhiên. Miễn phí kiểm tra nguồn nước tại nhà.',
    buttonText: 'Khám Phá',
    buttonLink: '/danh-muc?cat=dien-gia-dung&sub=may-loc-nuoc',
  },
];

// 2 banner ngang khuyến mãi giữa trang chủ - dùng khi admin CHƯA cấu hình gì
// trong settings.promoBanners (Admin > Cài đặt > Giao diện & Nội dung).
const DEFAULT_PROMO_BANNERS = [
  {
    image: '/assets/images/promo-banner-1.jpg',
    title: 'Đại Tiệc Điện Lạnh',
    subtitle: 'Giảm giá đến 40%',
    linkType: 'category',
    linkValue: 'dien-lanh',
  },
  {
    image: '/assets/images/promo-banner-2.jpg',
    title: 'Hương Vị Chuẩn Gu',
    subtitle: 'Đồ gia dụng nhà bếp',
    linkType: 'category',
    linkValue: 'dien-gia-dung',
  },
];

// Thương hiệu trưng bày ở trang chủ - danh sách cố định theo yêu cầu, không
// phụ thuộc catalog hiện có (một số hãng chưa có sản phẩm nào, bấm vào vẫn
// dẫn tới trang danh mục lọc theo hãng đó, chỉ là sẽ trống).
// Icon/màu cố định theo thứ tự - nội dung (tiêu đề/mô tả) lấy từ
// settings.coreFeatures, chỉnh được ở Admin > Cài đặt.
const CORE_FEATURE_META = [
  { colorClass: 'bg-warning-subtle text-warning', icon: 'bi-truck' },
  { colorClass: 'bg-primary-subtle text-primary', icon: 'bi-shield-check' },
  { colorClass: 'bg-success-subtle text-success', icon: 'bi-arrow-repeat' },
  { colorClass: 'bg-danger-subtle text-danger', icon: 'bi-percent' },
];

const FEATURED_BRANDS = [
  'Toshiba', 'Comfee', 'Teka', 'Hafele', 'KDK', 'LG', 'Halio', 'Paveden', 'Philips',
  'Roborock', 'Samsung', 'Sharp', 'Xiaomi', 'Tefal', 'WMF', 'Viewsonic', 'Hyperwork',
  'Humanmotion', 'AC', 'Bear', 'Bosch', 'Boss', 'Aqua', 'Cuckoo', 'Daikin', 'Deerma',
  'Delonghi', 'E-pro', 'Electrolux', 'Elmich', 'Eonwon', 'Finish', 'Fujie', 'Fujihome',
  'Happycook', 'Hyundai', 'Kadeka', 'Tiger',
];

// Chỉ những hãng này có logo mở, nhúng được miễn phí (đã kiểm tra qua
// Simple Icons CDN) - các hãng còn lại không có nguồn logo hợp lệ nên hiển
// thị dạng "wordmark" chữ cách điệu thay vì tự vẽ lại logo giống bản gốc.
const BRAND_LOGO_SLUG = {
  Toshiba: 'toshiba',
  LG: 'lg',
  Samsung: 'samsung',
  Sharp: 'sharp',
  Xiaomi: 'xiaomi',
  Bosch: 'bosch',
  Aqua: 'aqua',
  Delonghi: 'delonghi',
  Hyundai: 'hyundai',
};

// Banner dọc cạnh danh mục ở trang chủ - nội dung/ảnh/đường dẫn giờ đều lấy
// từ settings.categoryBanners (Admin > Cài đặt), không còn hardcode ở đây.
// Danh mục chưa được admin cấu hình (chưa có ảnh) thì section tự hiện bình
// thường không banner, không lỗi.
function resolveBannerLink(banner) {
  if (banner.linkType === 'brand') return `/danh-muc?brands=${encodeURIComponent(banner.linkValue || '')}`;
  if (banner.linkType === 'category') return `/danh-muc?cat=${banner.linkValue || ''}`;
  return banner.linkValue || '/danh-muc';
}

function CategoryVerticalBanner({ banner }) {
  return (
    <Link to={resolveBannerLink(banner)} className={`cat-vbanner ${banner.theme}`}>
      {banner.eyebrow && <span className="vbanner-eyebrow">{banner.eyebrow}</span>}
      <h4 className="vbanner-title">{banner.title}</h4>
      <img
        className="vbanner-img"
        src={resolveImageUrl(banner.image)}
        alt={banner.title}
        onError={onImgError}
      />
      {banner.priceLabel && (
        <div className="vbanner-price">
          <span className="num">{banner.priceLabel}</span>
        </div>
      )}
      {banner.perk && <div className="vbanner-perk">{banner.perk}</div>}
      <span className="vbanner-cta">MUA NGAY</span>
    </Link>
  );
}

// 2 banner phụ cạnh slider chính trang chủ - nội dung/ảnh/đường dẫn lấy từ
// settings.heroSideBanners (Admin > Cài đặt), dùng chung resolveBannerLink
// với banner danh mục. Chưa cấu hình banner nào thì cả cột tự ẩn, slider
// chính chiếm trọn chiều rộng thay vì để trống 1 khoảng trắng xấu.
function HeroSideBanner({ banner }) {
  return (
    <Link to={resolveBannerLink(banner)} className="hero-side-banner">
      <img src={resolveImageUrl(banner.image)} alt={banner.title || 'Banner'} onError={onImgError} />
      {banner.title && (
        <div className="hero-side-banner-caption">
          <span>{banner.title}</span>
        </div>
      )}
    </Link>
  );
}

// 2 banner ngang khuyến mãi giữa trang chủ - nội dung/ảnh/đường dẫn lấy từ
// settings.promoBanners (Admin > Cài đặt), dùng chung resolveBannerLink với
// các banner khác. Rỗng thì dùng lại DEFAULT_PROMO_BANNERS (xem phía trên).
function PromoBanner({ banner }) {
  return (
    <Link to={resolveBannerLink(banner)} className="d-block position-relative rounded-4 overflow-hidden text-decoration-none">
      <img
        src={resolveImageUrl(banner.image)}
        className="w-100"
        style={{ height: 180, objectFit: 'cover' }}
        alt={banner.title}
        onError={onImgError}
      />
      <div
        className="position-absolute top-0 start-0 h-100 d-flex flex-column justify-content-center p-4"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.6), transparent)' }}
      >
        <h4 className="fw-bold mb-1 text-white">{banner.title}</h4>
        <span className="text-white-50">{banner.subtitle}</span>
      </div>
    </Link>
  );
}

function brandHue(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function BrandBadge({ name }) {
  const logoSlug = BRAND_LOGO_SLUG[name];

  if (logoSlug) {
    return (
      <Link to={`/danh-muc?brands=${encodeURIComponent(name)}`} className="brand-badge brand-badge-logo" title={name}>
        <img src={`https://cdn.simpleicons.org/${logoSlug}`} alt={name} />
      </Link>
    );
  }

  const hue = brandHue(name);
  return (
    <Link
      to={`/danh-muc?brands=${encodeURIComponent(name)}`}
      className="brand-badge brand-badge-word"
      style={{ color: `hsl(${hue}, 60%, 32%)`, borderColor: `hsl(${hue}, 55%, 82%)`, background: `hsl(${hue}, 65%, 97%)` }}
    >
      {name}
    </Link>
  );
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function useCountdown(endsAt) {
  const [remaining, setRemaining] = useState(() => (endsAt ? new Date(endsAt).getTime() - Date.now() : null));

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setRemaining(new Date(endsAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt || remaining === null || remaining <= 0) return null;
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function FlashSaleCard({ product }) {
  const navigate = useNavigate();
  const countdown = useCountdown(product.promoEndsAt);
  const compareIds = useCompareIds();
  const inCompare = compareIds.includes(Number(product.id));
  // Số suất khuyến mãi là con số marketing admin tự đặt, tách biệt với `sold`
  // (tổng số bán thật) - khi không đặt (promoSlots null), quay lại hiển thị
  // đơn giản dựa trên `sold` như trước.
  const hasPromoSlots = product.promoSlots != null && product.promoSlots > 0;
  const scarcityPercent = hasPromoSlots
    ? Math.min(100, Math.round((product.promoSold / product.promoSlots) * 100))
    : Math.min(100, product.sold);
  const soldOutSoon = hasPromoSlots && product.promoSold >= product.promoSlots;
  const outOfStock = product.stock === 0;
  const disabled = outOfStock || soldOutSoon;

  function handleBuyNow(e) {
    e.preventDefault();
    addItem(product, 1);
    navigate('/gio-hang');
  }

  function handleAddToCart(e) {
    e.preventDefault();
    addItem(product, 1);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
  }

  function handleToggleCompare(e) {
    e.preventDefault();
    const result = toggleCompare(product.id);
    if (result.limitReached) {
      showToast(`Chỉ có thể so sánh tối đa ${MAX_COMPARE} sản phẩm`);
      return;
    }
    showToast(result.added ? `Đã thêm "${product.name}" vào so sánh` : `Đã bỏ "${product.name}" khỏi so sánh`);
  }

  return (
    <div className="col">
      <div className="card flash-sale-card h-100 rounded-3 position-relative p-2">
        <span className="badge bg-danger position-absolute top-0 start-0 m-2 px-2 py-1 fs-12 z-1">
          -{product.discount}%
        </span>
        {outOfStock ? (
          <span className="badge bg-secondary position-absolute top-0 end-0 m-2 px-2 py-1 fs-12 z-1">Hết hàng</span>
        ) : countdown && (
          <span className="badge bg-dark position-absolute top-0 end-0 m-2 px-2 py-1 fs-12 z-1">
            <i className="bi bi-stopwatch-fill"></i> {countdown}
          </span>
        )}
        <div className={`ratio ratio-1x1 mb-2 overflow-hidden rounded${outOfStock ? ' opacity-50' : ''}`}>
          <Link to={productUrl(product)}>
            <img
              alt={product.name}
              className="card-img-top object-fit-cover"
              src={resolveImageUrl(product.image)}
              onError={onImgError}
            />
          </Link>
        </div>
        <div className="card-body p-1 d-flex flex-column justify-content-between">
          <div>
            <span className="text-muted fs-12 d-block mb-1">{product.brand}</span>
            <h6 className="card-title text-dark fw-semibold text-truncate-2 mb-2">
              <Link className="text-dark text-decoration-none hover-text-primary" to={productUrl(product)}>
                {product.name}
              </Link>
            </h6>
          </div>
          <div className="mt-auto">
            <div className="d-flex flex-column mb-2">
              <span className="text-danger fw-bold fs-5">{formatMoney(product.price)}</span>
              <span className="text-muted text-decoration-line-through fs-14">{formatMoney(product.oldPrice)}</span>
            </div>
            <div className="progress mb-3" style={{ height: 14 }}>
              <div
                className="progress-bar bg-danger rounded"
                role="progressbar"
                style={{ width: `${scarcityPercent}%` }}
              >
                {hasPromoSlots ? `Đã bán ${product.promoSold}/${product.promoSlots} suất` : `Đã bán ${product.sold}`}
              </div>
            </div>
            <button className="btn btn-dark btn-sm w-100 fw-bold py-2 mb-2" onClick={handleBuyNow} disabled={disabled}>
              {outOfStock ? 'Hết Hàng' : soldOutSoon ? 'Hết Suất Khuyến Mãi' : 'Mua Ngay'}
            </button>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary btn-sm w-100 fw-bold" onClick={handleAddToCart} disabled={outOfStock}>
                <i className="bi bi-cart-plus"></i> Thêm giỏ
              </button>
              <button
                type="button"
                className={`btn btn-sm ${inCompare ? 'btn-warning' : 'btn-outline-secondary'}`}
                title="So sánh sản phẩm"
                onClick={handleToggleCompare}
              >
                <i className="bi bi-bar-chart-fill"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const NEW_ARRIVALS_PAGE_SIZE = 5;
// 5 cột x 2 hàng - card giờ vàng có thêm badge đếm ngược + thanh tiến độ nên
// cần rộng hơn card thường, 6 cột trở lên dễ vỡ layout (badge góc chạm nhau,
// chữ trong thanh tiến độ tràn dòng).
const FLASH_SALE_PAGE_SIZE = 10;
const CATEGORY_SECTION_PAGE_SIZE = 4;
// Lưới brand-badge-grid tự co giãn cột theo bề rộng màn hình (auto-fill),
// khoảng 8 cột ở độ rộng desktop phổ biến -> 16 mục xấp xỉ 2 hàng.
const BRAND_SECTION_PAGE_SIZE = 16;

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const { categories } = useCategories();
  const categoryTabs = categories.map((c) => ({ slug: c.slug, label: c.name }));
  const { settings } = useSiteSettings();

  useEffect(() => {
    // Không truyền limit - trang chủ cần cả catalog để tự chia thành nhiều
    // khu vực khác nhau (giờ vàng, hàng mới về, tab danh mục...) ở client.
    getProducts()
      .then((data) => setProducts(data.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getPosts({ limit: 4 }).then((res) => setPosts(res.items));
  }, []);

  const flashSale = [...products].filter((p) => p.discount > 0).sort((a, b) => b.discount - a.discount);
  const newArrivalsAll = [...products].sort((a, b) => b.id - a.id);
  const heroSideBanners = (settings.heroSideBanners || []).filter((b) => b.image).slice(0, 2);
  const heroSlides = settings.heroSlides?.length ? settings.heroSlides : DEFAULT_HERO_SLIDES;
  const promoBanners = settings.promoBanners?.length === 2 ? settings.promoBanners : DEFAULT_PROMO_BANNERS;

  useDocumentMeta({
    title: 'Điện Máy NK - Hệ thống điện máy chính hãng, giá tốt, giao nhanh',
    description: 'Điện Máy NK - điện gia dụng, điện lạnh, điện tử chính hãng, giá tốt, giao hàng nhanh, bảo hành uy tín. Trả góp 0%, đổi trả trong 35 ngày.',
    path: '/',
  });

  return (
    <>
      <section className="hero-slider py-4">
        <div className="container">
          <div className="row g-3">
            <div className={heroSideBanners.length > 0 ? 'col-lg-8' : 'col-12'}>
              <div className="carousel slide hero-main-carousel" data-bs-ride="carousel" data-bs-interval="4000" id="heroCarousel">
                {heroSlides.length > 1 && (
                  <div className="carousel-indicators">
                    {heroSlides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        data-bs-target="#heroCarousel"
                        data-bs-slide-to={i}
                        className={i === 0 ? 'active' : ''}
                        aria-current={i === 0 ? 'true' : undefined}
                      ></button>
                    ))}
                  </div>
                )}
                <div className="carousel-inner">
                  {heroSlides.map((slide, i) => (
                    <div className={`carousel-item${i === 0 ? ' active' : ''}`} key={i}>
                      <img alt={slide.title || 'Banner'} className="d-block w-100" src={resolveImageUrl(slide.image)} onError={onImgError} />
                      <div className="carousel-overlay"></div>
                      <div className="carousel-caption text-start">
                        {slide.badgeText && (
                          <span className={`badge bg-${slide.badgeColor || 'danger'} mb-3 py-2 px-3 rounded-pill text-uppercase`}>{slide.badgeText}</span>
                        )}
                        {slide.title && <h1 className="display-4 fw-bold text-white mb-3">{slide.title}</h1>}
                        {slide.subtitle && <p className="lead text-white-50 d-none d-md-block mb-4">{slide.subtitle}</p>}
                        {slide.buttonText && (
                          <Link className="btn btn-warning btn-lg fw-bold px-4 py-2 mt-2 text-dark" to={slide.buttonLink || '/danh-muc'}>
                            {slide.buttonText} <i className="bi bi-arrow-right"></i>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {heroSlides.length > 1 && (
                  <>
                    <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                      <span className="visually-hidden">Trước</span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                      <span className="carousel-control-next-icon" aria-hidden="true"></span>
                      <span className="visually-hidden">Sau</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            {heroSideBanners.length > 0 && (
              <div className="col-lg-4">
                <div className="hero-side-banner-col">
                  {heroSideBanners.map((banner, i) => (
                    <HeroSideBanner banner={banner} key={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="core-features py-5" style={themeZoneStyle(settings.themeZones?.sectionCoreFeatures)}>
        <div className="container">
          <div className="row g-4">
            {CORE_FEATURE_META.map((meta, i) => {
              const feature = settings.coreFeatures[i];
              if (!feature) return null;
              return (
                <div className="col-lg-3 col-sm-6" key={i}>
                  <div className="feature-card d-flex align-items-center gap-3 bg-white p-4 rounded-4 shadow-sm h-100">
                    <div className={`feature-icon ${meta.colorClass} flex-shrink-0`}>
                      <i className={`bi ${meta.icon} fs-3`}></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">{feature.title}</h6>
                      <p className="text-muted small mb-0">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {!loading && flashSale.length > 0 && (
        <section className="flash-sale py-5 bg-white border-top" style={themeZoneStyle(settings.themeZones?.sectionFlashSale)}>
          <div className="container">
            <div className="flash-sale-box">
              <div className="flash-sale-banner">
                <span className="flash-sale-banner-bolt flash-sale-banner-bolt-left"><i className="bi bi-lightning-charge-fill"></i></span>
                <span className="flash-sale-banner-bolt flash-sale-banner-bolt-right"><i className="bi bi-lightning-charge-fill"></i></span>
                <div className="flash-sale-banner-inner">
                  <h2 className="flash-sale-banner-title">Giá Sốc Giờ Vàng</h2>
                  <span className="flash-sale-banner-ribbon">Ưu đãi cực sốc - Số lượng có hạn</span>
                </div>
              </div>
              <div className="flash-sale-body">
                <div className="d-flex justify-content-end mb-4">
                  <Link className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold" to="/danh-muc">
                    Xem tất cả <i className="bi bi-chevron-right"></i>
                  </Link>
                </div>
                <ExpandableProductGrid
                  products={flashSale}
                  initialCount={FLASH_SALE_PAGE_SIZE}
                  gridClassName="row g-3 row-cols-2 row-cols-md-4 row-cols-lg-5"
                  renderItem={(p) => <FlashSaleCard product={p} key={p.id} />}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {categoryTabs.map((tab, i) => {
        const categoryProducts = products.filter((p) => p.category === tab.slug);
        if (categoryProducts.length === 0) return null;

        const banner = settings.categoryBanners?.find((b) => b.categorySlug === tab.slug && b.image);

        const sectionInner = (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <h3 className="fw-bold text-dark text-uppercase m-0">{tab.label}</h3>
              <Link className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-bold" to={`/danh-muc?cat=${tab.slug}`}>
                Xem tất cả <i className="bi bi-chevron-right"></i>
              </Link>
            </div>
            <ExpandableProductGrid
              products={categoryProducts}
              initialCount={CATEGORY_SECTION_PAGE_SIZE}
              gridClassName="row g-3 row-cols-2 row-cols-md-3 row-cols-lg-4"
            />
          </>
        );

        return (
          <section
            className={`py-5 border-top ${i % 2 === 0 ? 'bg-white' : 'bg-light'}`}
            style={themeZoneStyle(settings.themeZones?.[i % 2 === 0 ? 'sectionCategoryEven' : 'sectionCategoryOdd'])}
            key={tab.slug}
          >
            <div className="container">
              {banner ? (
                <div className={`cat-banner-row banner-${banner.side}`}>
                  <CategoryVerticalBanner banner={banner} />
                  <div className="cat-banner-main">{sectionInner}</div>
                </div>
              ) : (
                sectionInner
              )}
            </div>
          </section>
        );
      })}

      <section className="promo-banners py-4 bg-light border-top" style={themeZoneStyle(settings.themeZones?.sectionPromoBanners)}>
        <div className="container">
          <div className="row g-3">
            {promoBanners.map((banner, i) => (
              <div className="col-md-6" key={i}>
                <PromoBanner banner={banner} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="top-brands py-4 bg-light border-top" style={themeZoneStyle(settings.themeZones?.sectionTopBrands)}>
        <div className="container">
          <h5 className="fw-bold mb-4 text-dark text-uppercase d-flex align-items-center gap-2">
            <i className="bi bi-award-fill text-warning"></i> Thương Hiệu Nổi Bật
          </h5>
          <ExpandableProductGrid
            products={FEATURED_BRANDS}
            initialCount={BRAND_SECTION_PAGE_SIZE}
            gridClassName="brand-badge-grid"
            renderItem={(brand) => <BrandBadge name={brand} key={brand} />}
          />
        </div>
      </section>

      {newArrivalsAll.length > 0 && (
        <section className="new-arrivals py-5 bg-light border-top" style={themeZoneStyle(settings.themeZones?.sectionNewArrivals)}>
          <div className="container">
            <h4 className="fw-bold m-0 text-dark border-start border-warning border-4 ps-2 text-uppercase mb-4">
              Hàng Mới Về
            </h4>
            <ExpandableProductGrid products={newArrivalsAll} initialCount={NEW_ARRIVALS_PAGE_SIZE} />
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="blog-teaser py-5 bg-white border-top" style={themeZoneStyle(settings.themeZones?.sectionBlogTeaser)}>
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <h4 className="fw-bold m-0 text-dark border-start border-warning border-4 ps-2 text-uppercase">
                Tin Tức &amp; Mẹo Hay
              </h4>
              <Link className="btn btn-outline-dark btn-sm rounded-pill px-3 fw-bold" to="/tin-tuc">
                Xem tất cả tin tức <i className="bi bi-chevron-right"></i>
              </Link>
            </div>
            <div className="row g-4">
              <div className="col-lg-6">
                <Link to={`/tin-tuc/${posts[0].slug}`} className="text-decoration-none text-dark d-block h-100">
                  <div className="bg-light rounded-4 overflow-hidden h-100">
                    <div className="ratio ratio-16x9">
                      <img src={resolveImageUrl(posts[0].image)} alt={posts[0].title} onError={onImgError} className="object-fit-cover" />
                    </div>
                    <div className="p-3">
                      <span className="badge bg-warning-subtle text-warning-emphasis fw-bold small mb-2">{posts[0].category}</span>
                      <h5 className="fw-bold text-truncate-2">{posts[0].title}</h5>
                      <p className="text-muted small text-truncate-2 mb-2">{posts[0].excerpt}</p>
                      <small className="text-muted"><i className="bi bi-calendar3"></i> {formatDate(posts[0].publishedAt)}</small>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="col-lg-6">
                <div className="d-flex flex-column gap-3 h-100">
                  {posts.slice(1, 4).map((post) => (
                    <Link key={post.id} to={`/tin-tuc/${post.slug}`} className="text-decoration-none text-dark">
                      <div className="d-flex gap-3 bg-light rounded-3 p-2">
                        <div className="ratio ratio-1x1 flex-shrink-0" style={{ width: 100 }}>
                          <img src={resolveImageUrl(post.image)} alt={post.title} onError={onImgError} className="object-fit-cover rounded" />
                        </div>
                        <div className="min-width-0">
                          <span className="badge bg-warning-subtle text-warning-emphasis fw-bold" style={{ fontSize: 11 }}>{post.category}</span>
                          <h6 className="fw-bold text-truncate-2 mb-1 mt-1" style={{ fontSize: 14 }}>{post.title}</h6>
                          <small className="text-muted"><i className="bi bi-calendar3"></i> {formatDate(post.publishedAt)}</small>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Home;
