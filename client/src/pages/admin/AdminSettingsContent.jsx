import { useEffect, useState } from 'react';
import { getSettings, updateSettings, uploadThemeImage } from '../../api/settings';
import { getBrands } from '../../api/categories';
import { useCategories } from '../../hooks/useCategories';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { THEME_ZONE_GROUPS } from '../../constants/themeZones';
import { refreshSiteSettings } from '../../hooks/useSiteSettings';

const BANNER_THEME_LABEL = { 'theme-amber': 'Vàng ấm', 'theme-dark': 'Tối' };
const BANNER_SIDE_LABEL = { left: 'Bên trái', right: 'Bên phải' };
const BANNER_LINK_TYPE_LABEL = { category: 'Danh mục', brand: 'Nhãn hiệu', product: 'Sản phẩm cố định' };

function emptyBanner(categorySlug) {
  return {
    categorySlug, image: '', eyebrow: '', title: '', priceLabel: '', perk: '',
    theme: 'theme-amber', side: 'left', linkType: 'category', linkValue: categorySlug,
  };
}

function emptyHeroBanner() {
  return { image: '', title: '', linkType: 'category', linkValue: '' };
}

function emptyPromoBanner() {
  return { image: '', title: '', subtitle: '', linkType: 'category', linkValue: '' };
}

// Nội dung 2 banner khuyến mãi hiện đang chạy thật trên trang chủ (viết cứng
// trong Home.jsx) - mồi sẵn form admin lần đầu mở trang, giống LIVE_DEFAULT_HERO_SLIDES.
const LIVE_DEFAULT_PROMO_BANNERS = [
  { image: '', title: 'Đại Tiệc Điện Lạnh', subtitle: 'Giảm giá đến 40%', linkType: 'category', linkValue: 'dien-lanh' },
  { image: '', title: 'Hương Vị Chuẩn Gu', subtitle: 'Đồ gia dụng nhà bếp', linkType: 'category', linkValue: 'dien-gia-dung' },
];

function emptyWelcomePopup() {
  return { enabled: false, image: '', title: '', buttonText: '', linkType: 'category', linkValue: '' };
}

const HERO_BADGE_COLOR_LABEL = { danger: 'Đỏ', primary: 'Xanh dương', success: 'Xanh lá', warning: 'Vàng' };

function emptyHeroSlide() {
  return { image: '', badgeText: '', badgeColor: 'danger', title: '', subtitle: '', buttonText: '', buttonLink: '' };
}

// Nội dung 3 slide mặc định hiện đang chạy thật trên trang chủ (viết cứng
// trong Home.jsx) - dùng để MỒI sẵn form admin lần đầu mở trang, để admin
// sửa trên nền nội dung thật đang hiển thị thay vì bắt đầu từ ô trống.
const LIVE_DEFAULT_HERO_SLIDES = [
  {
    image: '', badgeText: 'Khuyến Mãi Lớn', badgeColor: 'danger',
    title: 'Điện Gia Dụng Ưu Đãi Đến 49%',
    subtitle: 'Tặng thêm voucher trị giá 500.000đ khi mua dòng nồi chiên không dầu thế hệ mới và lò vi sóng Panasonic chính hãng.',
    buttonText: 'Mua Ngay', buttonLink: '/danh-muc?cat=dien-gia-dung',
  },
  {
    image: '', badgeText: 'Bảo Hành 5 Năm', badgeColor: 'primary',
    title: 'Điện Lạnh Giá Tốt Hỗ Trợ Trả Góp 0%',
    subtitle: 'Miễn phí công lắp đặt và tặng kèm combo vật tư đồng ống đồng chính hãng trị giá 1 triệu cho các dòng máy lạnh.',
    buttonText: 'Xem Ngay', buttonLink: '/danh-muc?cat=dien-lanh',
  },
  {
    image: '', badgeText: 'Vì Sức Khỏe Gia Đình', badgeColor: 'success',
    title: 'Nước Sạch Chuẩn Vị Giảm Sốc Đến 35%',
    subtitle: 'Hệ thống lọc nước RO thông minh công nghệ bổ sung Hydrogen tự nhiên. Miễn phí kiểm tra nguồn nước tại nhà.',
    buttonText: 'Khám Phá', buttonLink: '/danh-muc?cat=dien-gia-dung&sub=may-loc-nuoc',
  },
];

// Icon/màu cố định theo đúng thứ tự 4 mục trên trang chủ (xem Home.jsx) -
// admin chỉ sửa được tiêu đề/mô tả, không đổi icon để tránh lệch màu/icon.
const CORE_FEATURE_META = [
  { icon: 'bi-truck', colorClass: 'bg-warning-subtle text-warning' },
  { icon: 'bi-shield-check', colorClass: 'bg-primary-subtle text-primary' },
  { icon: 'bi-arrow-repeat', colorClass: 'bg-success-subtle text-success' },
  { icon: 'bi-percent', colorClass: 'bg-danger-subtle text-danger' },
];
const EMPTY_CORE_FEATURES = CORE_FEATURE_META.map(() => ({ title: '', description: '' }));

