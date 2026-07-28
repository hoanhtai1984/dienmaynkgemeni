import { createContext, useContext, useEffect, useState } from 'react';
import * as customerAuthApi from '../api/customerAuth';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  // Chỉ giữ trong bộ nhớ React (KHÔNG lưu localStorage) - dùng riêng để
  // ChatWidget gửi kèm cho ai-service (dịch vụ Python tách biệt, khác
  // port/domain nên không tự có cookie HttpOnly của server chính). Mất khi
  // tải lại trang - /me trả kèm token mới mỗi lần gọi nên tự có lại ngay.
  const [token, setToken] = useState(null);

  // Phiên đăng nhập giờ sống trong cookie HttpOnly (JS không đọc được) thay
  // vì localStorage - luôn thử gọi /me mỗi lần tải trang để biết đã đăng
  // nhập hay chưa, thay vì kiểm tra sự tồn tại của token cục bộ như trước.
  useEffect(() => {
    customerAuthApi
      .getMe()
      .then(({ token: t, ...customerData }) => {
        setCustomer(customerData);
        setToken(t);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { token: t, customer: customerData } = await customerAuthApi.login(email, password);
    setToken(t);
    setCustomer(customerData);
  }

  async function register(payload) {
    const { token: t, customer: customerData } = await customerAuthApi.register(payload);
    setToken(t);
    setCustomer(customerData);
  }

  async function updateProfile(payload) {
    const updated = await customerAuthApi.updateMe(payload);
    setCustomer(updated);
    return updated;
  }

  // Xoá tài khoản luôn kèm đăng xuất ở client ngay (server đã tăng
  // tokenVersion nên token cũ đằng nào cũng hết hiệu lực) - không cần gọi
  // logout() riêng nữa.
  async function deleteAccount() {
    await customerAuthApi.deleteMe();
    setToken(null);
    setCustomer(null);
  }

  async function logout() {
    // Thu hồi token phía server (tăng tokenVersion + xoá cookie) trước -
    // best-effort, vẫn đăng xuất ở client dù request thất bại (mất mạng...)
    // để không bao giờ kẹt người dùng lại ở trạng thái đã đăng nhập.
    try {
      await customerAuthApi.logout();
    } catch {
      // ignore
    }
    setToken(null);
    setCustomer(null);
  }

  return (
    <CustomerAuthContext.Provider
      value={{
        customer, loading, token, login, register, logout,
        updateProfile, deleteAccount, isAuthenticated: !!customer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
