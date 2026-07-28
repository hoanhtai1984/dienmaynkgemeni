import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/customerAuth';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const linkInvalid = !email || !token;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email, token, password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Đặt lại mật khẩu thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="py-5 bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="bg-white p-4 p-md-5 rounded-3 border shadow-sm mx-auto" style={{ maxWidth: 420 }}>
          <h3 className="fw-bold text-center mb-4">
            <i className="bi bi-key-fill text-warning"></i> Đặt Lại Mật Khẩu
          </h3>

          {linkInvalid ? (
            <div className="alert alert-danger py-2 small mb-0">
              Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu lại từ trang đăng nhập.
            </div>
          ) : done ? (
            <div className="alert alert-success py-2 small mb-0">
              Đặt lại mật khẩu thành công. Bạn có thể <Link to="/">quay về trang chủ</Link> và đăng nhập ngay bây giờ.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              <div className="mb-3">
                <label className="form-label small fw-bold">Mật khẩu mới</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <PasswordStrengthMeter password={password} />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" className="btn btn-warning w-100 fw-bold rounded-pill py-2" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default ResetPassword;
