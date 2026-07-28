import { Link } from 'react-router-dom';
import InfoPageLayout from '../../components/InfoPageLayout';
import PolicyPageContent from '../../components/PolicyPageContent';

export const DEFAULT_SECTIONS = [
  {
    heading: '1. Thông tin chúng tôi thu thập',
    body: '- Thông tin tài khoản: họ tên, email, số điện thoại, mật khẩu (được mã hóa, không lưu dạng văn bản thuần).\n- Thông tin đơn hàng: địa chỉ giao hàng, số điện thoại liên hệ, lịch sử mua hàng.\n- Thông tin kỹ thuật: địa chỉ IP, loại trình duyệt, dữ liệu truy cập website nhằm cải thiện trải nghiệm sử dụng.',
  },
  {
    heading: '2. Mục đích sử dụng thông tin',
    body: '- Xử lý đơn hàng, giao hàng và chăm sóc khách hàng.\n- Xác thực tài khoản, gửi email đặt lại mật khẩu khi được yêu cầu.\n- Gửi thông báo về đơn hàng, chương trình khuyến mãi (chỉ khi bạn đồng ý nhận thông tin).\n- Phân tích, cải thiện chất lượng sản phẩm và dịch vụ trên website.',
  },
  {
    heading: '3. Bảo mật thông tin',
    body: 'Mật khẩu tài khoản được mã hóa một chiều (hash) trước khi lưu trữ, không ai kể cả nhân viên Điện Máy NK có thể xem được mật khẩu gốc của bạn. Dữ liệu cá nhân được lưu trữ trên hệ thống có kiểm soát truy cập, chỉ nhân sự được phân quyền mới có thể truy cập nhằm mục đích xử lý đơn hàng và hỗ trợ khách hàng.',
  },
  {
    heading: '4. Chia sẻ thông tin với bên thứ ba',
    body: 'Điện Máy NK không bán, cho thuê thông tin cá nhân của khách hàng cho bên thứ ba vì mục đích thương mại. Thông tin giao hàng chỉ được chia sẻ với đơn vị vận chuyển trong phạm vi cần thiết để hoàn tất đơn hàng. Chúng tôi có thể cung cấp thông tin khi có yêu cầu hợp pháp từ cơ quan nhà nước có thẩm quyền theo quy định pháp luật hiện hành.',
  },
  {
    heading: '5. Quyền của khách hàng đối với dữ liệu cá nhân',
    body: '- Yêu cầu xem, chỉnh sửa thông tin tài khoản của mình bất kỳ lúc nào.\n- Yêu cầu xóa tài khoản và dữ liệu cá nhân liên quan bằng cách liên hệ bộ phận hỗ trợ.\n- Từ chối nhận email/thông báo khuyến mãi bất kỳ lúc nào.',
  },
  {
    heading: '6. Cookie',
    body: 'Website sử dụng cookie để ghi nhớ giỏ hàng, phiên đăng nhập và cải thiện trải nghiệm duyệt web. Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số chức năng của website có thể không hoạt động đầy đủ.',
  },
];

function ChinhSachBaoMat() {
  return (
    <InfoPageLayout title="Chính Sách Bảo Mật">
      <div className="bg-white p-4 p-md-5 rounded-4 border info-content">
        <p className="text-muted small">Cập nhật lần cuối: 18/07/2026</p>

        <PolicyPageContent slug="chinh-sach-bao-mat" defaultSections={DEFAULT_SECTIONS} />

        <p className="mt-4 mb-0">
          <em>
            Mọi thắc mắc về Chính sách bảo mật hoặc yêu cầu liên quan đến dữ liệu cá nhân, vui lòng{' '}
            <Link to="/lien-he">liên hệ với chúng tôi</Link> để được hỗ trợ. Xem thêm{' '}
            <Link to="/chinh-sach-bao-ve-du-lieu-ca-nhan">Chính sách bảo vệ dữ liệu cá nhân</Link> để biết chi tiết
            quyền của bạn theo quy định pháp luật.
          </em>
        </p>
      </div>
    </InfoPageLayout>
  );
}

export default ChinhSachBaoMat;
