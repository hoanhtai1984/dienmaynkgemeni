import InfoPageLayout from '../../components/InfoPageLayout';
import PolicyPageContent from '../../components/PolicyPageContent';

export const DEFAULT_SECTIONS = [
  {
    heading: '1. Thời hạn đổi trả',
    body: 'Điện Máy NK áp dụng chính sách "Lỗi là đổi mới" trong vòng 35 ngày kể từ ngày nhận hàng đối với lỗi phát sinh từ nhà sản xuất, giúp khách hàng an tâm hơn khi mua sắm.',
  },
  {
    heading: '2. Điều kiện đổi trả',
    body: '- Sản phẩm còn trong thời hạn 35 ngày kể từ ngày mua/nhận hàng.\n- Sản phẩm bị lỗi kỹ thuật do nhà sản xuất, không phải do người dùng gây ra.\n- Còn đầy đủ hộp, phụ kiện, quà tặng kèm theo (nếu có) và hóa đơn mua hàng.\n- Sản phẩm không thuộc danh mục hàng hóa đặc thù không áp dụng đổi trả (ví dụ: sản phẩm đã kích hoạt phần mềm, sản phẩm khuyến mãi có ghi chú riêng).',
  },
  {
    heading: '3. Các hình thức xử lý',
    body: '- Đổi mới: Đổi sang sản phẩm cùng loại nếu lỗi do nhà sản xuất và còn hàng trong kho.\n- Sửa chữa: Trong trường hợp không thể đổi mới ngay, sản phẩm sẽ được chuyển đến trung tâm bảo hành để sửa chữa miễn phí.\n- Hoàn tiền: Áp dụng trong một số trường hợp đặc biệt theo thỏa thuận giữa hai bên, thường đối với đơn hàng đặt trước hoặc lỗi giao sai sản phẩm.',
  },
  {
    heading: '4. Quy trình đổi trả',
    body: '- Bước 1: Liên hệ hotline **{hotline}** hoặc trang Liên hệ để thông báo tình trạng sản phẩm.\n- Bước 2: Nhân viên tư vấn kiểm tra thông tin đơn hàng và hướng dẫn mang sản phẩm đến cửa hàng hoặc hẹn lịch nhân viên đến kiểm tra tận nơi.\n- Bước 3: Xác nhận lỗi và tiến hành đổi trả/sửa chữa theo hình thức phù hợp.',
  },
  {
    heading: '5. Lưu ý',
    body: 'Chi phí vận chuyển sản phẩm đổi trả (nếu có) sẽ được thỏa thuận cụ thể tùy từng trường hợp. Điện Máy NK khuyến khích khách hàng kiểm tra kỹ sản phẩm ngay khi nhận hàng để việc đổi trả (nếu cần) được xử lý nhanh chóng nhất.',
  },
];

function ChinhSachDoiTra() {
  return (
    <InfoPageLayout title="Chính Sách Đổi Trả">
      <div className="bg-white p-4 p-md-5 rounded-4 border info-content">
        <PolicyPageContent slug="chinh-sach-doi-tra" defaultSections={DEFAULT_SECTIONS} />
      </div>
    </InfoPageLayout>
  );
}

export default ChinhSachDoiTra;
