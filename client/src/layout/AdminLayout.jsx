import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { showToast } from '../utils/toast';

// Mục nào (đoạn đầu URL sau /admin/) vai trò nào được vào - Nhân viên được
// Sản phẩm/Đơn hàng/Khách hàng/Tin nhắn/Báo cáo/Tin tức; chỉ Cài đặt và
// Thành viên là dành riêng cho Quản lý trở lên/Chủ tài khoản. Chặn cả điều
// hướng URL trực tiếp, không chỉ ẩn link trên menu.
const SECTION_ROLES = {
  products: ['OWNER', 'MANAGER', 'STAFF'],
  orders: ['OWNER', 'MANAGER', 'STAFF'],
  coupons: ['OWNER', 'MANAGER', 'STAFF'],
  reviews: ['OWNER', 'MANAGER', 'STAFF'],
  customers: ['OWNER', 'MANAGER', 'STAFF'],
  messages: ['OWNER', 'MANAGER', 'STAFF'],
  reports: ['OWNER', 'MANAGER', 'STAFF'],
  posts: ['OWNER', 'MANAGER', 'STAFF'],
  settings: ['OWNER', 'MANAGER'],
  'settings-content': ['OWNER', 'MANAGER'],
  'policy-pages': ['OWNER', 'MANAGER'],
  members: ['OWNER'],
};

const EMPTY_PASSWORD_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

function ChangePasswordModal({ onClose }) {
  const { changePassword } = useAdminAuth();
  const [form, setForm] = useState(EMPTY_PASSWORD_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu mới nhập lại không khớp');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      showToast('Đã đổi mật khẩu thành công');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title fw-bold">Đổi mật khẩu</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <div className="mb-3">
                <label className="form-label small fw-bold">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.currentPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Mật khẩu mới *</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.newPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
                <p className="text-muted small mb-0 mt-1">
                  Ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                </p>
              </div>
              <div className="mb-2">
                <label className="form-label small fw-bold">Nhập lại mật khẩu mới *</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-warning fw-bold" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdminLayout() {
  const { isAuthenticated, loading, admin, logout } = useAdminAuth();
  const location = useLocation();
  const [showChangePassword, setShowChangePassword] = useState(false);
  // Sidebar dạng trượt ra ở màn hình < lg (điện thoại/tablet đứng) - luôn
  // đóng lại mỗi khi chuyển trang, tránh phải tự bấm đóng sau khi chọn menu.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-warning" role="status"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  const section = location.pathname.split('/')[2];
  const allowedRoles = SECTION_ROLES[section];
  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    return <Navigate to="/admin/products" replace />;
  }

  return (
    <div className="d-flex min-vh-100">
      {/* Thanh trên cùng chỉ hiện ở màn hình < lg - sidebar chính ẩn mặc định
          ở đó, bấm nút hamburger để mở dạng trượt ra thay vì chiếm 240px cố
          định trên màn hình điện thoại. */}
      <div
        className="d-lg-none position-fixed top-0 start-0 end-0 bg-dark text-white d-flex align-items-center px-3"
        style={{ height: 56, zIndex: 1040 }}
      >
        <button className="btn btn-outline-light btn-sm me-3" onClick={() => setSidebarOpen(true)} aria-label="Mở menu">
          <i className="bi bi-list fs-5"></i>
        </button>
        <span className="fw-bold"><i className="bi bi-speedometer2 text-warning"></i> Điện Máy NK</span>
      </div>

      {sidebarOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 end-0 bottom-0"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <aside className={`admin-sidebar bg-dark text-white p-3 ${sidebarOpen ? 'open' : ''}`} style={{ width: 240, flexShrink: 0 }}>
        <div className="fw-bold fs-5 mb-4 px-2">
          <i className="bi bi-speedometer2 text-warning"></i> Điện Máy NK
        </div>
        <nav className="nav flex-column gap-1">
          <NavLink to="/admin/products" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
            <i className="bi bi-box-seam"></i> Sản phẩm
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
            <i className="bi bi-receipt"></i> Đơn hàng
          </NavLink>
          <NavLink to="/admin/coupons" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
            <i className="bi bi-tag"></i> Mã giảm giá
          </NavLink>
          <NavLink to="/admin/reviews" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
            <i className="bi bi-star"></i> Đánh giá
          </NavLink>
          <NavLink to="/admin/customers" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
            <i className="bi bi-people"></i> Khách hàng
          </NavLink>
          <NavLink to="/admin/messages" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
            <i className="bi bi-chat-dots"></i> Tin nhắn
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
            <i className="bi bi-graph-up"></i> Báo cáo
          </NavLink>
          <NavLink to="/admin/posts" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
            <i className="bi bi-newspaper"></i> Tin tức
          </NavLink>
          {admin.role !== 'STAFF' && (
            <>
              <NavLink to="/admin/settings" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
                <i className="bi bi-gear"></i> Cài đặt chung
              </NavLink>
              <NavLink to="/admin/settings-content" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
                <i className="bi bi-palette"></i> Giao diện &amp; Nội dung
              </NavLink>
              <NavLink to="/admin/policy-pages" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
                <i className="bi bi-file-earmark-text"></i> Nội dung chính sách
              </NavLink>
            </>
          )}
          {admin.role === 'OWNER' && (
            <NavLink to="/admin/members" className={({ isActive }) => `nav-link text-white ${isActive ? 'bg-warning text-dark rounded fw-bold' : ''}`}>
              <i className="bi bi-person-badge"></i> Thành viên
            </NavLink>
          )}
        </nav>
        <hr className="border-secondary" />
        <div className="px-2 small text-white-50 mb-2">Đăng nhập: {admin?.email}</div>
        <button className="btn btn-outline-light btn-sm w-100 mb-2" onClick={() => setShowChangePassword(true)}>
          <i className="bi bi-key"></i> Đổi mật khẩu
        </button>
        <button className="btn btn-outline-light btn-sm w-100" onClick={logout}>
          <i className="bi bi-box-arrow-right"></i> Đăng xuất
        </button>
      </aside>
      <div className="flex-grow-1 bg-light admin-content">
        <div className="p-4">
          <Outlet />
        </div>
      </div>
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}

export default AdminLayout;
