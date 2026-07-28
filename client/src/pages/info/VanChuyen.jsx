import InfoPageLayout from '../../components/InfoPageLayout';
import PolicyPageContent from '../../components/PolicyPageContent';

export const DEFAULT_SECTIONS = [
  {
    heading: '1. Khu vực và thời gian giao hàng',
    body: '- Nội thành TP.HCM: Giao hàng nhanh trong vòng 2 giờ đối với đơn hàng đặt trước 18:00.\n- Các tỉnh/thành khác: Thời gian giao hàng dự kiến từ 1-3 ngày làm việc, tùy khu vực.\n- Khu vực đặc biệt (vùng sâu, vùng xa, hải đảo): Thời gian có thể kéo dài hơn, nhân viên sẽ liên hệ báo trước.',
  },
  {
    heading: '2. Phí vận chuyển',
    body: 'Miễn phí vận chuyển cho hầu hết đơn hàng trong nội thành TP.HCM. Đối với các khu vực khác, phí vận chuyển được tính dựa trên khoảng cách và trọng lượng/kích thước sản phẩm, sẽ được thông báo cụ thể cho khách hàng trước khi xác nhận đơn hàng.',
  },
  {
    heading: '3. Giao hàng và lắp đặt',
    body: '- Đối với các sản phẩm điện lạnh (máy lạnh, máy giặt, tủ lạnh cỡ lớn), Điện Máy NK hỗ trợ vận chuyển và lắp đặt cơ bản tận nơi.\n- Nhân viên giao hàng sẽ liên hệ trước để xác nhận thời gian giao hàng phù hợp với khách hàng.\n- Khách hàng vui lòng kiểm tra tình trạng bên ngoài sản phẩm trước khi ký nhận hàng.',
  },
  {
    heading: '4. Kiểm tra hàng khi nhận',
    body: 'Khách hàng có quyền yêu cầu kiểm tra sản phẩm (tình trạng bên ngoài, phụ kiện đi kèm) trước khi thanh toán đối với hình thức thanh toán khi nhận hàng (COD). Nếu phát hiện sản phẩm không đúng như đặt hàng hoặc bị hư hỏng do vận chuyển, vui lòng từ chối nhận hàng và liên hệ ngay hotline **{hotline}**. Xem chi tiết tại trang Chính sách kiểm hàng.',
  },
  {
    heading: '5. Theo dõi đơn hàng',
    body: 'Sau khi đặt hàng thành công, khách hàng sẽ nhận được thông tin xác nhận đơn hàng. Để tra cứu tình trạng đơn hàng, vui lòng liên hệ trực tiếp hotline hoặc trang Liên hệ kèm mã đơn hàng/số điện thoại đặt hàng.',
  },
];

function VanChuyen() {
  return (
    <InfoPageLayout title="Chính Sách Vận Chuyển">
      <div className="bg-white p-4 p-md-5 rounded-4 border info-content">
        <PolicyPageContent slug="van-chuyen" defaultSections={DEFAULT_SECTIONS} />
      </div>
    </InfoPageLayout>
  );
}

export default VanChuyen;