function AdminSettingsContent() {
  const { categories } = useCategories();
  const [aboutText, setAboutText] = useState('');
  const [pageBackgroundImage, setPageBackgroundImage] = useState('');
  const [coreFeatures, setCoreFeatures] = useState(EMPTY_CORE_FEATURES);
  const [buyingGuideSteps, setBuyingGuideSteps] = useState([{ title: '', description: '' }]);
  const [faqItems, setFaqItems] = useState([{ question: '', answer: '' }]);
  const [themeZones, setThemeZones] = useState({});
  const [uploadingZone, setUploadingZone] = useState(null);
  const [uploadingPageBg, setUploadingPageBg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Banner danh mục trang chủ - danh sách cuối cùng chỉ dựng được sau khi CẢ
  // categories (từ useCategories) lẫn rawCategoryBanners (từ getSettings) đều
  // đã tải xong, vì mỗi danh mục cần đúng 1 dòng kể cả khi chưa có banner nào.
  const [rawCategoryBanners, setRawCategoryBanners] = useState(null);
  const [categoryBanners, setCategoryBanners] = useState([]);
  const [uploadingBannerSlug, setUploadingBannerSlug] = useState(null);
  const [bannerBrands, setBannerBrands] = useState([]);

  // 2 banner phụ cạnh slider chính trang chủ - luôn hiển thị đúng 2 dòng
  // (khác categoryBanners không cố định số dòng theo danh mục).
  const [heroSideBanners, setHeroSideBanners] = useState([emptyHeroBanner(), emptyHeroBanner()]);
  const [uploadingHeroSlot, setUploadingHeroSlot] = useState(null);

  // 2 banner ngang khuyến mãi giữa trang chủ (dưới khối danh mục) - luôn
  // đúng 2 dòng, giống heroSideBanners nhưng có thêm mô tả phụ (subtitle).
  const [promoBanners, setPromoBanners] = useState(LIVE_DEFAULT_PROMO_BANNERS);
  const [uploadingPromoSlot, setUploadingPromoSlot] = useState(null);

  // 3 slide banner CHÍNH đầu trang chủ.
  const [heroSlides, setHeroSlides] = useState(LIVE_DEFAULT_HERO_SLIDES);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState(null);

  // Popup chào mừng (chỉ hiện cho khách đã đăng nhập, xem WelcomePopup.jsx).
  const [welcomePopup, setWelcomePopup] = useState(emptyWelcomePopup());
  const [uploadingWelcomePopup, setUploadingWelcomePopup] = useState(false);

  useEffect(() => {
    getBrands('all', '', '').then(setBannerBrands);
  }, []);

  useEffect(() => {
    if (!categories.length || rawCategoryBanners === null) return;
    setCategoryBanners(
      categories.map((c) => rawCategoryBanners.find((b) => b.categorySlug === c.slug) || emptyBanner(c.slug))
    );
  }, [categories, rawCategoryBanners]);

  useEffect(() => {
    getSettings().then((s) => {
      setAboutText(s.aboutText || '');
      setPageBackgroundImage(s.pageBackgroundImage || '');
      const loadedCoreFeatures = CORE_FEATURE_META.map((_, i) => s.coreFeatures?.[i] || { title: '', description: '' });
      setCoreFeatures(loadedCoreFeatures);
      setBuyingGuideSteps(s.buyingGuideSteps?.length ? s.buyingGuideSteps : [{ title: '', description: '' }]);
      setFaqItems(s.faqItems?.length ? s.faqItems : [{ question: '', answer: '' }]);
      setThemeZones(s.themeZones || {});
      setRawCategoryBanners(s.categoryBanners || []);
      const loadedHeroBanners = s.heroSideBanners || [];
      setHeroSideBanners([0, 1].map((i) => loadedHeroBanners[i] || emptyHeroBanner()));
      setHeroSlides(s.heroSlides?.length ? s.heroSlides : LIVE_DEFAULT_HERO_SLIDES);
      setPromoBanners(s.promoBanners?.length === 2 ? s.promoBanners : LIVE_DEFAULT_PROMO_BANNERS);
      setWelcomePopup(s.welcomePopup || emptyWelcomePopup());
      setLoading(false);
    });
  }, []);

  function updateCoreFeatureRow(index, field, value) {
    setCoreFeatures((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function updateStepRow(index, field, value) {
    setBuyingGuideSteps((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addStepRow() {
    setBuyingGuideSteps((prev) => [...prev, { title: '', description: '' }]);
  }

  function removeStepRow(index) {
    setBuyingGuideSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFaqRow(index, field, value) {
    setFaqItems((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addFaqRow() {
    setFaqItems((prev) => [...prev, { question: '', answer: '' }]);
  }

  function removeFaqRow(index) {
    setFaqItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateThemeZone(zoneId, field, value) {
    setThemeZones((prev) => ({
      ...prev,
      [zoneId]: { bg: null, image: null, ...prev[zoneId], [field]: value },
    }));
  }

  function resetThemeZone(zoneId) {
    setThemeZones((prev) => ({ ...prev, [zoneId]: { bg: null, image: null } }));
  }

  async function handleThemeImageUpload(zoneId, file) {
    setUploadingZone(zoneId);
    try {
      const { url } = await uploadThemeImage(file);
      updateThemeZone(zoneId, 'image', url);
    } catch {
      setError('Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setUploadingZone(null);
    }
  }

  function updateBannerField(slug, field, value) {
    setCategoryBanners((prev) => prev.map((b) => (b.categorySlug === slug ? { ...b, [field]: value } : b)));
  }

  async function handleBannerImageUpload(slug, file) {
    setUploadingBannerSlug(slug);
    try {
      const { url } = await uploadThemeImage(file);
      updateBannerField(slug, 'image', url);
    } catch {
      setError('Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setUploadingBannerSlug(null);
    }
  }

  function updateHeroBannerField(index, field, value) {
    setHeroSideBanners((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  }

  async function handleHeroBannerImageUpload(index, file) {
    setUploadingHeroSlot(index);
    try {
      const { url } = await uploadThemeImage(file);
      updateHeroBannerField(index, 'image', url);
    } catch {
      setError('Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setUploadingHeroSlot(null);
    }
  }

  function updatePromoBannerField(index, field, value) {
    setPromoBanners((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  }

  async function handlePromoBannerImageUpload(index, file) {
    setUploadingPromoSlot(index);
    try {
      const { url } = await uploadThemeImage(file);
      updatePromoBannerField(index, 'image', url);
    } catch {
      setError('Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setUploadingPromoSlot(null);
    }
  }

  function updateSlideField(index, field, value) {
    setHeroSlides((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSlide() {
    setHeroSlides((prev) => [...prev, emptyHeroSlide()]);
  }

  function removeSlide(index) {
    setHeroSlides((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSlideImageUpload(index, file) {
    setUploadingSlideIndex(index);
    try {
      const { url } = await uploadThemeImage(file);
      updateSlideField(index, 'image', url);
    } catch {
      setError('Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setUploadingSlideIndex(null);
    }
  }

  function updateWelcomePopupField(field, value) {
    setWelcomePopup((prev) => ({ ...prev, [field]: value }));
  }

  async function handleWelcomePopupImageUpload(file) {
    setUploadingWelcomePopup(true);
    try {
      const { url } = await uploadThemeImage(file);
      updateWelcomePopupField('image', url);
    } catch {
      setError('Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setUploadingWelcomePopup(false);
    }
  }

  async function handlePageBgUpload(file) {
    setUploadingPageBg(true);
    try {
      const { url } = await uploadThemeImage(file);
      setPageBackgroundImage(url);
    } catch {
      setError('Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setUploadingPageBg(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await updateSettings({
        aboutText,
        pageBackgroundImage: pageBackgroundImage || null,
        coreFeatures,
        buyingGuideSteps: buyingGuideSteps.filter((row) => row.title.trim() && row.description.trim()),
        faqItems: faqItems.filter((row) => row.question.trim() && row.answer.trim()),
        themeZones,
        categoryBanners,
        heroSideBanners,
        heroSlides,
        promoBanners,
        welcomePopup,
      });
      await refreshSiteSettings();
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">Giao diện &amp; Nội dung trang chủ</h3>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && (
          <div className="alert alert-success">
            <i className="bi bi-check-circle-fill"></i> Đã lưu cài đặt. Thay đổi sẽ áp dụng ngay trên toàn trang.
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Cam kết dịch vụ (trang chủ)</h6>
              <p className="text-muted small mb-3">4 mục hiển thị ngay dưới banner đầu trang chủ. Icon/màu cố định, chỉ sửa được tiêu đề và mô tả.</p>
              {coreFeatures.map((row, i) => (
                <div className="row g-2 mb-2 align-items-center" key={i}>
                  <div className="col-auto">
                    <span className={`d-inline-flex align-items-center justify-content-center rounded-circle ${CORE_FEATURE_META[i].colorClass}`} style={{ width: 40, height: 40 }}>
                      <i className={`bi ${CORE_FEATURE_META[i].icon}`}></i>
                    </span>
                  </div>
                  <div className="col-4">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Tiêu đề"
                      value={row.title}
                      onChange={(e) => updateCoreFeatureRow(i, 'title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Mô tả"
                      value={row.description}
                      onChange={(e) => updateCoreFeatureRow(i, 'description', e.target.value)}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Giới thiệu</h6>
              <p className="text-muted small mb-3">Nội dung đoạn "Điện Máy NK là ai?" ở trang Giới thiệu. Mỗi dòng là một đoạn văn riêng.</p>
              <textarea className="form-control" rows={6} value={aboutText} onChange={(e) => setAboutText(e.target.value)} required />
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold m-0">Hướng dẫn mua hàng (các bước)</h6>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addStepRow}>
                  <i className="bi bi-plus"></i> Thêm bước
                </button>
              </div>
              {buyingGuideSteps.map((row, i) => (
                <div className="row g-2 mb-2 align-items-start" key={i}>
                  <div className="col-3">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Tiêu đề bước"
                      value={row.title}
                      onChange={(e) => updateStepRow(i, 'title', e.target.value)}
                    />
                  </div>
                  <div className="col-8">
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Mô tả"
                      value={row.description}
                      onChange={(e) => updateStepRow(i, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-1">
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeStepRow(i)}>
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold m-0">Câu hỏi thường gặp</h6>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addFaqRow}>
                  <i className="bi bi-plus"></i> Thêm câu hỏi
                </button>
              </div>
              {faqItems.map((row, i) => (
                <div className="row g-2 mb-2 align-items-start" key={i}>
                  <div className="col-3">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Câu hỏi"
                      value={row.question}
                      onChange={(e) => updateFaqRow(i, 'question', e.target.value)}
                    />
                  </div>
                  <div className="col-8">
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Câu trả lời"
                      value={row.answer}
                      onChange={(e) => updateFaqRow(i, 'answer', e.target.value)}
                    />
                  </div>
                  <div className="col-1">
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeFaqRow(i)}>
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Slide banner chính (đầu trang chủ)</h6>
              <p className="text-muted small mb-3">
                Slide lớn tự chạy ở đầu trang chủ. Bên dưới đang mồi sẵn nội dung hiện có, bạn chỉ cần
                upload ảnh cho từng slide rồi lưu lại - <strong>slide nào chưa có ảnh sẽ không được lưu</strong>
                (dùng lại nội dung mặc định cho slide đó). <strong>Khuyến nghị ảnh khổ ngang lớn, tối thiểu
                1920×800px</strong>, hệ thống tự nén WebP.
              </p>
              {heroSlides.map((slide, index) => (
                <div className="border rounded-3 p-3 mb-3" key={index}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold m-0">Slide {index + 1}</h6>
                    <div className="d-flex align-items-center gap-2">
                      {slide.image && <span className="badge bg-success-subtle text-success">Đang hiển thị</span>}
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeSlide(index)}>
                        <i className="bi bi-trash"></i> Xoá slide
                      </button>
                    </div>
                  </div>
                  <div className="row g-3 align-items-end">
                    <div className="col-auto">
                      <label className="form-label small fw-bold">Ảnh nền slide</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm"
                        disabled={uploadingSlideIndex === index}
                        onChange={(e) => e.target.files[0] && handleSlideImageUpload(index, e.target.files[0])}
                      />
                    </div>
                    {uploadingSlideIndex === index && (
                      <div className="col-auto">
                        <span className="spinner-border spinner-border-sm text-warning"></span>
                      </div>
                    )}
                    {slide.image && (
                      <>
                        <div className="col-auto">
                          <img
                            src={resolveImageUrl(slide.image)}
                            alt=""
                            style={{ height: 60, width: 100, objectFit: 'cover', borderRadius: 4 }}
                          />
                        </div>
                        <div className="col-auto">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => updateSlideField(index, 'image', '')}
                          >
                            Xoá ảnh
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Nhãn nhỏ (badge)</label>
                      <input
                        className="form-control form-control-sm"
                        value={slide.badgeText}
                        onChange={(e) => updateSlideField(index, 'badgeText', e.target.value)}
                        placeholder="vd: Khuyến Mãi Lớn"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Màu nhãn</label>
                      <select
                        className="form-select form-select-sm"
                        value={slide.badgeColor}
                        onChange={(e) => updateSlideField(index, 'badgeColor', e.target.value)}
                      >
                        {Object.entries(HERO_BADGE_COLOR_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Tiêu đề lớn</label>
                      <input
                        className="form-control form-control-sm"
                        value={slide.title}
                        onChange={(e) => updateSlideField(index, 'title', e.target.value)}
                        placeholder="vd: Điện Gia Dụng Ưu Đãi Đến 49%"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Mô tả phụ</label>
                      <input
                        className="form-control form-control-sm"
                        value={slide.subtitle}
                        onChange={(e) => updateSlideField(index, 'subtitle', e.target.value)}
                        placeholder="vd: Tặng thêm voucher trị giá 500.000đ..."
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Chữ trên nút</label>
                      <input
                        className="form-control form-control-sm"
                        value={slide.buttonText}
                        onChange={(e) => updateSlideField(index, 'buttonText', e.target.value)}
                        placeholder="vd: Mua Ngay"
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label small fw-bold">Nút dẫn tới (đường dẫn)</label>
                      <input
                        className="form-control form-control-sm"
                        value={slide.buttonLink}
                        onChange={(e) => updateSlideField(index, 'buttonLink', e.target.value)}
                        placeholder="vd: /danh-muc?cat=dien-gia-dung"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-dark" onClick={addSlide}>
                <i className="bi bi-plus-lg"></i> Thêm slide
              </button>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Banner phụ trang chủ (cạnh slider chính)</h6>
              <p className="text-muted small mb-3">
                2 banner nhỏ hiển thị bên phải slider chính ở đầu trang chủ. Banner nào chưa upload
                ảnh sẽ tự ẩn - nếu cả 2 đều trống, slider chính chiếm trọn chiều rộng. <strong>Khuyến
                nghị ảnh tỉ lệ ngang khoảng 1.8:1 đến 2:1</strong> (vd 640×340px trở lên, khớp khung
                hiển thị thật), hệ thống tự nén WebP và cắt vừa khung.
              </p>
              {heroSideBanners.map((banner, index) => (
                <div className="border rounded-3 p-3 mb-3" key={index}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold m-0">Banner phụ {index + 1}</h6>
                    {banner.image && <span className="badge bg-success-subtle text-success">Đang hiển thị</span>}
                  </div>
                  <div className="row g-3 align-items-end">
                    <div className="col-auto">
                      <label className="form-label small fw-bold">Ảnh banner</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm"
                        disabled={uploadingHeroSlot === index}
                        onChange={(e) => e.target.files[0] && handleHeroBannerImageUpload(index, e.target.files[0])}
                      />
                    </div>
                    {uploadingHeroSlot === index && (
                      <div className="col-auto">
                        <span className="spinner-border spinner-border-sm text-warning"></span>
                      </div>
                    )}
                    {banner.image && (
                      <>
                        <div className="col-auto">
                          <img
                            src={resolveImageUrl(banner.image)}
                            alt=""
                            style={{ height: 60, objectFit: 'cover', borderRadius: 4 }}
                          />
                        </div>
                        <div className="col-auto">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => updateHeroBannerField(index, 'image', '')}
                          >
                            Xoá banner
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Chữ hiển thị đè trên ảnh (tùy chọn)</label>
                      <input
                        className="form-control form-control-sm"
                        value={banner.title}
                        onChange={(e) => updateHeroBannerField(index, 'title', e.target.value)}
                        placeholder="vd: Chuẩn gu sành vang"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Bấm vào dẫn tới</label>
                      <select
                        className="form-select form-select-sm"
                        value={banner.linkType}
                        onChange={(e) => updateHeroBannerField(index, 'linkType', e.target.value)}
                      >
                        {Object.entries(BANNER_LINK_TYPE_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">
                        {banner.linkType === 'category' ? 'Chọn danh mục' : banner.linkType === 'brand' ? 'Chọn nhãn hiệu' : 'Link sản phẩm'}
                      </label>
                      {banner.linkType === 'category' && (
                        <select
                          className="form-select form-select-sm"
                          value={banner.linkValue}
                          onChange={(e) => updateHeroBannerField(index, 'linkValue', e.target.value)}
                        >
                          <option value="">-- Chọn danh mục --</option>
                          {categories.map((c) => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      )}
                      {banner.linkType === 'brand' && (
                        <select
                          className="form-select form-select-sm"
                          value={banner.linkValue}
                          onChange={(e) => updateHeroBannerField(index, 'linkValue', e.target.value)}
                        >
                          <option value="">-- Chọn nhãn hiệu --</option>
                          {bannerBrands.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      )}
                      {banner.linkType === 'product' && (
                        <input
                          className="form-control form-control-sm"
                          value={banner.linkValue}
                          onChange={(e) => updateHeroBannerField(index, 'linkValue', e.target.value)}
                          placeholder="/san-pham/ten-san-pham-1234"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Banner khuyến mãi giữa trang chủ</h6>
              <p className="text-muted small mb-3">
                2 banner ngang hiển thị dưới các khối danh mục, phía trên "Thương hiệu nổi bật".
                Luôn hiển thị đúng 2 banner cạnh nhau (không tự ẩn) - chưa upload ảnh thì tạm dùng
                lại ảnh/nội dung mặc định. Khuyến nghị ảnh tỉ lệ ngang rộng (vd 1200×450px trở lên).
              </p>
              {promoBanners.map((banner, index) => (
                <div className="border rounded-3 p-3 mb-3" key={index}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold m-0">Banner khuyến mãi {index + 1}</h6>
                    {banner.image && <span className="badge bg-success-subtle text-success">Đang hiển thị</span>}
                  </div>
                  <div className="row g-3 align-items-end">
                    <div className="col-auto">
                      <label className="form-label small fw-bold">Ảnh banner</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm"
                        disabled={uploadingPromoSlot === index}
                        onChange={(e) => e.target.files[0] && handlePromoBannerImageUpload(index, e.target.files[0])}
                      />
                    </div>
                    {uploadingPromoSlot === index && (
                      <div className="col-auto">
                        <span className="spinner-border spinner-border-sm text-warning"></span>
                      </div>
                    )}
                    {banner.image && (
                      <>
                        <div className="col-auto">
                          <img
                            src={resolveImageUrl(banner.image)}
                            alt=""
                            style={{ height: 60, objectFit: 'cover', borderRadius: 4 }}
                          />
                        </div>
                        <div className="col-auto">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => updatePromoBannerField(index, 'image', '')}
                          >
                            Xoá banner
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Tiêu đề</label>
                      <input
                        className="form-control form-control-sm"
                        value={banner.title}
                        onChange={(e) => updatePromoBannerField(index, 'title', e.target.value)}
                        placeholder="vd: Đại Tiệc Điện Lạnh"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Mô tả phụ</label>
                      <input
                        className="form-control form-control-sm"
                        value={banner.subtitle}
                        onChange={(e) => updatePromoBannerField(index, 'subtitle', e.target.value)}
                        placeholder="vd: Giảm giá đến 40%"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Bấm vào dẫn tới</label>
                      <select
                        className="form-select form-select-sm"
                        value={banner.linkType}
                        onChange={(e) => updatePromoBannerField(index, 'linkType', e.target.value)}
                      >
                        {Object.entries(BANNER_LINK_TYPE_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">
                        {banner.linkType === 'category' ? 'Chọn danh mục' : banner.linkType === 'brand' ? 'Chọn nhãn hiệu' : 'Link sản phẩm'}
                      </label>
                      {banner.linkType === 'category' && (
                        <select
                          className="form-select form-select-sm"
                          value={banner.linkValue}
                          onChange={(e) => updatePromoBannerField(index, 'linkValue', e.target.value)}
                        >
                          <option value="">-- Chọn danh mục --</option>
                          {categories.map((c) => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      )}
                      {banner.linkType === 'brand' && (
                        <select
                          className="form-select form-select-sm"
                          value={banner.linkValue}
                          onChange={(e) => updatePromoBannerField(index, 'linkValue', e.target.value)}
                        >
                          <option value="">-- Chọn nhãn hiệu --</option>
                          {bannerBrands.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      )}
                      {banner.linkType === 'product' && (
                        <input
                          className="form-control form-control-sm"
                          value={banner.linkValue}
                          onChange={(e) => updatePromoBannerField(index, 'linkValue', e.target.value)}
                          placeholder="/san-pham/ten-san-pham-1234"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Popup chào mừng</h6>
              <p className="text-muted small mb-3">
                Hiện ra ít lâu sau khi khách vào trang, tối đa 1 lần mỗi phiên truy cập. Khách
                <strong> chưa đăng nhập</strong> luôn thấy popup mời đăng ký thành viên (không liên
                quan mục này). Khách <strong>đã đăng nhập</strong> thì thấy nội dung quảng bá bên
                dưới (flash sale, sản phẩm, danh mục...) - tắt hoặc chưa upload ảnh thì không hiện
                gì cho khách đã đăng nhập cả.
              </p>
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="welcomePopupEnabled"
                  checked={welcomePopup.enabled}
                  onChange={(e) => updateWelcomePopupField('enabled', e.target.checked)}
                />
                <label className="form-check-label small fw-bold" htmlFor="welcomePopupEnabled">
                  Bật popup quảng bá cho khách đã đăng nhập
                </label>
              </div>
              <div className="row g-3 align-items-end mb-3">
                <div className="col-auto">
                  <label className="form-label small fw-bold">Ảnh popup</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control form-control-sm"
                    disabled={uploadingWelcomePopup}
                    onChange={(e) => e.target.files[0] && handleWelcomePopupImageUpload(e.target.files[0])}
                  />
                  <small className="text-muted d-block mt-1">
                    <strong>Khuyến nghị khổ đứng, tỉ lệ 3:4</strong> (vd 600×800px trở lên).
                  </small>
                </div>
                {uploadingWelcomePopup && (
                  <div className="col-auto">
                    <span className="spinner-border spinner-border-sm text-warning"></span>
                  </div>
                )}
                {welcomePopup.image && (
                  <>
                    <div className="col-auto">
                      <img
                        src={resolveImageUrl(welcomePopup.image)}
                        alt=""
                        style={{ height: 80, objectFit: 'contain', borderRadius: 4, background: '#f4f4f4', padding: 4 }}
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => updateWelcomePopupField('image', '')}
                      >
                        Xoá ảnh
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Tiêu đề</label>
                  <input
                    className="form-control form-control-sm"
                    value={welcomePopup.title}
                    onChange={(e) => updateWelcomePopupField('title', e.target.value)}
                    placeholder="vd: Giờ Vàng Giảm Đến 44%"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Chữ trên nút</label>
                  <input
                    className="form-control form-control-sm"
                    value={welcomePopup.buttonText}
                    onChange={(e) => updateWelcomePopupField('buttonText', e.target.value)}
                    placeholder="vd: Xem Ngay"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Bấm vào dẫn tới</label>
                  <select
                    className="form-select form-select-sm"
                    value={welcomePopup.linkType}
                    onChange={(e) => updateWelcomePopupField('linkType', e.target.value)}
                  >
                    {Object.entries(BANNER_LINK_TYPE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-8">
                  <label className="form-label small fw-bold">
                    {welcomePopup.linkType === 'category' ? 'Chọn danh mục' : welcomePopup.linkType === 'brand' ? 'Chọn nhãn hiệu' : 'Link sản phẩm'}
                  </label>
                  {welcomePopup.linkType === 'category' && (
                    <select
                      className="form-select form-select-sm"
                      value={welcomePopup.linkValue}
                      onChange={(e) => updateWelcomePopupField('linkValue', e.target.value)}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  )}
                  {welcomePopup.linkType === 'brand' && (
                    <select
                      className="form-select form-select-sm"
                      value={welcomePopup.linkValue}
                      onChange={(e) => updateWelcomePopupField('linkValue', e.target.value)}
                    >
                      <option value="">-- Chọn nhãn hiệu --</option>
                      {bannerBrands.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  )}
                  {welcomePopup.linkType === 'product' && (
                    <input
                      className="form-control form-control-sm"
                      value={welcomePopup.linkValue}
                      onChange={(e) => updateWelcomePopupField('linkValue', e.target.value)}
                      placeholder="/san-pham/ten-san-pham-1234"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Banner danh mục (trang chủ)</h6>
              <p className="text-muted small mb-3">
                Banner dọc hiển thị cạnh mỗi danh mục ở trang chủ. Danh mục nào chưa upload ảnh thì
                hiển thị bình thường, không có banner. <strong>Khuyến nghị ảnh vuông (tỉ lệ 1:1), tối
                thiểu 500×500px</strong>, nền trắng hoặc trong suốt để nổi bật trên nền màu của banner -
                hệ thống tự nén sang WebP và tự co giãn đẹp trên mọi thiết bị (máy tính, máy tính
                bảng, điện thoại).
              </p>
              {categoryBanners.length === 0 ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
                </div>
              ) : (
                categoryBanners.map((banner) => {
                  const category = categories.find((c) => c.slug === banner.categorySlug);
                  return (
                    <div className="border rounded-3 p-3 mb-3" key={banner.categorySlug}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold m-0">{category?.name || banner.categorySlug}</h6>
                        {banner.image && <span className="badge bg-success-subtle text-success">Đang hiển thị</span>}
                      </div>

                      <div className="row g-3 align-items-end">
                        <div className="col-auto">
                          <label className="form-label small fw-bold">Ảnh banner</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm"
                            disabled={uploadingBannerSlug === banner.categorySlug}
                            onChange={(e) => e.target.files[0] && handleBannerImageUpload(banner.categorySlug, e.target.files[0])}
                          />
                        </div>
                        {uploadingBannerSlug === banner.categorySlug && (
                          <div className="col-auto">
                            <span className="spinner-border spinner-border-sm text-warning"></span>
                          </div>
                        )}
                        {banner.image && (
                          <>
                            <div className="col-auto">
                              <img
                                src={resolveImageUrl(banner.image)}
                                alt=""
                                style={{ height: 60, objectFit: 'contain', borderRadius: 4, background: '#f4f4f4', padding: 4 }}
                              />
                            </div>
                            <div className="col-auto">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => updateBannerField(banner.categorySlug, 'image', '')}
                              >
                                Xoá banner
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="row g-3 mt-1">
                        <div className="col-md-4">
                          <label className="form-label small fw-bold">Nhãn nhỏ (eyebrow)</label>
                          <input
                            className="form-control form-control-sm"
                            value={banner.eyebrow}
                            onChange={(e) => updateBannerField(banner.categorySlug, 'eyebrow', e.target.value)}
                            placeholder="vd: Điện Tử"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold">Tiêu đề</label>
                          <input
                            className="form-control form-control-sm"
                            value={banner.title}
                            onChange={(e) => updateBannerField(banner.categorySlug, 'title', e.target.value)}
                            placeholder="vd: Loa Karaoke Arirang"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold">Giá hiển thị (tùy chọn)</label>
                          <input
                            className="form-control form-control-sm"
                            value={banner.priceLabel}
                            onChange={(e) => updateBannerField(banner.categorySlug, 'priceLabel', e.target.value)}
                            placeholder="vd: Chỉ từ 9,29 Triệu"
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-bold">Mô tả ngắn (tùy chọn)</label>
                          <input
                            className="form-control form-control-sm"
                            value={banner.perk}
                            onChange={(e) => updateBannerField(banner.categorySlug, 'perk', e.target.value)}
                            placeholder="vd: Trả góp 0% · Bảo hành 12 tháng"
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold">Màu nền</label>
                          <select
                            className="form-select form-select-sm"
                            value={banner.theme}
                            onChange={(e) => updateBannerField(banner.categorySlug, 'theme', e.target.value)}
                          >
                            {Object.entries(BANNER_THEME_LABEL).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold">Vị trí</label>
                          <select
                            className="form-select form-select-sm"
                            value={banner.side}
                            onChange={(e) => updateBannerField(banner.categorySlug, 'side', e.target.value)}
                          >
                            {Object.entries(BANNER_SIDE_LABEL).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold">Bấm vào dẫn tới</label>
                          <select
                            className="form-select form-select-sm"
                            value={banner.linkType}
                            onChange={(e) => updateBannerField(banner.categorySlug, 'linkType', e.target.value)}
                          >
                            {Object.entries(BANNER_LINK_TYPE_LABEL).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small fw-bold">
                            {banner.linkType === 'category' ? 'Chọn danh mục' : banner.linkType === 'brand' ? 'Chọn nhãn hiệu' : 'Link sản phẩm'}
                          </label>
                          {banner.linkType === 'category' && (
                            <select
                              className="form-select form-select-sm"
                              value={banner.linkValue}
                              onChange={(e) => updateBannerField(banner.categorySlug, 'linkValue', e.target.value)}
                            >
                              {categories.map((c) => (
                                <option key={c.slug} value={c.slug}>{c.name}</option>
                              ))}
                            </select>
                          )}
                          {banner.linkType === 'brand' && (
                            <select
                              className="form-select form-select-sm"
                              value={banner.linkValue}
                              onChange={(e) => updateBannerField(banner.categorySlug, 'linkValue', e.target.value)}
                            >
                              <option value="">-- Chọn nhãn hiệu --</option>
                              {bannerBrands.map((b) => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          )}
                          {banner.linkType === 'product' && (
                            <input
                              className="form-control form-control-sm"
                              value={banner.linkValue}
                              onChange={(e) => updateBannerField(banner.categorySlug, 'linkValue', e.target.value)}
                              placeholder="/san-pham/ten-san-pham-1234"
                            />
                          )}
                        </div>
                      </div>
                      {banner.linkType === 'product' && (
                        <p className="text-muted small mb-0 mt-2">
                          Mở trang sản phẩm muốn gắn vào banner này trên trang thật, sao chép đường dẫn
                          từ thanh địa chỉ trình duyệt (phần sau tên miền, vd: /san-pham/ten-san-pham-1234)
                          rồi dán vào đây.
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Giao diện trang web</h6>
              <p className="text-muted small mb-3">
                Đổi màu/ảnh nền riêng cho từng khu vực - để trống thì dùng màu mặc định của giao
                diện hiện tại. 2 mục "hàng chẵn/hàng lẻ" áp dụng cho tất cả section danh mục xen
                kẽ trên trang chủ, chưa hỗ trợ chỉnh riêng từng danh mục. Ảnh nền phù hợp để đổi
                theo mùa/sự kiện (Tết, khuyến mãi lớn...).
                <strong> Khuyến nghị ảnh khổ ngang, tối thiểu 1920×400px</strong> (tỉ lệ càng dẹt
                càng ít bị lặp/kéo dãn), các khu vực nhỏ hơn (header, thanh danh mục...) vẫn dùng
                được ảnh này, hệ thống tự cắt vừa khung.
              </p>
              {THEME_ZONE_GROUPS.map((group) => (
                <div className="mb-4" key={group.label}>
                  <h6 className="small fw-bold text-muted text-uppercase mb-2">{group.label}</h6>
                  {group.zones.map((zone) => {
                    const z = themeZones[zone.id] || { bg: null, image: null };
                    const isDefault = !z.bg && !z.image;
                    return (
                      <div className="row g-2 mb-2 align-items-center" key={zone.id}>
                        <div className="col-md-4 small">{zone.label}</div>
                        <div className="col-auto">
                          <input
                            type="color"
                            className="form-control form-control-color"
                            title="Màu nền"
                            value={z.bg || '#ffffff'}
                            onChange={(e) => updateThemeZone(zone.id, 'bg', e.target.value)}
                          />
                        </div>
                        <div className="col-auto">
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control form-control-sm"
                            disabled={uploadingZone === zone.id}
                            onChange={(e) => e.target.files[0] && handleThemeImageUpload(zone.id, e.target.files[0])}
                          />
                        </div>
                        {uploadingZone === zone.id && (
                          <div className="col-auto">
                            <span className="spinner-border spinner-border-sm text-warning"></span>
                          </div>
                        )}
                        {z.image && (
                          <div className="col-auto">
                            <img
                              src={resolveImageUrl(z.image)}
                              alt=""
                              style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }}
                            />
                          </div>
                        )}
                        <div className="col-auto">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            disabled={isDefault}
                            onClick={() => resetThemeZone(zone.id)}
                          >
                            Mặc định
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Ảnh nền toàn trang (tất cả các trang)</h6>
              <p className="text-muted small mb-3">
                Ảnh trang trí phía sau nội dung, áp dụng cho mọi trang (trang chủ, danh mục, sản
                phẩm, tin tức...) - không riêng trang chủ. Chưa upload thì hệ thống tự dùng nền
                gradient vàng hổ phách theo màu thương hiệu hiện tại.
              </p>
              <p className="text-muted small mb-3">
                <strong>Kích cỡ khuyến nghị:</strong> tối thiểu 1920×1080px (khổ ngang, tỉ lệ 16:9),
                định dạng JPG/PNG/WebP, dung lượng dưới 2MB để tải nhanh. Ảnh sẽ tự cắt phủ kín
                chiều rộng màn hình (giữ đúng tỉ lệ) và neo ở mép trên - nội dung quan trọng nên đặt
                giữa ảnh vì phần rìa trái/phải có thể bị cắt trên màn hình rộng hoặc hẹp khác nhau.
                Tông màu nên nhạt/trung tính để chữ và sản phẩm trên nền trắng của các khối nội dung
                vẫn rõ, dễ đọc.
              </p>
              <div className="row g-3 align-items-end">
                <div className="col-auto">
                  <label className="form-label small fw-bold">Ảnh nền</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control form-control-sm"
                    disabled={uploadingPageBg}
                    onChange={(e) => e.target.files[0] && handlePageBgUpload(e.target.files[0])}
                  />
                </div>
                {uploadingPageBg && (
                  <div className="col-auto">
                    <span className="spinner-border spinner-border-sm text-warning"></span>
                  </div>
                )}
                {pageBackgroundImage && (
                  <>
                    <div className="col-auto">
                      <img
                        src={resolveImageUrl(pageBackgroundImage)}
                        alt=""
                        style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 4 }}
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setPageBackgroundImage('')}
                      >
                        Xoá, dùng nền mặc định
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-warning w-100 fw-bold rounded-pill py-2" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminSettingsContent;
