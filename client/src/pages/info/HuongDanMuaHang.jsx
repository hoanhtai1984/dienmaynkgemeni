import { Link } from 'react-router-dom';
import InfoPageLayout from '../../components/InfoPageLayout';
import { useSiteSettings } from '../../hooks/useSiteSettings';

function HuongDanMuaHang() {
  const { settings } = useSiteSettings();

  return (
    <InfoPageLayout title="Hướng Dẫn Mua Hàng">
      <div className="bg-white p-4 p-md-5 rounded-4 border">
        <p className="text-muted mb-4">
          Mua sắm tại Điện Máy NK rất đơn giản, chỉ với {settings.buyingGuideSteps.length} bước sau đây:
        </p>

        <div className="d-flex flex-column gap-4">
          {settings.buyingGuideSteps.map((step, i) => (
            <div className="guide-step" key={i}>
              <div className="guide-step-number">{i + 1}</div>
              <div>
                <h5 className="fw-bold mb-1">{step.title}</h5>
                <p className="text-muted mb-0">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <hr className="my-4" />

        <h5 className="fw-bold mb-3">Cần hỗ trợ trong quá trình mua hàng?</h5>
        <p className="text-muted">
          Nếu gặp khó khăn khi đặt hàng hoặc cần tư vấn thêm về sản phẩm, vui lòng gọi hotline <strong>{settings.hotline}</strong>{' '}
          hoặc gửi yêu cầu qua trang <Link to="/lien-he">Liên hệ</Link>, đội ngũ tư vấn viên luôn sẵn sàng hỗ trợ bạn.
        </p>
      </div>
    </InfoPageLayout>
  );
}

export default HuongDanMuaHang;
