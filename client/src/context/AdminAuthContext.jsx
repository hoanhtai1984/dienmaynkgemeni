import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, getMe, logout as apiLogout, changePassword as apiChangePassword } from '../api/admin';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Phiên đăng nhập giờ sống trong cookie HttpOnly (JS không đọc được) thay
  // vì localStorage - không còn cách nào để biết "đã đăng nhập chưa" từ phía
  // client ngoài việc luôn thử gọi /me mỗi lần tải trang; cookie có thì
  // server trả về thông tin admin, không có/hết hạn thì 401 và coi như chưa
  // đăng nhập.
  useEffect(() => {
    getMe()
      .then(setAdmin)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { admin: adminData } = await apiLogin(email, password);
    setAdmin(adminData);
  }

  // Đổi mật khẩu chính mình - server tự set lại cookie với token MỚI
  // (tokenVersion đã tăng) để phiên hiện tại tiếp tục dùng được ngay, không
  // bị đăng xuất giữa chừng.
  async function changePassword(currentPassword, newPassword) {
    await apiChangePassword(currentPassword, newPassword);
  }

  async function logout() {
    // Thu hồi token phía server (tăng tokenVersion + xoá cookie) trước -
    // best-effort, vẫn đăng xuất ở client dù request thất bại (mất mạng...)
    // để không bao giờ kẹt người dùng lại ở trạng thái đã đăng nhập.
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, changePassword, isAuthenticated: !!admin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
