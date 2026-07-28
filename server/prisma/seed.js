require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { buildProductSlug } = require('../src/utils/slugify');
const { seedSiteSettings } = require('./seed-site-settings');

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    slug: 'dien-tu',
    name: 'Điện Tử',
    icon: 'bi-tv-fill',
    subCategories: [
      { slug: 'tivi', name: 'Tivi', icon: 'bi-tv' },
      { slug: 'loa-thanh', name: 'Loa Thanh', icon: 'bi-speaker' },
    ],
  },
  {
    slug: 'dien-lanh',
    name: 'Điện Lạnh',
    icon: 'bi-snow',
    subCategories: [
      { slug: 'may-lanh', name: 'Máy Lạnh', icon: 'bi-snow' },
      { slug: 'tu-lanh', name: 'Tủ Lạnh, Tủ Đông, Tủ Mát', icon: 'bi-snow2' },
      { slug: 'may-giat', name: 'Máy Giặt', icon: 'bi-arrow-repeat' },
      { slug: 'may-say', name: 'Máy Sấy', icon: 'bi-brightness-high' },
      { slug: 'may-tam-nuoc-nong', name: 'Máy Tắm Nước Nóng', icon: 'bi-droplet-half' },
    ],
  },
  {
    slug: 'dien-gia-dung',
    name: 'Điện Gia Dụng',
    icon: 'bi-house-gear-fill',
    subCategories: [
      { slug: 'quat-lam-mat', name: 'Quạt, Thiết Bị Làm Mát', icon: 'bi-wind' },
      { slug: 'may-loc-khong-khi', name: 'Máy Lọc Không Khí, Tạo Ẩm, Hút Ẩm', icon: 'bi-cloud-haze2-fill' },
      { slug: 'may-rua-chen', name: 'Máy Rửa Chén', icon: 'bi-droplet' },
      { slug: 'may-loc-nuoc', name: 'Máy Lọc Nước, Cây Nước Nóng Lạnh, Làm Đá', icon: 'bi-droplet-fill' },
      {
        slug: 'do-gia-dung-nha-bep', name: 'Đồ Gia Dụng Nhà Bếp', icon: 'bi-egg-fried',
        subSubCategories: [
          { slug: 'noi-chien-khong-dau', name: 'Nồi Chiên Không Dầu', icon: 'bi-egg-fried' },
          { slug: 'noi-com-dien', name: 'Nồi Cơm Điện', icon: 'bi-cup-hot' },
          { slug: 'may-pha-ca-phe', name: 'Máy Pha Cà Phê', icon: 'bi-cup-straw' },
          { slug: 'lo-vi-song', name: 'Lò Vi Sóng', icon: 'bi-microwave' },
          { slug: 'may-xay-sinh-to', name: 'Máy Xay Sinh Tố', icon: 'bi-cup' },
        ],
      },
      { slug: 'may-hut-bui', name: 'Máy Hút Bụi', icon: 'bi-recycle' },
      { slug: 'ban-ui', name: 'Bàn Ủi', icon: 'bi-bag-fill' },
    ],
  },
  {
    slug: 'thiet-bi-lam-dep-cham-soc',
    name: 'Thiết Bị Làm Đẹp Và Chăm Sóc Cá Nhân',
    icon: 'bi-heart-pulse-fill',
    subCategories: [
      { slug: 'thiet-bi-lam-dep', name: 'Thiết Bị Làm Đẹp', icon: 'bi-magic' },
      { slug: 'thiet-bi-cham-soc-ca-nhan', name: 'Thiết Bị Chăm Sóc Cá Nhân', icon: 'bi-heart-pulse' },
    ],
  },
  {
    slug: 'gia-dung',
    name: 'Gia Dụng',
    icon: 'bi-cup-hot-fill',
    subCategories: [
      { slug: 'noi-chao', name: 'Nồi/Chảo, Bộ Nồi/Bộ Nồi Chảo', icon: 'bi-basket2-fill' },
      { slug: 'dao-thot-dung-cu-bep', name: 'Dao/Thớt/Dụng Cụ Bếp', icon: 'bi-scissors' },
      { slug: 'binh-giu-nhiet', name: 'Bình Giữ Nhiệt', icon: 'bi-cup-straw' },
      { slug: 'san-pham-khac', name: 'Sản Phẩm Khác', icon: 'bi-three-dots' },
    ],
  },
  {
    slug: 'phu-kien',
    name: 'Phụ Kiện',
    icon: 'bi-mouse2-fill',
    subCategories: [
      { slug: 'chuot-ban-phim', name: 'Chuột, Bàn Phím', icon: 'bi-mouse2-fill' },
      { slug: 'camera-the-nho', name: 'Camera, Thẻ Nhớ', icon: 'bi-camera-fill' },
      { slug: 'gia-treo', name: 'Giá Treo Màn Hình, Giá Treo Tivi', icon: 'bi-display' },
      { slug: 'man-hinh', name: 'Màn Hình', icon: 'bi-display' },
      { slug: 'den-ban', name: 'Đèn Bàn', icon: 'bi-lightbulb-fill' },
      { slug: 'phu-kien-khac', name: 'Phụ Kiện Khác', icon: 'bi-plug-fill' },
    ],
  },
  {
    slug: 'hang-thanh-ly',
    name: 'Hàng Thanh Lý',
    icon: 'bi-tag-fill',
    subCategories: [
      { slug: 'hang-can-mop', name: 'Hàng Chưa Qua Sử Dụng: Cấn Móp', icon: 'bi-exclamation-triangle-fill' },
      { slug: 'hang-da-qua-su-dung', name: 'Hàng Đã Qua Sử Dụng', icon: 'bi-arrow-repeat' },
    ],
  },
];

