import InfoPageLayout from '../../components/InfoPageLayout';
import PolicyPageContent from '../../components/PolicyPageContent';

export const DEFAULT_SECTIONS = [
  {
    heading: '1. Phạm vi tiếp nhận',
    body: 'Điện Máy NK tiếp nhận mọi khiếu nại của khách hàng liên quan đến chất lượng sản phẩm, thái độ phục vụ, thời gian giao hàng, sai lệch thông tin đơn hàng/thanh toán, hoặc bất kỳ vấn đề nào phát sinh trong quá trình mua sắm trên website.',
  },
  {
    heading: '2. Kênh tiếp nhận khiếu nại',
    body: '- Hotline: **{hotline}** ({workingHours})\n- Email: **{email}**\n- Form tại trang Liên hệ\n- Trực tiếp tại địa chỉ: {address}',
  },
  {
    heading: '3. Quy trình xử lý',
    body: '- Bước 1 - Tiếp nhận và xác nhận (trong vòng 24 giờ): Nhân viên ghi nhận thông tin khiếu nại, xác nhận đã tiếp nhận với khách hàng qua kênh khách hàng đã liên hệ.\n- Bước 2 - Xác minh (1-3 ngày làm việc): Đối chiếu thông tin đơn hàng, sản phẩm, trao đổi thêm với khách hàng nếu cần để xác định nguyên nhân.\n- Bước 3 - Đề xuất phương án xử lý: Thông báo phương án giải quyết (đổi trả, bảo hành, hoàn tiền, xin lỗi và khắc phục...) phù hợp với từng trường hợp cụ thể.\n- Bước 4 - Xử lý dứt điểm (thông thường trong vòng 5-7 ngày làm việc kể từ khi xác nhận phương án): Thực hiện phương án đã thống nhất và phản hồi kết quả cuối cùng cho khách hàng.',
  },
  {
    heading: '4. Trường hợp phức tạp hoặc chưa thỏa đáng',
    body: 'Với các khiếu nại cần thời gian xác minh dài hơn (liên quan đến bảo hành hãng, vận chuyển liên tỉnh...), Điện Máy NK sẽ chủ động thông báo tiến độ cho khách hàng. Nếu khách hàng cho rằng phương án xử lý chưa thỏa đáng, có thể yêu cầu xem xét lại hoặc liên hệ cơ quan bảo vệ quyền lợi người tiêu dùng tại địa phương theo quy định pháp luật hiện hành.',
  },
  {
    heading: '5. Cam kết',
    body: 'Mọi khiếu nại đều được ghi nhận và xử lý công bằng, không phân biệt giá trị đơn hàng. Điện Máy NK cam kết không thu bất kỳ khoản phí nào cho việc tiếp nhận và xử lý khiếu nại hợp lệ.',
  },
];

function QuyTrinhGiaiQuyetKhieuNai() {
  return (
    <InfoPageLayout title="Quy Trình Giải Quyết Khiếu Nại">
      <div className="bg-white p-4 p-md-5 rounded-4 border info-content">
        <PolicyPageContent slug="quy-trinh-giai-quyet-khieu-nai" defaultSections={DEFAULT_SECTIONS} />
      </div>
    </InfoPageLayout>
  );
}

export default QuyTrinhGiaiQuyetKhieuNai;
