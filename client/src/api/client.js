import axios from 'axios';

// Không có VITE_API_URL (dev local) thì tự lấy theo host đang mở trang web -
// vào bằng localhost thì gọi API ở localhost, vào bằng IP LAN (vd từ điện
// thoại thật cùng mạng) thì tự gọi đúng IP đó, không cần sửa .env mỗi khi
// đổi mạng/IP.
export const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000`;

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  // Đăng nhập admin/khách hàng giờ dùng cookie HttpOnly thay vì token lưu
  // localStorage (localStorage đọc được bằng JS, nên bị lộ hoàn toàn nếu
  // site dính XSS ở đâu đó) - withCredentials để trình duyệt tự gửi kèm
  // cookie dù client/server khác port/domain.
  withCredentials: true,
});

export default apiClient;
