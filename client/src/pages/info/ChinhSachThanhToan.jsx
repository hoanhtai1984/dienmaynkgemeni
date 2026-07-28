import InfoPageLayout from '../../components/InfoPageLayout';
import PolicyPageContent from '../../components/PolicyPageContent';

export const DEFAULT_SECTIONS = [
  {
    heading: '1. Các hình thức thanh toán được hỗ trợ',
    body: '- Thanh toán khi nhận hàng (COD): Khách hàng kiểm tra sản phẩm và thanh toán trực tiếp cho nhân viên giao hàng khi nhận được hàng.\n- Chuyển khoản ngân hàng: Số tài khoản và mã QR chuyển khoản hiển thị ngay tại bước đặt hàng và trang xác nhận đơn hàng sau khi đặt thành công. Đơn hàng được xử lý ngay khi hệ thống xác nhận đã nhận đủ thanh toán.',
  },
  {
    heading: '2. Quy định về giá và thuế',
    body: 'Giá sản phẩm hiển thị trên website đã bao gồm thuế VAT theo quy định pháp luật hiện hành, trừ khi có ghi chú khác. Điện Máy NK không thu thêm bất kỳ khoản phí ẩn nào ngoài giá đã hiển thị và phí vận chuyển (nếu có), được thông báo rõ ràng trước khi khách hàng xác nhận đặt hàng.',
  },
  {
    heading: '3. Xuất hóa đơn',
    body: 'Khách hàng mua hàng với tư cách cá nhân có thể yêu cầu xuất hóa đơn bán lẻ thông thường. Đối với khách hàng mua hàng nhân danh công ty/doanh nghiệp, vui lòng chọn mục "Yêu cầu xuất hóa đơn công ty (VAT)" và điền đầy đủ thông tin (tên công ty, mã số thuế, địa chỉ) ngay tại bước đặt hàng - hóa đơn GTGT sẽ được xuất trong vòng 3-5 ngày làm việc sau khi đơn hàng hoàn tất.',
  },
  {
    heading: '4. An toàn khi thanh toán',
    body: 'Điện Máy NK không yêu cầu khách hàng cung cấp mật khẩu, mã OTP hay thông tin thẻ ngân hàng qua điện thoại, tin nhắn hoặc email dưới bất kỳ hình thức nào. Nếu nhận được yêu cầu đáng ngờ tự xưng là nhân viên Điện Máy NK, vui lòng không cung cấp thông tin và liên hệ ngay hotline **{hotline}** để xác minh.',
  },
  {
    heading: '5. Xử lý khi thanh toán gặp sự cố',
    body: 'Trường hợp đã chuyển khoản nhưng đơn hàng chưa được xác nhận sau thời gian hợp lý, hoặc phát sinh sai lệch giữa số tiền đã thanh toán và giá trị đơn hàng, vui lòng liên hệ ngay hotline hoặc trang Liên hệ kèm mã đơn hàng để được đối chiếu và xử lý trong thời gian sớm nhất.',
  },
];

function ChinhSachThanhToan() {
  return (
    <InfoPageLayout title="Chính Sách Thanh Toán">
      <div className="bg-white p-4 p-md-5 rounded-4 border info-content">
        <PolicyPageContent slug="chinh-sach-thanh-toan" defaultSections={DEFAULT_SECTIONS} />
      </div>
    </InfoPageLayout>
  );
}

export default ChinhSachThanhToan;
