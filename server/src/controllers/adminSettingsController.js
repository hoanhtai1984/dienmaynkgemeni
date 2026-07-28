const prisma = require('../lib/prisma');
const { THEME_ZONE_IDS } = require('../constants/themeZones');

// Chỉ giữ lại zone hợp lệ (có trong THEME_ZONE_IDS) và có ít nhất 1 trong 2
// field (bg/image) khác rỗng - zone không tuỳ chỉnh gì thì bỏ hẳn khỏi JSON
// lưu, để trạng thái "mặc định" gọn và rõ ràng thay vì lưu { bg:null,image:null }
// tràn lan.
function sanitizeThemeZones(input) {
  if (!input || typeof input !== 'object') return null;
  const result = {};
  for (const id of THEME_ZONE_IDS) {
    const z = input[id];
    if (!z || typeof z !== 'object') continue;
    const bg = typeof z.bg === 'string' && z.bg.trim() ? z.bg.trim() : null;
    const image = typeof z.image === 'string' && z.image.trim() ? z.image.trim() : null;
    if (bg || image) result[id] = { bg, image };
  }
  return Object.keys(result).length ? result : null;
}

// Chỉ giữ lại field hợp lệ + bỏ những mục chưa nhập gì (không slug hoặc
// không có ảnh lẫn tiêu đề) - tránh JSON phình to với các dòng rỗng do form
// admin luôn gửi lên đủ 1 dòng cho mỗi danh mục kể cả khi chưa điền.
const BANNER_THEMES = ['theme-amber', 'theme-dark'];
const BANNER_SIDES = ['left', 'right'];
const BANNER_LINK_TYPES = ['product', 'brand', 'category'];

function sanitizeCategoryBanners(input) {
  if (!Array.isArray(input)) return null;
  const result = input
    .map((b) => {
      if (!b || typeof b !== 'object' || !b.categorySlug) return null;
      const image = typeof b.image === 'string' ? b.image.trim() : '';
      const title = typeof b.title === 'string' ? b.title.trim() : '';
      if (!image && !title) return null;
      return {
        categorySlug: b.categorySlug,
        image: image || null,
        eyebrow: typeof b.eyebrow === 'string' ? b.eyebrow.trim() : '',
        title,
        priceLabel: typeof b.priceLabel === 'string' ? b.priceLabel.trim() : '',
        perk: typeof b.perk === 'string' ? b.perk.trim() : '',
        theme: BANNER_THEMES.includes(b.theme) ? b.theme : 'theme-amber',
        side: BANNER_SIDES.includes(b.side) ? b.side : 'left',
        linkType: BANNER_LINK_TYPES.includes(b.linkType) ? b.linkType : 'category',
        linkValue: typeof b.linkValue === 'string' ? b.linkValue.trim() : '',
      };
    })
    .filter(Boolean);
  return result.length ? result : null;
}

// 2 banner phụ cạnh slider chính trang chủ - đơn giản hơn categoryBanners
// (không eyebrow/priceLabel/perk/theme/side, chỉ ảnh + tiêu đề overlay + link),
// vì đây chỉ là banner quảng cáo chung, không gắn với 1 danh mục cụ thể nào.
function sanitizeHeroSideBanners(input) {
  if (!Array.isArray(input)) return null;
  const result = input
    .map((b) => {
      if (!b || typeof b !== 'object') return null;
      const image = typeof b.image === 'string' ? b.image.trim() : '';
      const title = typeof b.title === 'string' ? b.title.trim() : '';
      if (!image) return null;
      return {
        image,
        title,
        linkType: BANNER_LINK_TYPES.includes(b.linkType) ? b.linkType : 'category',
        linkValue: typeof b.linkValue === 'string' ? b.linkValue.trim() : '',
      };
    })
    .filter(Boolean);
  return result.length ? result : null;
}

