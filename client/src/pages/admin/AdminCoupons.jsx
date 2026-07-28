import { useEffect, useState } from 'react';
import { listAdminCoupons, createAdminCoupon, updateAdminCoupon, deleteAdminCoupon } from '../../api/admin';
import { formatMoney } from '../../utils/format';
import { showToast } from '../../utils/toast';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  code: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderTotal: '',
  maxUses: '',
  expiresAt: '',
};

function couponStatus(coupon) {
  if (!coupon.active) return { label: 'Đã tắt', badge: 'bg-secondary' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { label: 'Hết hạn', badge: 'bg-danger' };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { label: 'Hết lượt', badge: 'bg-danger' };
  return { label: 'Đang áp dụng', badge: 'bg-success' };
}

function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  function reload() {
    setLoading(true);
    listAdminCoupons({ page, limit: PAGE_SIZE })
      .then((res) => {
        setCoupons(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [page]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createAdminCoupon({
        code: form.code.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderTotal: form.minOrderTotal ? Number(form.minOrderTotal) : 0,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      showToast('Đã tạo mã giảm giá');
      reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(coupon) {
    setTogglingId(coupon.id);
    try {
      await updateAdminCoupon(coupon.id, { active: !coupon.active });
      reload();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(coupon) {
    if (!window.confirm(`Xóa mã giảm giá "${coupon.code}"? Hành động này không thể hoàn tác.`)) return;
    setDeletingId(coupon.id);
    try {
      await deleteAdminCoupon(coupon.id);
      reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">Mã giảm giá</h3>
        <button type="button" className="btn btn-warning fw-bold rounded-pill px-3" onClick={() => { setShowForm((v) => !v); setError(''); }}>
          <i className="bi bi-tag"></i> Thêm mã giảm giá
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-3 border mb-4">
          <h6 className="fw-bold mb-3">Thêm mã giảm giá mới</h6>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <label className="form-label small fw-bold">Mã *</label>
                <input
                  className="form-control text-uppercase"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="VD: SALE10"
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Loại giảm giá *</label>
                <select
                  className="form-select"
                  value={form.discountType}
                  onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value }))}
                >
                  <option value="PERCENT">Theo phần trăm (%)</option>
                  <option value="FIXED">Số tiền cố định (đ)</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">
                  Giá trị * {form.discountType === 'PERCENT' ? '(%)' : '(đ)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={form.discountType === 'PERCENT' ? 100 : undefined}
                  className="form-control"
                  value={form.discountValue}
                  onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Đơn tối thiểu (đ)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={form.minOrderTotal}
                  onChange={(e) => setForm((prev) => ({ ...prev, minOrderTotal: e.target.value }))}
                  placeholder="0 = không giới hạn"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Số lượt dùng tối đa</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={form.maxUses}
                  onChange={(e) => setForm((prev) => ({ ...prev, maxUses: e.target.value }))}
                  placeholder="Để trống = không giới hạn"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Ngày hết hạn</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.expiresAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-warning fw-bold" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo mã giảm giá'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3 border">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-5 text-muted">Chưa có mã giảm giá nào.</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle m-0">
              <thead className="table-light">
                <tr>
                  <th>Mã</th>
                  <th>Giảm giá</th>
                  <th>Đơn tối thiểu</th>
                  <th>Đã dùng</th>
                  <th>Hết hạn</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const status = couponStatus(c);
                  return (
                    <tr key={c.id}>
                      <td className="fw-bold">{c.code}</td>
                      <td>{c.discountType === 'PERCENT' ? `${c.discountValue}%` : formatMoney(c.discountValue)}</td>
                      <td>{c.minOrderTotal > 0 ? formatMoney(c.minOrderTotal) : '-'}</td>
                      <td>{c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ''}</td>
                      <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}</td>
                      <td><span className={`badge ${status.badge}`}>{status.label}</span></td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleToggleActive(c)}
                            disabled={togglingId === c.id}
                          >
                            {c.active ? 'Tắt' : 'Bật'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(c)}
                            disabled={deletingId === c.id}
                          >
                            <i className="bi bi-trash3"></i> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default AdminCoupons;