const BADGE_MAP = {
  'Bán chạy nhất': 'BAN_CHAY_NHAT',
  'Sắp cháy hàng': 'SAP_CHAY_HANG',
  'Vừa mở bán': 'VUA_MO_BAN',
  Mới: 'MOI',
};

function readLegacyProducts() {
  const filePath = path.join(__dirname, '../../assets/js/products-data.js');
  const text = fs.readFileSync(filePath, 'utf-8');
  const match = text.match(/const PRODUCTS = (\[[\s\S]*\n\]);/);
  if (!match) throw new Error('Không tìm thấy mảng PRODUCTS trong products-data.js');
  return JSON.parse(match[1]);
}

async function seedTaxonomy() {
  const categoryIdBySlug = {};
  const subCategoryIdBySlug = {};
  const subSubCategoryIdBySlug = {};

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const created = await prisma.category.create({
      data: { slug: cat.slug, name: cat.name, icon: cat.icon, position: i },
    });
    categoryIdBySlug[cat.slug] = created.id;

    for (let j = 0; j < cat.subCategories.length; j++) {
      const sub = cat.subCategories[j];
      const createdSub = await prisma.subCategory.create({
        data: {
          slug: sub.slug,
          name: sub.name,
          icon: sub.icon,
          position: j,
          categoryId: created.id,
        },
      });
      subCategoryIdBySlug[sub.slug] = createdSub.id;

      for (let k = 0; k < (sub.subSubCategories || []).length; k++) {
        const subSub = sub.subSubCategories[k];
        const createdSubSub = await prisma.subSubCategory.create({
          data: {
            slug: subSub.slug,
            name: subSub.name,
            icon: subSub.icon,
            position: k,
            subCategoryId: createdSub.id,
          },
        });
        subSubCategoryIdBySlug[subSub.slug] = createdSubSub.id;
      }
    }
  }

  return { categoryIdBySlug, subCategoryIdBySlug, subSubCategoryIdBySlug };
}

