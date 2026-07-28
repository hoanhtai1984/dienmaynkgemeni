import InfoPageLayout from '../../components/InfoPageLayout';
import PolicyPageContent from '../../components/PolicyPageContent';

export const DEFAULT_SECTIONS = [
  {
    heading: '1. Quyền kiểm tra hàng của khách hàng',
    body: 'Khách hàng có quyền kiểm tra tình trạng bên ngoài và phụ kiện đi kèm của sản phẩm trước khi thanh toán, áp dụng cho cả đơn hàng thanh toán khi nhận hàng (COD) lẫn đơn hàng đã chuyển khoản trước.',
  },
  {
    heading: '2. Nội dung kiểm tra',
    body: '- Đúng sản phẩm, đúng số lượng, mẫu mã, màu sắc như đã đặt hàng.\n- Tình trạng bên ngoài của hộp và sản phẩm - không móp méo, trầy xước, ẩm ướt do vận chuyển.\n- Đầy đủ phụ kiện, quà tặng kèm theo (nếu có), tem/phiếu bảo hành, hóa đơn mua hàng.\n- Đối với thiết bị điện tử/điện lạnh: kiểm tra sản phẩm khởi động và hoạt động bình thường khi có thể thực hiện tại chỗ.',
  },
  {
    heading: '3. Trường hợp phát hiện sai sót',
    body: 'Nếu phát hiện sản phẩm không đúng như đặt hàng, thiếu phụ kiện hoặc hư hỏng do vận chuyển, khách hàng có quyền **từ chối nhận hàng** ngay tại thời điểm giao hàng và không phải thanh toán. Vui lòng thông báo ngay cho nhân viên giao hàng và liên hệ hotline **{hotline}** hoặc trang Liên hệ để được hỗ trợ đổi hàng mới trong thời gian sớm nhất.',
  },
  {
    heading: '4. Lưu ý đối với sản phẩm đã nhận và ký xác nhận',
    body: 'Sau khi khách hàng đã kiểm tra và ký xác nhận nhận hàng đầy đủ, mọi khiếu nại liên quan đến tình trạng bên ngoài hoặc số lượng/phụ kiện đi kèm sẽ được xử lý theo Chính sách đổi trả và Chính sách bảo hành áp dụng cho lỗi phát sinh trong quá trình sử dụng, không thay thế cho việc kiểm tra hàng tại thời điểm giao nhận.',
  },
  {
    heading: '5. Sản phẩm đặc thù',
    body: 'Một số sản phẩm có niêm phong bảo hành hoặc đã kích hoạt phần mềm/bảo hành điện tử ngay khi mở hộp - với các sản phẩm này, việc kiểm tra bên ngoài (không bóc niêm phong nếu chưa xác nhận nhận hàng) là đủ để đảm bảo quyền lợi đổi trả sau này.',
  },
];

function ChinhSachKiemHang() {
  return (
    <InfoPageLayout title="Chính Sách Kiểm Hàng">
      <div className="bg-white p-4 p-md-5 rounded-4 border info-content">
        <PolicyPageContent slug="chinh-sach-kiem-hang" defaultSections={DEFAULT_SECTIONS} />
      </div>
    </InfoPageLayout>
  );
}

export default ChinhSachKiemHang;
