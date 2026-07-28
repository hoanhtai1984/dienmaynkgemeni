import { Link } from 'react-router-dom';
import InfoPageLayout from '../../components/InfoPageLayout';
import PolicyPageContent from '../../components/PolicyPageContent';

export const DEFAULT_SECTIONS = [
  {
    heading: '1. Giới thiệu',
    body: 'Điều khoản dịch vụ này áp dụng cho việc sử dụng website Điện Máy NK (dienmaynk.vn), vận hành bởi Công ty TNHH Thương Mại và Dịch Vụ Kone. Khi tạo tài khoản, đặt hàng hoặc sử dụng bất kỳ chức năng nào trên website, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản dưới đây.',
  },
  {
    heading: '2. Tài khoản người dùng',
    body: '- Bạn cần cung cấp thông tin chính xác (họ tên, email, số điện thoại) khi đăng ký tài khoản.\n- Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động diễn ra dưới tài khoản của mình.\n- Điện Máy NK có quyền tạm khóa hoặc xóa tài khoản nếu phát hiện thông tin gian dối hoặc hành vi gây hại cho hệ thống, người dùng khác.\n- Bạn có thể yêu cầu xóa tài khoản bất kỳ lúc nào bằng cách liên hệ bộ phận hỗ trợ.',
  },
  {
    heading: '3. Đặt hàng và thanh toán',
    body: 'Đơn hàng chỉ được xác nhận sau khi hệ thống ghi nhận đầy đủ thông tin giao hàng và phương thức thanh toán hợp lệ. Giá sản phẩm hiển thị trên website đã bao gồm thuế VAT trừ khi có ghi chú khác. Điện Máy NK có quyền từ chối hoặc hủy đơn hàng trong trường hợp phát hiện sai sót giá/tồn kho hoặc nghi ngờ gian lận, và sẽ thông báo cho khách hàng trong thời gian sớm nhất.',
  },
  {
    heading: '4. Quyền và nghĩa vụ của người dùng',
    body: '- Không sử dụng website cho mục đích vi phạm pháp luật, gây rối hoặc phá hoại hệ thống.\n- Không sao chép, phân phối lại nội dung, hình ảnh sản phẩm trên website khi chưa được phép.\n- Chịu trách nhiệm về tính chính xác của thông tin cung cấp khi đặt hàng (địa chỉ, số điện thoại...).',
  },
  {
    heading: '5. Giới hạn trách nhiệm',
    body: 'Điện Máy NK nỗ lực đảm bảo thông tin sản phẩm, giá cả trên website chính xác và cập nhật, tuy nhiên không đảm bảo website hoạt động liên tục, không lỗi trong mọi trường hợp. Chúng tôi không chịu trách nhiệm cho các thiệt hại gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng website ngoài phạm vi pháp luật quy định.',
  },
  {
    heading: '6. Thay đổi điều khoản',
    body: 'Điện Máy NK có thể cập nhật Điều khoản dịch vụ theo thời gian để phù hợp với quy định pháp luật hoặc thay đổi trong vận hành. Phiên bản mới nhất luôn được đăng tải tại trang này kèm ngày cập nhật.',
  },
];

function DieuKhoanDichVu() {
  return (
    <InfoPageLayout title="Điều Khoản Dịch Vụ">
      <div className="bg-white p-4 p-md-5 rounded-4 border info-content">
        <p className="text-muted small">Cập nhật lần cuối: 18/07/2026</p>

        <PolicyPageContent slug="dieu-khoan-dich-vu" defaultSections={DEFAULT_SECTIONS} />

        <p className="mt-4 mb-0">
          <em>Mọi thắc mắc về điều khoản dịch vụ, vui lòng <Link to="/lien-he">liên hệ với chúng tôi</Link> để được hỗ trợ.</em>
        </p>
      </div>
    </InfoPageLayout>
  );
}

export default DieuKhoanDichVu;
