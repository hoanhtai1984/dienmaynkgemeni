import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendContact } from '../../api/contact';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const EMPTY_FORM = { name: '', phone: '', email: '', subject: 'tu-van', message: '' };

function LienHe() {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await sendContact({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        subject: form.subject,
        message: form.message.trim(),
      });
      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <section className="info-banner">
        <div className="container">
          <nav aria-label="breadcrumb" className="breadcrumb">
            <ol className="breadcrumb m-0">
              <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Liên hệ</li>
            </ol>
          </nav>
          <h1 className="m-0">Liên Hệ Với Chúng Tôi</h1>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="bg-white p-4 rounded-4 border h-100">
                <h5 className="fw-bold mb-4">Thông tin liên hệ</h5>

                <div className="contact-info-item mb-4">
                  <div className="contact-icon"><i className="bi bi-building-fill"></i></div>
                  <div>
                    <h6 className="fw-bold mb-1">Công ty</h6>
                    <p className="mb-0 text-muted">{settings.companyName}</p>
                    <small className="text-muted">MSDN: {settings.companyTaxCode}</small>
                  </div>
                </div>

                <div className="contact-info-item mb-4">
                  <div className="contact-icon"><i className="bi bi-geo-alt-fill"></i></div>
                  <div>
                    <h6 className="fw-bold mb-1">Địa chỉ</h6>
                    <p className="mb-0 text-muted">{settings.address}</p>
                  </div>
                </div>

                <div className="contact-info-item mb-4">
                  <div className="contact-icon"><i className="bi bi-telephone-fill"></i></div>
                  <div>
                    <h6 className="fw-bold mb-1">Hotline</h6>
                    <p className="mb-0 text-muted">{settings.hotline}</p>
                    <small className="text-muted">{settings.workingHours}</small>
                  </div>
                </div>

                <div className="contact-info-item mb-4">
                  <div className="contact-icon"><i className="bi bi-envelope-fill"></i></div>
                  <div>
                    <h6 className="fw-bold mb-1">Email</h6>
                    <p className="mb-0 text-muted">{settings.email}</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-icon"><i className="bi bi-clock-fill"></i></div>
                  <div>
                    <h6 className="fw-bold mb-1">Giờ làm việc</h6>
                    <p className="mb-0 text-muted">{settings.workingHours}</p>
                  </div>
                </div>

                <hr className="my-4" />

                <h6 className="fw-bold mb-3">Kết nối với chúng tôi</h6>
                <div className="footer-social">
                  <a href={settings.facebookUrl || '#'} target={settings.facebookUrl ? '_blank' : undefined} rel="noopener noreferrer"><i className="bi bi-facebook"></i></a>
                  <a href={settings.youtubeUrl || '#'} target={settings.youtubeUrl ? '_blank' : undefined} rel="noopener noreferrer"><i className="bi bi-youtube"></i></a>
                  <a href={settings.tiktokUrl || '#'} target={settings.tiktokUrl ? '_blank' : undefined} rel="noopener noreferrer"><i className="bi bi-tiktok"></i></a>
                  <a href={settings.instagramUrl || '#'} target={settings.instagramUrl ? '_blank' : undefined} rel="noopener noreferrer"><i className="bi bi-instagram"></i></a>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="bg-white p-4 p-md-5 rounded-4 border mb-4">
                <h5 className="fw-bold mb-4">Gửi yêu cầu cho chúng tôi</h5>
                <p className="text-muted small mb-4">Điền thông tin bên dưới, đội ngũ Điện Máy NK sẽ liên hệ lại với bạn trong thời gian sớm nhất.</p>

                <form onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger py-2 small">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Họ và tên <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" required placeholder="Nhập họ tên của bạn" value={form.name} onChange={handleChange('name')} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Số điện thoại <span className="text-danger">*</span></label>
                      <input type="tel" className="form-control" required placeholder="Nhập số điện thoại" value={form.phone} onChange={handleChange('phone')} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Email</label>
                      <input type="email" className="form-control" placeholder="Nhập email (không bắt buộc)" value={form.email} onChange={handleChange('email')} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Chủ đề</label>
                      <select className="form-select" value={form.subject} onChange={handleChange('subject')}>
                        <option value="tu-van">Tư vấn sản phẩm</option>
                        <option value="bao-hanh">Bảo hành / Sửa chữa</option>
                        <option value="don-hang">Hỏi về đơn hàng</option>
                        <option value="khac">Khác</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Nội dung <span className="text-danger">*</span></label>
                      <textarea className="form-control" rows={5} required placeholder="Nhập nội dung cần hỗ trợ" value={form.message} onChange={handleChange('message')} />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-warning fw-bold px-4 text-dark" disabled={submitting}>
                        <i className="bi bi-send-fill"></i> {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                      </button>
                    </div>
                  </div>
                </form>

                {success && (
                  <div className="alert alert-success mt-4" role="alert">
                    <i className="bi bi-check-circle-fill"></i> Cảm ơn bạn! Yêu cầu của bạn đã được ghi nhận, chúng tôi sẽ liên hệ lại sớm nhất.
                  </div>
                )}
              </div>

              <div className="bg-white p-2 rounded-4 border contact-map">
                <iframe
                  src="https://www.google.com/maps?q=Th%C3%A0nh%20ph%E1%BB%91%20H%E1%BB%93%20Ch%C3%AD%20Minh&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-4"
                  title="Bản đồ Điện Máy NK"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LienHe;
