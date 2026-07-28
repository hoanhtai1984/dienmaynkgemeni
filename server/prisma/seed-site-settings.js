// Điền cấu hình site với đúng nội dung thật đang hardcode trong code hiện
// tại, để chuyển sang lấy từ DB không làm mất/đổi nội dung đang hiển thị.
// Chạy: node prisma/seed-site-settings.js (an toàn chạy lại nhiều lần - dùng
// upsert nên không tạo trùng dòng).
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DATA = {
  hotline: '0971 370 152',
  email: 'hoanhtaipro@gmail.com',
  address: '860/16 An Dương Vương, Phường Phú Lâm, Thành phố Hồ Chí Minh',
  companyName: 'Công ty TNHH Thương Mại và Dịch Vụ Kone',
  companyTaxCode: '0318653314',
  workingHours: '8:00 - 21:00, tất cả các ngày trong tuần',
  facebookUrl: null,
  zaloUrl: null,
  youtubeUrl: null,
  tiktokUrl: null,
  instagramUrl: null,
  aboutText:
    'Điện Máy NK là hệ thống bán lẻ điện máy - điện lạnh - gia dụng chính hãng, ra đời với mục tiêu mang đến cho khách hàng những sản phẩm chất lượng, giá cả hợp lý cùng trải nghiệm mua sắm nhanh chóng, tiện lợi. Từ một cửa hàng nhỏ, chúng tôi từng bước mở rộng danh mục sản phẩm để phục vụ đầy đủ nhu cầu điện máy trong gia đình hiện đại.\n\nChúng tôi phân phối đa dạng ngành hàng: điện gia dụng, điện lạnh (máy lạnh, tủ lạnh, máy giặt), máy lọc nước, máy pha cà phê, tivi - loa - âm thanh và thiết bị số, phụ kiện công nghệ, với các thương hiệu uy tín như Panasonic, Philips, Samsung, LG, Daikin, Sony và nhiều hãng lớn khác.',
  coreFeatures: [
    { title: 'Giao Hàng Siêu Tốc', description: 'Nội thành TP.HCM trong 2 giờ' },
    { title: 'Chính Hãng 100%', description: 'Bảo hành điện tử toàn quốc' },
    { title: 'Lỗi Là Đổi Mới', description: 'Đổi trả uy tín trong 35 ngày đầu' },
    { title: 'Trả Góp Lãi Suất 0%', description: 'Thủ tục nhanh, hỗ trợ qua thẻ' },
  ],
  buyingGuideSteps: [
    {
      title: 'Chọn sản phẩm',
      description:
        'Duyệt qua các danh mục sản phẩm hoặc sử dụng ô tìm kiếm ở đầu trang để tìm sản phẩm bạn cần. Nhấn vào sản phẩm để xem chi tiết thông số, giá bán và các ưu đãi đi kèm.',
    },
    {
      title: 'Thêm vào giỏ hàng',
      description:
        'Tại trang chi tiết sản phẩm, chọn số lượng mong muốn và nhấn "Thêm vào giỏ hàng". Bạn có thể tiếp tục chọn thêm sản phẩm khác hoặc vào giỏ hàng để xem lại các mục đã chọn.',
    },
    {
      title: 'Kiểm tra giỏ hàng & đặt hàng',
      description:
        'Vào trang Giỏ hàng, kiểm tra lại sản phẩm, số lượng, tổng tiền. Điều chỉnh số lượng hoặc xóa sản phẩm nếu cần, sau đó điền thông tin giao hàng (họ tên, số điện thoại, địa chỉ) để hoàn tất đặt hàng.',
    },
    {
      title: 'Xác nhận và nhận hàng',
      description:
        'Sau khi đặt hàng, nhân viên Điện Máy NK sẽ liên hệ xác nhận đơn hàng. Đơn hàng sẽ được giao đến địa chỉ bạn cung cấp, thanh toán khi nhận hàng (COD) hoặc theo hình thức đã thỏa thuận.',
    },
  ],
  faqItems: [
    {
      question: 'Sản phẩm tại Điện Máy NK có phải hàng chính hãng không?',
      answer:
        'Tất cả sản phẩm tại Điện Máy NK đều là hàng chính hãng 100%, có đầy đủ tem bảo hành, phiếu bảo hành điện tử và nguồn gốc xuất xứ rõ ràng từ nhà phân phối ủy quyền.',
    },
    {
      question: 'Tôi có thể thanh toán bằng hình thức nào?',
      answer:
        'Điện Máy NK hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng và trả góp qua thẻ tín dụng với lãi suất 0% cho một số sản phẩm và ngân hàng liên kết.',
    },
    {
      question: 'Thời gian giao hàng mất bao lâu?',
      answer:
        'Khu vực nội thành TP.HCM được giao hàng nhanh trong vòng 2 giờ. Các tỉnh/thành khác thường mất từ 1-3 ngày làm việc. Xem chi tiết tại trang Chính sách vận chuyển.',
    },
    {
      question: 'Tôi có thể đổi trả sản phẩm không?',
      answer:
        'Có. Điện Máy NK áp dụng chính sách đổi mới trong 35 ngày đầu nếu sản phẩm gặp lỗi do nhà sản xuất. Xem chi tiết tại trang Chính sách đổi trả.',
    },
    {
      question: 'Sản phẩm được bảo hành trong bao lâu?',
      answer:
        'Thời gian bảo hành từ 12-24 tháng tùy sản phẩm và thương hiệu, được ghi cụ thể trên phiếu bảo hành đi kèm. Xem chi tiết tại trang Chính sách bảo hành.',
    },
    {
      question: 'Làm sao để đặt hàng trên website?',
      answer:
        'Bạn chỉ cần chọn sản phẩm, thêm vào giỏ hàng, sau đó điền thông tin giao hàng tại trang giỏ hàng và xác nhận đặt hàng. Xem hướng dẫn chi tiết tại trang Hướng dẫn mua hàng.',
    },
    {
      question: 'Tôi cần liên hệ ai khi có thắc mắc về đơn hàng?',
      answer:
        'Vui lòng gọi hotline 0971 370 152 (8:00 - 21:00 tất cả các ngày) hoặc gửi yêu cầu qua trang Liên hệ, đội ngũ tư vấn viên sẽ hỗ trợ bạn nhanh nhất.',
    },
  ],
};

async function seedSiteSettings(client = prisma) {
  await client.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...DATA },
    update: DATA,
  });
}

module.exports = { seedSiteSettings, DATA };

if (require.main === module) {
  seedSiteSettings()
    .then(() => console.log('Đã điền cấu hình site (SiteSettings id=1).'))
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
