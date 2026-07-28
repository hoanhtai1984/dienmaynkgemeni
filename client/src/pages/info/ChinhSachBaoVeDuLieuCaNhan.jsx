import { Link } from 'react-router-dom';
import InfoPageLayout from '../../components/InfoPageLayout';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import PolicyPageContent from '../../components/PolicyPageContent';

export const DEFAULT_SECTIONS = [
  {
    heading: '1. Phạm vi áp dụng',
    body: 'Áp dụng với mọi dữ liệu cá nhân của khách hàng, người dùng tài khoản mà Điện Máy NK thu thập, xử lý trong quá trình cung cấp dịch vụ mua sắm trực tuyến, bao gồm cả dữ liệu thu thập trực tiếp (đăng ký, đặt hàng, liên hệ) và gián tiếp (dữ liệu kỹ thuật khi truy cập website).',
  },
  {
    heading: '2. Nguyên tắc xử lý dữ liệu cá nhân',
    body: '- Chỉ thu thập dữ liệu cần thiết, đúng mục đích đã thông báo cho khách hàng.\n- Không xử lý dữ liệu cá nhân cho mục đích khác mục đích ban đầu nếu chưa có sự đồng ý của khách hàng.\n- Dữ liệu được lưu trữ trong thời gian cần thiết để thực hiện mục đích thu thập hoặc theo yêu cầu pháp luật.\n- Áp dụng các biện pháp kỹ thuật và quản lý phù hợp để bảo vệ dữ liệu khỏi truy cập, sử dụng trái phép.',
  },
  {
    heading: '3. Quyền của khách hàng đối với dữ liệu cá nhân',
    body: '- Quyền được biết: biết về hoạt động xử lý dữ liệu cá nhân của mình, trừ trường hợp pháp luật có quy định khác.\n- Quyền đồng ý/rút lại sự đồng ý: đồng ý hoặc không đồng ý cho phép xử lý dữ liệu cá nhân, và có thể rút lại sự đồng ý bất kỳ lúc nào.\n- Quyền truy cập, chỉnh sửa: xem, cập nhật thông tin cá nhân của mình trong tài khoản bất kỳ lúc nào.\n- Quyền xóa dữ liệu: yêu cầu xóa tài khoản và dữ liệu cá nhân liên quan, trừ trường hợp pháp luật yêu cầu lưu trữ.\n- Quyền hạn chế xử lý, phản đối: yêu cầu tạm ngừng hoặc phản đối việc xử lý dữ liệu cho một số mục đích nhất định (vd: quảng cáo, khuyến mãi).\n- Quyền khiếu nại, tố cáo: khiếu nại, tố cáo hoặc khởi kiện theo quy định pháp luật nếu phát hiện hành vi vi phạm liên quan đến dữ liệu cá nhân của mình.',
  },
  {
    heading: '4. Cách thức thực hiện quyền',
    body: 'Để thực hiện bất kỳ quyền nào nêu trên, khách hàng gửi yêu cầu qua hotline **{hotline}**, email **{email}**, hoặc trang Liên hệ, kèm thông tin xác minh tài khoản. Điện Máy NK sẽ phản hồi và xử lý yêu cầu trong thời gian sớm nhất theo quy định pháp luật.',
  },
  {
    heading: '5. Chia sẻ dữ liệu với bên thứ ba',
    body: 'Dữ liệu cá nhân chỉ được chia sẻ với đơn vị vận chuyển, đối tác thanh toán trong phạm vi cần thiết để hoàn tất đơn hàng, hoặc khi có yêu cầu hợp pháp từ cơ quan nhà nước có thẩm quyền. Điện Máy NK không mua bán, trao đổi dữ liệu cá nhân của khách hàng vì mục đích thương mại với bất kỳ bên thứ ba nào khác.',
  },
];

function ChinhSachBaoVeDuLieuCaNhan() {
  const { settings } = useSiteSettings();
  return (
    <InfoPageLayout title="Chính Sách Bảo Vệ Dữ Liệu Cá Nhân">
      <div className="bg-white p-4 p-md-5 rounded-4 border info-content">
        <p className="text-muted small">Cập nhật lần cuối: 24/07/2026</p>

        <p>
          Chính sách này được xây dựng theo tinh thần Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, quy định cụ
          thể quyền của khách hàng đối với dữ liệu cá nhân của mình khi sử dụng website Điện Máy NK, bổ sung cho{' '}
          <Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link> chung của website.
        </p>

        <PolicyPageContent slug="chinh-sach-bao-ve-du-lieu-ca-nhan" defaultSections={DEFAULT_SECTIONS} />

        <h2>6. Liên hệ về bảo vệ dữ liệu cá nhân</h2>
        <p>
          Mọi thắc mắc, yêu cầu liên quan đến việc xử lý dữ liệu cá nhân, vui lòng{' '}
          <Link to="/lien-he">liên hệ với chúng tôi</Link> để được hỗ trợ.
        </p>
      </div>
    </InfoPageLayout>
  );
}

export default ChinhSachBaoVeDuLieuCaNhan;