// 2 banner ngang khuyến mãi giữa trang chủ (dưới khối danh mục) - trước đây
// viết cứng trong Home.jsx, null = Home.jsx tự dùng lại nội dung mặc định cũ
// (giống cách sanitizeHeroSlides null = giữ 3 slide mặc định). Phần tử thiếu
// ảnh vẫn giữ lại (khác heroSideBanners) vì cả 2 ô luôn hiển thị cố định
// cạnh nhau trên trang chủ (bố cục 2 cột), không tự ẩn theo từng ô.
function sanitizePromoBanners(input) {
  if (!Array.isArray(input)) return null;
  const result = input
    .slice(0, 2)
    .map((b) => {
      if (!b || typeof b !== 'object') return null;
      return {
        image: typeof b.image === 'string' ? b.image.trim() : '',
        title: typeof b.title === 'string' ? b.title.trim() : '',
        subtitle: typeof b.subtitle === 'string' ? b.subtitle.trim() : '',
        linkType: BANNER_LINK_TYPES.includes(b.linkType) ? b.linkType : 'category',
        linkValue: typeof b.linkValue === 'string' ? b.linkValue.trim() : '',
      };
    })
    .filter((b) => b && b.image);
  return result.length === 2 ? result : null;
}

// Popup chào mừng (chỉ hiện cho khách đã đăng nhập, xem WelcomePopup.jsx) -
// null/enabled=false/thiếu ảnh = không hiện popup quảng bá cho khách đã đăng
// nhập (khách chưa đăng nhập luôn thấy popup mời đăng ký riêng, không đọc
// field này).
function sanitizeWelcomePopup(input) {
  if (!input || typeof input !== 'object') return null;
  const image = typeof input.image === 'string' ? input.image.trim() : '';
  if (!image) return null;
  return {
    enabled: !!input.enabled,
    image,
    title: typeof input.title === 'string' ? input.title.trim() : '',
    buttonText: typeof input.buttonText === 'string' ? input.buttonText.trim() : '',
    linkType: BANNER_LINK_TYPES.includes(input.linkType) ? input.linkType : 'category',
    linkValue: typeof input.linkValue === 'string' ? input.linkValue.trim() : '',
  };
}

const HERO_SLIDE_BADGE_COLORS = ['danger', 'primary', 'success', 'warning'];

// Slide banner CHÍNH đầu trang chủ - null = giữ nguyên 3 slide mặc định viết
// sẵn trong Home.jsx (giới thiệu chung, không phụ thuộc DB), admin thêm ít
// nhất 1 slide có ảnh thì thay thế toàn bộ bằng nội dung tự nhập của admin.
function sanitizeHeroSlides(input) {
  if (!Array.isArray(input)) return null;
  const result = input
    .map((s) => {
      if (!s || typeof s !== 'object') return null;
      const image = typeof s.image === 'string' ? s.image.trim() : '';
      if (!image) return null;
      return {
        image,
        badgeText: typeof s.badgeText === 'string' ? s.badgeText.trim() : '',
        badgeColor: HERO_SLIDE_BADGE_COLORS.includes(s.badgeColor) ? s.badgeColor : 'danger',
        title: typeof s.title === 'string' ? s.title.trim() : '',
        subtitle: typeof s.subtitle === 'string' ? s.subtitle.trim() : '',
        buttonText: typeof s.buttonText === 'string' ? s.buttonText.trim() : '',
        buttonLink: typeof s.buttonLink === 'string' ? s.buttonLink.trim() : '',
      };
    })
    .filter(Boolean);
  return result.length ? result : null;
}

// Trang "Cài đặt" client giờ tách làm 2 trang riêng (Cài đặt chung / Giao
// diện & Nội dung trang chủ), mỗi trang chỉ gửi field của chính nó lên đây -
// vì vậy CHỈ được set field vào `data` khi field đó thật sự có mặt trong
// req.body (`key in req.body`), không được suy luận giá trị mặc định khi
// thiếu. Trước đây code luôn set mọi field kèm fallback (vd `|| null`,
// `Array.isArray(x) ? x : []`) - an toàn khi cả trang gửi 1 lượt, nhưng nếu
// trang A không gửi field của trang B thì field đó sẽ bị fallback về
// null/rỗng và XOÁ MẤT dữ liệu trang B đã lưu trước đó.
const REQUIRED_STRING_FIELDS = ['hotline', 'email', 'address', 'companyName', 'companyTaxCode', 'workingHours'];
const NULLABLE_STRING_FIELDS = [
  'chatbotPhone', 'facebookUrl', 'zaloUrl', 'youtubeUrl', 'tiktokUrl', 'instagramUrl',
  'complianceBadgeImage', 'complianceBadgeUrl', 'pageBackgroundImage', 'logoImage',
  'bankName', 'bankAccountNumber', 'bankAccountHolder', 'bankQrImage',
];
const JSON_ARRAY_FIELDS = ['coreFeatures', 'buyingGuideSteps', 'faqItems'];
const SANITIZED_JSON_FIELDS = {
  themeZones: sanitizeThemeZones,
  categoryBanners: sanitizeCategoryBanners,
  heroSideBanners: sanitizeHeroSideBanners,
  heroSlides: sanitizeHeroSlides,
  promoBanners: sanitizePromoBanners,
  welcomePopup: sanitizeWelcomePopup,
};

