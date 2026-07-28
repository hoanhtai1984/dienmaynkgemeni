import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../hooks/useSiteSettings';

function GioiThieu() {
  const { settings } = useSiteSettings();

  return (
    <main>
      <section className="info-banner">
        <div className="container">
          <nav aria-label="breadcrumb" className="breadcrumb">
            <ol className="breadcrumb m-0">
              <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Giới thiệu</li>
            </ol>
          </nav>
          <h1 className="m-0">Giới Thiệu Về Điện Máy NK</h1>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="bg-white p-4 p-md-5 rounded-4 border info-content">
                <h2>Điện Máy NK là ai?</h2>
                {settings.aboutText.split('\n').filter((line) => line.trim()).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}

                <h2>Sứ mệnh</h2>
                <p>
                  Mang sản phẩm điện máy chính hãng đến tận tay người tiêu dùng Việt Nam với mức giá tốt nhất, đi kèm
                  dịch vụ hậu mãi tận tâm - nhanh chóng - minh bạch.
                </p>

                <h2>Giá trị cốt lõi</h2>
                <ul>
                  <li><strong>Chính hãng 100%</strong> - Cam kết nguồn gốc rõ ràng, đầy đủ tem bảo hành điện tử.</li>
                  <li><strong>Giá tốt mỗi ngày</strong> - Thường xuyên có chương trình khuyến mãi, trả góp 0%.</li>
                  <li><strong>Giao hàng nhanh</strong> - Nội thành TP.HCM trong 2 giờ, toàn quốc trong 1-3 ngày.</li>
                  <li><strong>Hậu mãi tận tâm</strong> - Đổi trả trong 35 ngày đầu, hỗ trợ kỹ thuật tận nơi.</li>
                </ul>

                <h2>Hành trình phát triển</h2>
                <div className="about-timeline mt-4">
                  <div className="timeline-item">
                    <h6 className="fw-bold mb-1">Khởi đầu</h6>
                    <p className="mb-0">Thành lập cửa hàng đầu tiên, tập trung vào ngành hàng điện gia dụng và điện lạnh.</p>
                  </div>
                  <div className="timeline-item">
                    <h6 className="fw-bold mb-1">Mở rộng danh mục</h6>
                    <p className="mb-0">Bổ sung thêm ngành hàng máy lọc nước, máy pha cà phê, tivi - loa - âm thanh.</p>
                  </div>
                  <div className="timeline-item">
                    <h6 className="fw-bold mb-1">Chuyển đổi số</h6>
                    <p className="mb-0">Ra mắt website mua sắm trực tuyến, hỗ trợ đặt hàng và giao hàng toàn quốc.</p>
                  </div>
                  <div className="timeline-item">
                    <h6 className="fw-bold mb-1">Hiện tại</h6>
                    <p className="mb-0">Không ngừng mở rộng danh mục sản phẩm và nâng cao chất lượng dịch vụ khách hàng.</p>
                  </div>
                </div>

                <h2 className="mt-4">Thông tin pháp lý</h2>
                <p className="mb-1">Website được vận hành bởi <strong>{settings.companyName}</strong>.</p>
                <p className="mb-1">Mã số doanh nghiệp: <strong>{settings.companyTaxCode}</strong></p>
                <p className="mb-0">Địa chỉ trụ sở: <strong>{settings.address}</strong></p>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="bg-white p-4 rounded-4 border mb-4">
                <div className="row g-3 text-center">
                  <div className="col-6 stat-box">
                    <div className="stat-number">500+</div>
                    <div className="stat-label">Sản phẩm đa dạng</div>
                  </div>
                  <div className="col-6 stat-box">
                    <div className="stat-number">7</div>
                    <div className="stat-label">Ngành hàng chính</div>
                  </div>
                  <div className="col-6 stat-box">
                    <div className="stat-number">2h</div>
                    <div className="stat-label">Giao hàng nội thành</div>
                  </div>
                  <div className="col-6 stat-box">
                    <div className="stat-number">35</div>
                    <div className="stat-label">Ngày đổi trả</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-4 border">
                <h5 className="fw-bold mb-3">Cần hỗ trợ thêm?</h5>
                <p className="text-muted small">Đội ngũ tư vấn của Điện Máy NK luôn sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
                <Link to="/lien-he" className="btn btn-warning fw-bold w-100 text-dark">
                  <i className="bi bi-headset"></i> Liên Hệ Ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default GioiThieu;
