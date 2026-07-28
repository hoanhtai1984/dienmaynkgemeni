import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { showToast } from '../utils/toast';

// Mở khi bấm vào biểu tượng tài khoản đã đăng nhập ở Header (thay cho hành vi
// cũ là đăng xuất ngay khi bấm). Dùng chung class .auth-modal-backdrop/-card
// với AuthModal.jsx để trông đồng bộ, không phải 1 kiểu popup riêng biệt.
function CustomerProfileModal({ onClose }) {
  const { customer, updateProfile, deleteAccount, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: customer.name, phone: customer.phone || '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit() {
    setForm({ name: customer.name, phone: customer.phone || '' });
    setError('');
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await updateProfile({ name: form.name, phone: form.phone });
      showToast('Đã cập nhật thông tin tài khoản');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Cập nhật thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleViewOrders() {
    onClose();
    navigate('/don-hang-cua-toi');
  }

  function handleViewWishlist() {
    onClose();
    navigate('/san-pham-yeu-thich');
  }

  async function handleLogout() {
    await logout();
    onClose();
  }

  async function handleDelete() {
    if (!window.confirm('Hủy đăng ký sẽ đăng xuất bạn ngay và không thể hoàn tác. Bạn có chắc chắn?')) return;
    setDeleting(true);
    setError('');
    try {
      await deleteAccount();
      showToast('Đã hủy đăng ký tài khoản');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Hủy đăng ký thất bại, vui lòng thử lại.');
      setDeleting(false);
    }
  }

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Đóng">
          <i className="bi bi-x-lg"></i>
        </button>

        <h4 className="fw-bold mb-1">Tài khoản của tôi</h4>
        <p className="text-muted small mb-4">Xin chào, {customer.name}</p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        {editing ? (
          <form onSubmit={handleSave}>
            <div className="mb-3">
              <label className="form-label small fw-bold">Họ và tên</label>
              <input
                type="text"
                className="form-control"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold">Số điện thoại</label>
              <input
                type="tel"
                className="form-control"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold">Email</label>
              <input type="email" className="form-control" value={customer.email} disabled />
              <p className="text-muted small mb-0 mt-1">Email không thể thay đổi.</p>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary flex-fill fw-bold rounded-pill py-2"
                onClick={() => setEditing(false)}
                disabled={submitting}
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-warning flex-fill fw-bold rounded-pill py-2" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
            <button
              type="button"
              className="btn btn-outline-danger w-100 fw-bold rounded-pill py-2 mt-2"
              onClick={handleDelete}
              disabled={deleting}
            >
              <i className="bi bi-x-circle"></i> {deleting ? 'Đang hủy...' : 'Hủy đăng ký'}
            </button>
          </form>
        ) : (
          <>
            <div className="mb-2"><i className="bi bi-person-fill text-warning"></i> {customer.name}</div>
            <div className="mb-2"><i className="bi bi-telephone-fill text-warning"></i> {customer.phone || 'Chưa cập nhật'}</div>
            <div className="mb-4"><i className="bi bi-envelope-fill text-warning"></i> {customer.email}</div>
            <button type="button" className="btn btn-warning w-100 fw-bold rounded-pill py-2 mb-2" onClick={startEdit}>
              <i className="bi bi-pencil-square"></i> Chỉnh sửa
            </button>
            <button type="button" className="btn btn-outline-dark w-100 fw-bold rounded-pill py-2 mb-2" onClick={handleViewOrders}>
              <i className="bi bi-bag-check"></i> Đơn hàng của tôi
            </button>
            <button type="button" className="btn btn-outline-dark w-100 fw-bold rounded-pill py-2 mb-2" onClick={handleViewWishlist}>
              <i className="bi bi-heart"></i> Sản phẩm yêu thích
            </button>
            <button type="button" className="btn btn-outline-dark w-100 fw-bold rounded-pill py-2" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i> Đăng xuất
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default CustomerProfileModal;
