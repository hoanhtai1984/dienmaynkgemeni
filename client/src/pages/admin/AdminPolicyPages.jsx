import { useEffect, useState } from 'react';
import { getSettings, updatePolicyPage } from '../../api/settings';
import { POLICY_PAGES } from '../../constants/policyPages';
import { refreshSiteSettings } from '../../hooks/useSiteSettings';

function emptySection() {
  return { heading: '', body: '' };
}

function AdminPolicyPages() {
  const [slug, setSlug] = useState(POLICY_PAGES[0].slug);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [settingsData, setSettingsData] = useState(null);

  useEffect(() => {
    getSettings().then((s) => {
      setSettingsData(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!settingsData) return;
    const page = POLICY_PAGES.find((p) => p.slug === slug);
    const saved = settingsData.policyPages?.[slug]?.sections;
    setSections(saved?.length ? saved : page.defaultSections.map((s) => ({ ...s })));
    setError('');
    setSuccess(false);
  }, [slug, settingsData]);

  function updateRow(index, field, value) {
    setSections((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setSections((prev) => [...prev, emptySection()]);
  }

  function removeRow(index) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      const cleaned = sections.filter((s) => s.heading.trim() || s.body.trim());
      const updated = await updatePolicyPage(slug, cleaned);
      setSettingsData(updated);
      await refreshSiteSettings();
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
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
        <h3 className="fw-bold m-0">Nội dung chính sách</h3>
      </div>

      <div className="bg-white p-4 rounded-3 border mb-4">
        <p className="text-muted small mb-3">
          Chỉnh nội dung các mục đánh số trên từng trang chính sách/hỗ trợ (đoạn giới thiệu đầu trang và dòng liên
          hệ cuối trang vẫn cố định, không sửa được ở đây). Mỗi mục gồm tiêu đề + nội dung:
        </p>
        <ul className="text-muted small mb-0">
          <li>Xuống dòng 2 lần để tách đoạn văn mới.</li>
          <li>Mỗi dòng bắt đầu bằng "- " sẽ hiện thành gạch đầu dòng (cả đoạn phải toàn dòng "- " mới thành danh sách).</li>
          <li>Bọc <strong>**chữ**</strong> để in đậm.</li>
          <li>Dùng <code>{'{hotline}'}</code>, <code>{'{email}'}</code>, <code>{'{address}'}</code>, <code>{'{workingHours}'}</code> để tự động chèn đúng thông tin đang cấu hình ở "Cài đặt chung", không cần gõ tay.</li>
        </ul>
      </div>

      <div className="bg-white p-4 rounded-3 border mb-4">
        <label className="form-label small fw-bold">Chọn trang</label>
        <select className="form-select" value={slug} onChange={(e) => setSlug(e.target.value)} style={{ maxWidth: 420 }}>
          {POLICY_PAGES.map((p) => (
            <option key={p.slug} value={p.slug}>{p.title}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && (
          <div className="alert alert-success">
            <i className="bi bi-check-circle-fill"></i> Đã lưu nội dung trang.
          </div>
        )}

        <div className="bg-white p-4 rounded-3 border mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold m-0">Các mục nội dung</h6>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addRow}>
              <i className="bi bi-plus"></i> Thêm mục
            </button>
          </div>
          {sections.map((row, i) => (
            <div className="row g-2 mb-3 align-items-start" key={i}>
              <div className="col-3">
                <input
                  className="form-control form-control-sm"
                  placeholder="Tiêu đề mục (vd: 1. Thời hạn đổi trả)"
                  value={row.heading}
                  onChange={(e) => updateRow(i, 'heading', e.target.value)}
                />
              </div>
              <div className="col-8">
                <textarea
                  className="form-control form-control-sm"
                  rows={4}
                  placeholder="Nội dung"
                  value={row.body}
                  onChange={(e) => updateRow(i, 'body', e.target.value)}
                />
              </div>
              <div className="col-1">
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeRow(i)}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            </div>
          ))}
          {sections.length === 0 && (
            <p className="text-muted small mb-0">Chưa có mục nào - bấm "Thêm mục" để bắt đầu.</p>
          )}
        </div>

        <button type="submit" className="btn btn-warning fw-bold rounded-pill px-4 py-2" disabled={submitting}>
          {submitting ? 'Đang lưu...' : 'Lưu nội dung trang này'}
        </button>
      </form>
    </div>
  );
}

export default AdminPolicyPages;
