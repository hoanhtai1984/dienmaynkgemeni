import { useEffect, useState } from 'react';
import {
  getSettings, updateSettings, uploadThemeImage, getMailSettings, updateMailSettings,
} from '../../api/settings';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { refreshSiteSettings } from '../../hooks/useSiteSettings';

const EMPTY_FORM = {
  logoImage: '',
  hotline: '',
  chatbotPhone: '',
  email: '',
  address: '',
  companyName: '',
  companyTaxCode: '',
  workingHours: '',
  facebookUrl: '',
  zaloUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
  instagramUrl: '',
  complianceBadgeImage: '',
  complianceBadgeUrl: '',
  bankName: '',
  bankAccountNumber: '',
  bankAccountHolder: '',
  bankQrImage: '',
  shippingFlatFee: '',
  freeShippingThreshold: '',
};

const EMPTY_MAIL_FORM = { smtpHost: '', smtpPort: '', smtpSecure: false, smtpUser: '', smtpPass: '', mailFrom: '' };

function AdminSettingsGeneral() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBadge, setUploadingBadge] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [mailForm, setMailForm] = useState(EMPTY_MAIL_FORM);
  const [mailPassSet, setMailPassSet] = useState(false);
  const [mailLoading, setMailLoading] = useState(true);

  useEffect(() => {
    getMailSettings().then((s) => {
      setMailForm({
        smtpHost: s.smtpHost || '',
        smtpPort: s.smtpPort || '',
        smtpSecure: s.smtpSecure || false,
        smtpUser: s.smtpUser || '',
        smtpPass: '',
        mailFrom: s.mailFrom || '',
      });
      setMailPassSet(s.smtpPassSet);
      setMailLoading(false);
    });
  }, []);

  useEffect(() => {
    getSettings().then((s) => {
      setForm({
        logoImage: s.logoImage || '',
        hotline: s.hotline || '',
        chatbotPhone: s.chatbotPhone || '',
        email: s.email || '',
        address: s.address || '',
        companyName: s.companyName || '',
        companyTaxCode: s.companyTaxCode || '',
        workingHours: s.workingHours || '',
        facebookUrl: s.facebookUrl || '',
        zaloUrl: s.zaloUrl || '',
        youtubeUrl: s.youtubeUrl || '',
        tiktokUrl: s.tiktokUrl || '',
        instagramUrl: s.instagramUrl || '',
        complianceBadgeImage: s.complianceBadgeImage || '',
        complianceBadgeUrl: s.complianceBadgeUrl || '',
        bankName: s.bankName || '',
        bankAccountNumber: s.bankAccountNumber || '',
        bankAccountHolder: s.bankAccountHolder || '',
        bankQrImage: s.bankQrImage || '',
        shippingFlatFee: s.shippingFlatFee ?? 0,
        freeShippingThreshold: s.freeShippingThreshold ?? '',
      });
      setLoading(false);
    });
  }, []);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleLogoUpload(file) {
    setUploadingLogo(true);
    try {
      const { url } = await uploadThemeImage(file);
      setForm((prev) => ({ ...prev, logoImage: url }));
    } catch {
      setError('Tải logo lên thất bại, vui lòng thử lại.');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleBadgeImageUpload(file) {
    setUploadingBadge(true);
    try {
      const { url } = await uploadThemeImage(file);
      setForm((prev) => ({ ...prev, complianceBadgeImage: url }));
    } catch {
      setError('Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setUploadingBadge(false);
    }
  }

  async function handleBankQrUpload(file) {
    setUploadingQr(true);
    try {
      const { url } = await uploadThemeImage(file);
      setForm((prev) => ({ ...prev, bankQrImage: url }));
    } catch {
      setError('Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setUploadingQr(false);
    }
  }

  function handleMailChange(field) {
    return (e) => {
      const value = field === 'smtpSecure' ? e.target.checked : e.target.value;
      setMailForm((prev) => ({ ...prev, [field]: value }));
    };
  }

  // Trang này gộp 2 khu vực (thông tin chung, SMTP) - mỗi khu vực lưu vào 1
  // bảng/route khác nhau ở backend, nhưng CHỈ có đúng 1 nút "Lưu cài đặt" cho
  // toàn trang để tránh admin sửa 1 khu vực rồi bấm nhầm nút của khu vực
  // khác, tưởng đã lưu nhưng thực ra thay đổi bị bỏ sót. Dùng allSettled để
  // 1 khu vực lỗi (vd thiếu field bắt buộc) không chặn khu vực còn lại lưu
  // thành công.
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    const [settingsResult, mailResult] = await Promise.allSettled([
      updateSettings({
        ...form,
        facebookUrl: form.facebookUrl || null,
        zaloUrl: form.zaloUrl || null,
        youtubeUrl: form.youtubeUrl || null,
        tiktokUrl: form.tiktokUrl || null,
        instagramUrl: form.instagramUrl || null,
      }),
      updateMailSettings(mailForm),
    ]);

    if (mailResult.status === 'fulfilled') {
      // Không giữ lại mật khẩu vừa gõ trong state - GET sau này cũng sẽ
      // không bao giờ trả về giá trị thật, ô này luôn trống khi mở lại form.
      setMailForm((prev) => ({ ...prev, smtpPass: '' }));
      setMailPassSet(mailResult.value.smtpPassSet);
    }

    const failures = [settingsResult, mailResult].filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      setError(failures.map((f) => f.reason?.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.').join(' | '));
    } else {
      await refreshSiteSettings();
      setSuccess(true);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">Cài đặt chung</h3>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && (
          <div className="alert alert-success">
            <i className="bi bi-check-circle-fill"></i> Đã lưu cài đặt. Thay đổi sẽ áp dụng ngay trên toàn trang.
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Logo</h6>
              <p className="text-muted small mb-3">
                Hiển thị ở góc trái đầu trang. Chưa upload thì dùng logo mặc định có sẵn.
                <strong> Khuyến nghị ảnh khổ ngang, tỉ lệ khoảng 4:1</strong> (vd 760×190px), nền
                trong suốt (PNG) hoặc đúng màu vàng header (#FFC107) để không bị lệch tông.
              </p>
              <div className="row g-3 align-items-end">
                <div className="col-auto">
                  <label className="form-label small fw-bold">Ảnh logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control form-control-sm"
                    disabled={uploadingLogo}
                    onChange={(e) => e.target.files[0] && handleLogoUpload(e.target.files[0])}
                  />
                </div>
                {uploadingLogo && (
                  <div className="col-auto">
                    <span className="spinner-border spinner-border-sm text-warning"></span>
                  </div>
                )}
                {form.logoImage && (
                  <>
                    <div className="col-auto p-2 bg-light border rounded">
                      <img
                        src={resolveImageUrl(form.logoImage)}
                        alt=""
                        style={{ height: 50, objectFit: 'contain' }}
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setForm((prev) => ({ ...prev, logoImage: '' }))}
                      >
                        Xoá, dùng logo mặc định
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Thông tin liên hệ</h6>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Hotline *</label>
                  <input className="form-control" value={form.hotline} onChange={handleChange('hotline')} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Email *</label>
                  <input type="email" className="form-control" value={form.email} onChange={handleChange('email')} required />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Số điện thoại chatbot (tùy chọn)</label>
                <input
                  className="form-control"
                  value={form.chatbotPhone}
                  onChange={handleChange('chatbotPhone')}
                  placeholder="Để trống thì chatbot dùng chung số Hotline ở trên"
                />
                <p className="text-muted small mb-0 mt-1">
                  Số điện thoại chatbot đọc ra khi tư vấn khách - để trống nếu muốn dùng chung với Hotline,
                  hoặc điền riêng nếu muốn chatbot báo số khác (vd đường dây tư vấn nhanh riêng).
                </p>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Địa chỉ *</label>
                <input className="form-control" value={form.address} onChange={handleChange('address')} required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Giờ làm việc *</label>
                <input className="form-control" value={form.workingHours} onChange={handleChange('workingHours')} required />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Thông tin công ty</h6>
              <div className="mb-3">
                <label className="form-label small fw-bold">Tên công ty *</label>
                <input className="form-control" value={form.companyName} onChange={handleChange('companyName')} required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Mã số doanh nghiệp *</label>
                <input className="form-control" value={form.companyTaxCode} onChange={handleChange('companyTaxCode')} required />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Cấu hình gửi email (SMTP)</h6>
              <p className="text-muted small mb-3">
                Dùng để gửi email chào mừng và email đặt lại mật khẩu cho khách hàng. Điền thông
                tin SMTP từ nơi bạn quản lý email cho tên miền dienmaynk.vn (Google Workspace,
                Zoho Mail, hoặc dịch vụ gửi email như Brevo/Amazon SES...). Lưu ở đây là áp dụng
                ngay, không cần deploy lại. Chưa điền thì hệ thống chỉ ghi log ở server, chưa gửi
                được email thật.
              </p>
              {mailLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
                </div>
              ) : (
                <div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">SMTP Host</label>
                      <input className="form-control" value={mailForm.smtpHost} onChange={handleMailChange('smtpHost')} placeholder="smtp.zoho.com" />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold">Cổng (Port)</label>
                      <input type="number" className="form-control" value={mailForm.smtpPort} onChange={handleMailChange('smtpPort')} placeholder="587" />
                    </div>
                    <div className="col-md-3 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="smtpSecure"
                          checked={mailForm.smtpSecure}
                          onChange={handleMailChange('smtpSecure')}
                        />
                        <label className="form-check-label small" htmlFor="smtpSecure">Dùng SSL (cổng 465)</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Tên đăng nhập SMTP</label>
                      <input className="form-control" value={mailForm.smtpUser} onChange={handleMailChange('smtpUser')} placeholder="noreply@dienmaynk.vn" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Mật khẩu SMTP</label>
                      <input
                        type="password"
                        className="form-control"
                        value={mailForm.smtpPass}
                        onChange={handleMailChange('smtpPass')}
                        placeholder={mailPassSet ? 'Đã lưu - để trống nếu giữ nguyên' : 'Chưa lưu mật khẩu nào'}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Tên người gửi hiển thị</label>
                      <input
                        className="form-control"
                        value={mailForm.mailFrom}
                        onChange={handleMailChange('mailFrom')}
                        placeholder="Điện Máy NK <no-reply@dienmaynk.vn>"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Icon "Đã thông báo Bộ Công Thương" (footer)</h6>
              <p className="text-muted small mb-3">
                Chưa upload ảnh thì footer tự hiện dòng "Chưa thông báo Bộ Công Thương" trung thực -
                không hiện icon xác nhận giả khi site chưa thật sự đăng ký. Khi có xác nhận thật từ
                cơ quan chức năng (vd online.gov.vn), upload đúng icon được cấp và dán link xác nhận vào đây.
                <strong> Khuyến nghị ảnh vuông, tối thiểu 200×200px</strong>, nền trong suốt (PNG) -
                đây là icon nhỏ nên không cần ảnh khổ lớn.
              </p>
              <div className="row g-3 align-items-end">
                <div className="col-auto">
                  <label className="form-label small fw-bold">Icon</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control form-control-sm"
                    disabled={uploadingBadge}
                    onChange={(e) => e.target.files[0] && handleBadgeImageUpload(e.target.files[0])}
                  />
                </div>
                {uploadingBadge && (
                  <div className="col-auto">
                    <span className="spinner-border spinner-border-sm text-warning"></span>
                  </div>
                )}
                {form.complianceBadgeImage && (
                  <>
                    <div className="col-auto">
                      <img
                        src={resolveImageUrl(form.complianceBadgeImage)}
                        alt=""
                        style={{ height: 40, objectFit: 'contain', borderRadius: 4 }}
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setForm((prev) => ({ ...prev, complianceBadgeImage: '' }))}
                      >
                        Xoá, dùng placeholder mặc định
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-3">
                <label className="form-label small fw-bold">Link xác nhận (tùy chọn)</label>
                <input
                  className="form-control"
                  value={form.complianceBadgeUrl}
                  onChange={handleChange('complianceBadgeUrl')}
                  placeholder="https://online.gov.vn/..."
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Thông tin chuyển khoản ngân hàng</h6>
              <p className="text-muted small mb-3">
                Hiển thị cho khách hàng ngay tại giỏ hàng và trang xác nhận đơn hàng khi chọn thanh toán
                "Chuyển khoản ngân hàng". Chưa điền đủ thông tin thì khách hàng sẽ chỉ thấy thông báo nhân
                viên sẽ liên hệ cung cấp thông tin sau, thay vì hiển thị số tài khoản/QR trống hoặc sai.
                <strong> Khuyến nghị ảnh QR vuông, tối thiểu 400×400px</strong>, dùng đúng file QR ngân
                hàng cấp (chụp/xuất trực tiếp, không chụp lại qua màn hình để tránh mờ, khó quét).
              </p>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Tên ngân hàng</label>
                  <input
                    className="form-control"
                    value={form.bankName}
                    onChange={handleChange('bankName')}
                    placeholder="Vietcombank"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Số tài khoản</label>
                  <input
                    className="form-control"
                    value={form.bankAccountNumber}
                    onChange={handleChange('bankAccountNumber')}
                    placeholder="0123456789"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Tên chủ tài khoản</label>
                  <input
                    className="form-control"
                    value={form.bankAccountHolder}
                    onChange={handleChange('bankAccountHolder')}
                    placeholder="CONG TY TNHH ..."
                  />
                </div>
              </div>
              <div className="row g-3 align-items-end mt-1">
                <div className="col-auto">
                  <label className="form-label small fw-bold">Mã QR chuyển khoản</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control form-control-sm"
                    disabled={uploadingQr}
                    onChange={(e) => e.target.files[0] && handleBankQrUpload(e.target.files[0])}
                  />
                </div>
                {uploadingQr && (
                  <div className="col-auto">
                    <span className="spinner-border spinner-border-sm text-warning"></span>
                  </div>
                )}
                {form.bankQrImage && (
                  <>
                    <div className="col-auto">
                      <img
                        src={resolveImageUrl(form.bankQrImage)}
                        alt=""
                        style={{ height: 100, objectFit: 'contain', borderRadius: 4 }}
                        className="border"
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setForm((prev) => ({ ...prev, bankQrImage: '' }))}
                      >
                        Xoá mã QR
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Phí vận chuyển</h6>
              <p className="text-muted small mb-3">
                Áp dụng cho mọi đơn hàng, tính trên tổng giá trị sản phẩm (trước giảm giá). Để ngưỡng miễn phí
                trống nếu không muốn miễn phí ship theo giá trị đơn.
              </p>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Phí vận chuyển cố định (đ)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={form.shippingFlatFee}
                    onChange={handleChange('shippingFlatFee')}
                    placeholder="0"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Miễn phí ship từ đơn (đ)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={form.freeShippingThreshold}
                    onChange={handleChange('freeShippingThreshold')}
                    placeholder="Để trống = không áp dụng"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Mạng xã hội</h6>
              <p className="text-muted small mb-3">Để trống nếu chưa có, icon tương ứng ở footer sẽ không dẫn tới đâu cả.</p>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Facebook</label>
                  <input className="form-control" value={form.facebookUrl} onChange={handleChange('facebookUrl')} placeholder="https://facebook.com/..." />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Zalo</label>
                  <input className="form-control" value={form.zaloUrl} onChange={handleChange('zaloUrl')} placeholder="https://zalo.me/..." />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Youtube</label>
                  <input className="form-control" value={form.youtubeUrl} onChange={handleChange('youtubeUrl')} placeholder="https://youtube.com/..." />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">TikTok</label>
                  <input className="form-control" value={form.tiktokUrl} onChange={handleChange('tiktokUrl')} placeholder="https://tiktok.com/@..." />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Instagram</label>
                  <input className="form-control" value={form.instagramUrl} onChange={handleChange('instagramUrl')} placeholder="https://instagram.com/..." />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-warning w-100 fw-bold rounded-pill py-2" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminSettingsGeneral;