async function seedProducts(categoryIdBySlug, subCategoryIdBySlug, subSubCategoryIdBySlug) {
  const legacyProducts = readLegacyProducts();

  for (const p of legacyProducts) {
    const categoryId = categoryIdBySlug[p.category];
    if (!categoryId) throw new Error(`Không rõ category slug: ${p.category} (product id ${p.id})`);
    const subCategoryId = p.subCategory ? subCategoryIdBySlug[p.subCategory] || null : null;
    const subSubCategoryId = p.subSubCategory ? subSubCategoryIdBySlug[p.subSubCategory] || null : null;

    await prisma.product.create({
      data: {
        id: p.id,
        slug: buildProductSlug(p.name, p.id),
        name: p.name,
        brand: p.brand,
        price: p.price,
        oldPrice: p.oldPrice,
        rating: p.rating,
        reviewCount: p.reviewCount,
        sold: p.sold,
        // Dữ liệu sản phẩm gốc (legacy) không có tồn kho - không seed thì mọi
        // sản phẩm mặc định stock=0 (theo schema), khiến catalog fresh-seed
        // không đặt hàng được sản phẩm nào (chặn bởi kiểm tra tồn kho khi tạo
        // đơn). Gán số lượng giả lập cố định theo id (5-50) để deterministic
        // giữa các lần seed, phục vụ cả dev thật lẫn test tự động.
        stock: 5 + (p.id % 46),
        badge: BADGE_MAP[p.badge] || null,
        description: p.description,
        specs: p.specs,
        categoryId,
        subCategoryId,
        subSubCategoryId,
        images: {
          create: (p.images && p.images.length ? p.images : [p.image]).map((url, position) => ({
            url,
            position,
          })),
        },
      },
    });
  }

  // Giữ auto-increment tiếp sau id lớn nhất đã seed thủ công (54).
  await prisma.$executeRawUnsafe(
    `ALTER TABLE Product AUTO_INCREMENT = ${legacyProducts.length + 1}`
  );

  return legacyProducts.length;
}