async function update(req, res) {
  const body = req.body;
  const data = {};

  for (const field of REQUIRED_STRING_FIELDS) {
    if (field in body) {
      if (!body[field]) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      data[field] = body[field];
    }
  }
  if ('aboutText' in body) {
    if (!body.aboutText) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    data.aboutText = body.aboutText;
  }
  for (const field of NULLABLE_STRING_FIELDS) {
    if (field in body) data[field] = typeof body[field] === 'string' ? body[field].trim() || null : null;
  }
  for (const field of JSON_ARRAY_FIELDS) {
    if (field in body) data[field] = Array.isArray(body[field]) ? body[field] : [];
  }
  if ('shippingFlatFee' in body) data.shippingFlatFee = Math.max(0, Number(body.shippingFlatFee) || 0);
  if ('freeShippingThreshold' in body) {
    const raw = body.freeShippingThreshold;
    data.freeShippingThreshold = raw === '' || raw === null || raw === undefined ? null : Math.max(0, Number(raw) || 0);
  }
  for (const [field, sanitize] of Object.entries(SANITIZED_JSON_FIELDS)) {
    if (field in body) data[field] = sanitize(body[field]);
  }
  // Dùng update() thay vì upsert() - hàng SiteSettings id=1 luôn có sẵn nhờ
  // prisma/seed.js chạy trước khi ứng dụng phục vụ request nào. upsert() vẫn
  // validate đủ field bắt buộc của nhánh `create` dù nhánh đó không bao giờ
  // chạy tới (Prisma kiểm tra kiểu dữ liệu ở client trước khi biết nhánh nào
  // sẽ thực thi) - với cập nhật từng phần như trên, `data` không có đủ mọi
  // field bắt buộc (vd `aboutText` khi lưu từ trang "Cài đặt chung"), khiến
  // upsert() luôn báo lỗi dù update thực tế đáng lẽ vẫn hợp lệ.
  const settings = await prisma.siteSettings.update({ where: { id: 1 }, data });

  res.json(settings);
}

const POLICY_PAGE_SLUGS = [
  'chinh-sach-bao-hanh', 'chinh-sach-doi-tra', 'van-chuyen', 'chinh-sach-thanh-toan',
  'chinh-sach-kiem-hang', 'chinh-sach-bao-ve-du-lieu-ca-nhan', 'quy-trinh-giai-quyet-khieu-nai',
  'dieu-khoan-dich-vu', 'chinh-sach-bao-mat',
];

function sanitizePolicySections(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((s) => ({
      heading: typeof s?.heading === 'string' ? s.heading.trim() : '',
      body: typeof s?.body === 'string' ? s.body.trim() : '',
    }))
    .filter((s) => s.heading || s.body);
}

// Lưu nội dung của DUY NHẤT 1 trang chính sách theo slug - đọc key khác
// trong policyPages JSON hiện có rồi ghi đè lại đúng key này, không đụng tới
// nội dung của các trang chính sách khác đã lưu trước đó.
async function updatePolicyPage(req, res) {
  const { slug } = req.params;
  if (!POLICY_PAGE_SLUGS.includes(slug)) {
    return res.status(400).json({ error: 'Trang chính sách không hợp lệ' });
  }

  const sections = sanitizePolicySections(req.body.sections);
  const current = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const policyPages = { ...(current?.policyPages || {}), [slug]: { sections } };

  const settings = await prisma.siteSettings.update({ where: { id: 1 }, data: { policyPages } });
  res.json(settings);
}

module.exports = { update, updatePolicyPage, POLICY_PAGE_SLUGS };