const BLOG_POSTS = [
  {
    slug: 'sai-lam-khi-dung-noi-chien-khong-dau',
    title: '5 sai lầm thường gặp khi dùng nồi chiên không dầu khiến máy nhanh hỏng',
    category: 'Mẹo Hay Gia Đình',
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=900&q=80',
    excerpt: 'Nồi chiên không dầu giúp bữa ăn lành mạnh hơn, nhưng dùng sai cách không chỉ giảm tuổi thọ máy mà còn ảnh hưởng chất lượng món ăn.',
    content: `Nồi chiên không dầu là thiết bị quen thuộc trong gian bếp hiện đại, nhưng không phải ai cũng dùng đúng cách. Dưới đây là 5 sai lầm phổ biến nhất.

1. Không làm nóng nồi trước khi chiên: giống lò nướng, nồi chiên không dầu cần vài phút làm nóng để món ăn chín đều, giòn ngon hơn.

2. Xếp thực phẩm quá đầy khay: khí nóng cần lưu thông đều quanh thực phẩm. Xếp quá dày khiến món ăn chín không đều, thậm chí bị sống ở giữa.

3. Không lau khô thực phẩm trước khi chiên: nước dư thừa làm giảm độ giòn và có thể bắn dầu/nước gây nguy hiểm.

4. Dùng vật dụng kim loại sắc nhọn để lấy thức ăn: dễ làm trầy lớp chống dính của khay, giảm tuổi thọ và có thể ảnh hưởng sức khỏe khi lớp chống dính bong tróc.

5. Không vệ sinh khay chiên sau mỗi lần dùng: dầu mỡ tích tụ lâu ngày không chỉ gây mùi mà còn ảnh hưởng đến hiệu suất làm nóng của máy.

Vệ sinh đúng cách và sử dụng đúng hướng dẫn nhà sản xuất sẽ giúp nồi chiên không dầu bền hơn và món ăn ngon hơn mỗi ngày.`,
  },
  {
    slug: 'may-loc-nuoc-ro-hay-nano',
    title: 'Máy lọc nước RO hay Nano: nên chọn loại nào cho gia đình?',
    category: 'Tư Vấn Mua Sắm',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=900&q=80',
    excerpt: 'Mỗi công nghệ lọc nước phù hợp với một nguồn nước đầu vào khác nhau. Chọn sai loại vừa tốn tiền vừa không đảm bảo an toàn.',
    content: `Máy lọc nước RO (thẩm thấu ngược) lọc gần như toàn bộ tạp chất, kim loại nặng và vi khuẩn nhờ màng lọc siêu nhỏ, phù hợp với nguồn nước máy đô thị, nước giếng khoan có nhiều tạp chất.

Máy lọc nước Nano giữ lại một phần khoáng chất tự nhiên có lợi trong nước, phù hợp với nguồn nước máy đã qua xử lý, chất lượng đầu vào tương đối tốt.

Nếu nguồn nước nhà bạn là nước giếng khoan hoặc nghi ngờ có kim loại nặng, nên ưu tiên máy lọc RO. Nếu dùng nước máy thành phố đã qua xử lý, máy lọc Nano tiết kiệm điện hơn (không cần bơm áp lực) và giữ lại khoáng chất tốt cho sức khỏe.

Dù chọn loại nào, hãy nhớ thay lõi lọc định kỳ theo khuyến cáo nhà sản xuất (thường 6-12 tháng/lần) để đảm bảo chất lượng nước đầu ra.`,
  },
  {
    slug: 'che-do-eco-may-lanh-co-tiet-kiem-dien',
    title: 'Chế độ Eco trên máy lạnh có thực sự giúp tiết kiệm điện?',
    category: 'Bí Quyết Công Nghệ',
    image: 'https://images.unsplash.com/photo-1631545806609-96e2296a48c9?auto=format&fit=crop&w=900&q=80',
    excerpt: 'Nút Eco trên điều khiển máy lạnh không phải "phép màu" giảm điện ngay lập tức - hiểu đúng cách hoạt động sẽ giúp bạn dùng hiệu quả hơn.',
    content: `Chế độ Eco (tiết kiệm điện) trên máy lạnh hoạt động bằng cách giới hạn công suất nén tối đa và điều chỉnh nhiệt độ dao động trong khoảng hẹp hơn so với chế độ thường, giúp máy nén không phải hoạt động hết công suất liên tục.

Chế độ này tiết kiệm điện rõ rệt khi phòng đã đạt nhiệt độ mong muốn (thường sau 15-30 phút đầu bật máy), nhưng có thể khiến phòng làm lạnh chậm hơn nếu bật Eco ngay từ đầu trong phòng đang rất nóng.

Cách dùng hiệu quả: bật máy ở chế độ thường cho đến khi phòng đạt nhiệt độ mong muốn, sau đó chuyển sang Eco để duy trì. Kết hợp thêm quạt trần để lưu thông khí lạnh cũng giúp máy đỡ phải hoạt động mạnh, tiết kiệm điện hơn 20-30% so với chỉ bật máy lạnh chế độ thường liên tục.`,
  },
  {
    slug: 'bao-lau-nen-ve-sinh-may-pha-ca-phe',
    title: 'Bao lâu nên vệ sinh máy pha cà phê tại nhà để giữ hương vị chuẩn?',
    category: 'Hướng Dẫn Sử Dụng',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    excerpt: 'Cặn cà phê và cặn vôi tích tụ theo thời gian không chỉ làm hỏng hương vị mà còn ảnh hưởng tuổi thọ máy pha cà phê tại nhà.',
    content: `Máy pha cà phê tại nhà cần vệ sinh ở 2 cấp độ: vệ sinh hằng ngày và tẩy cặn định kỳ.

Vệ sinh hằng ngày: sau mỗi lần pha, tháo và rửa sạch phễu lọc/portafilter, lau khô vòi hơi nếu có đánh sữa để tránh cặn sữa đóng cứng.

Tẩy cặn vôi định kỳ: nên thực hiện mỗi 1-3 tháng tùy tần suất sử dụng và độ cứng của nguồn nước (nước cứng cần tẩy cặn thường xuyên hơn). Sử dụng dung dịch tẩy cặn chuyên dụng cho máy pha cà phê, không dùng giấm hay chanh vì có thể để lại mùi hoặc ăn mòn linh kiện không đúng cách.

Dấu hiệu máy cần tẩy cặn: nước chảy chậm hơn bình thường, có cặn trắng ở vòi ra nước, hoặc đèn báo tẩy cặn sáng trên máy (với dòng có màn hình điện tử). Vệ sinh đúng định kỳ giúp máy bền hơn và cà phê luôn giữ được hương vị chuẩn.`,
  },
  {
    slug: 'cach-chon-cong-suat-may-lanh-phu-hop',
    title: 'Cách chọn công suất máy lạnh (HP) phù hợp với diện tích phòng',
    category: 'Tư Vấn Mua Sắm',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=900&q=80',
    excerpt: 'Chọn máy lạnh dư công suất vừa tốn tiền mua, thiếu công suất thì làm lạnh không hiệu quả và hao điện hơn.',
    content: `Công thức tham khảo nhanh: mỗi 1 HP (ngựa) máy lạnh phù hợp với khoảng 15-20 m² phòng có trần cao tiêu chuẩn, cách nhiệt tốt.

- Phòng 9-15 m²: nên chọn máy 1 HP.
- Phòng 15-20 m²: nên chọn máy 1.5 HP.
- Phòng 20-30 m²: nên chọn máy 2 HP.
- Phòng trên 30 m² hoặc phòng khách liền bếp: nên chọn máy 2.5 HP trở lên hoặc lắp 2 máy.

Ngoài diện tích, cần tính thêm các yếu tố: hướng phòng (phòng hướng Tây nắng gắt nên chọn công suất cao hơn 1 bậc), số người thường xuyên sử dụng, và độ cách nhiệt của phòng (trần thạch cao, cửa kính lớn giữ nhiệt kém hơn tường gạch).

Chọn đúng công suất không chỉ giúp phòng mát nhanh mà còn tiết kiệm điện lâu dài - máy quá nhỏ so với diện tích phải chạy hết công suất liên tục, hao điện hơn nhiều so với máy chọn đúng công suất.`,
  },
  {
    slug: 'tu-lanh-inverter-co-thuc-su-tiet-kiem-dien',
    title: 'Tủ lạnh Inverter có thực sự tiết kiệm điện hơn tủ lạnh thường?',
    category: 'Mẹo Hay Gia Đình',
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80',
    excerpt: 'Công nghệ Inverter đã trở thành tiêu chuẩn trên tủ lạnh mới, nhưng mức tiết kiệm điện thực tế phụ thuộc vào thói quen sử dụng.',
    content: `Tủ lạnh thường (block cơ) hoạt động theo kiểu bật/tắt liên tục để duy trì nhiệt độ - mỗi lần khởi động lại tiêu tốn dòng điện khởi động lớn hơn bình thường.

Tủ lạnh Inverter điều chỉnh tốc độ máy nén linh hoạt theo nhu cầu làm lạnh thực tế, tránh việc bật/tắt đột ngột, giúp tiết kiệm điện trung bình 20-40% so với tủ lạnh thường có cùng dung tích, đồng thời vận hành êm hơn và ít hao mòn linh kiện hơn.

Tuy nhiên, mức tiết kiệm thực tế còn phụ thuộc vào thói quen sử dụng: mở tủ lạnh thường xuyên, để thực phẩm còn nóng vào tủ, hay chỉnh nhiệt độ quá thấp không cần thiết đều làm giảm hiệu quả tiết kiệm điện của công nghệ Inverter.

Nhìn chung, với chi phí chênh lệch không quá lớn so với tủ lạnh thường, tủ lạnh Inverter là lựa chọn đáng đầu tư cho các gia đình sử dụng lâu dài.`,
  },
];

async function seedPosts() {
  for (const post of BLOG_POSTS) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }
  return BLOG_POSTS.length;
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Thiếu ADMIN_EMAIL hoặc ADMIN_PASSWORD trong .env');
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.admin.create({
    data: { email, password: hashed, name: 'Admin' },
  });
}

// Production lần đầu (site chưa có sản phẩm/bài viết thật) nên bỏ qua dữ
// liệu demo (83 sản phẩm mẫu + 6 bài blog mẫu) - chỉ cần danh mục (bắt buộc
// để form thêm sản phẩm trong admin có dropdown danh mục), tài khoản admin,
// và site settings (bắt buộc để GET /api/settings không trả 404). Set
// SEED_SKIP_DEMO_CONTENT=true khi chạy seed trên production để bỏ qua.
async function main() {
  const skipDemoContent = process.env.SEED_SKIP_DEMO_CONTENT === 'true';

  console.log('Seeding taxonomy...');
  const { categoryIdBySlug, subCategoryIdBySlug, subSubCategoryIdBySlug } = await seedTaxonomy();
  console.log(`  ${CATEGORIES.length} categories, ${Object.keys(subCategoryIdBySlug).length} subcategories, ${Object.keys(subSubCategoryIdBySlug).length} sub-subcategories`);

  if (skipDemoContent) {
    console.log('SEED_SKIP_DEMO_CONTENT=true - bỏ qua sản phẩm/bài viết mẫu.');
  } else {
    console.log('Seeding products...');
    const count = await seedProducts(categoryIdBySlug, subCategoryIdBySlug, subSubCategoryIdBySlug);
    console.log(`  ${count} products`);

    console.log('Seeding blog posts...');
    const postCount = await seedPosts();
    console.log(`  ${postCount} posts`);
  }

  console.log('Seeding admin account...');
  await seedAdmin();
  console.log('  done');

  console.log('Seeding site settings...');
  await seedSiteSettings(prisma);
  console.log('  done');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
