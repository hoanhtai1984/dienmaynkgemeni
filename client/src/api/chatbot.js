import axios from 'axios';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || `http://${window.location.hostname}:8000`;

// token (nếu khách đã đăng nhập) truyền vào từ ChatWidget.jsx, lấy từ
// useCustomerAuth() - không tự đọc localStorage nữa (token giờ chỉ giữ tạm
// trong bộ nhớ React, xem CustomerAuthContext.jsx).
export async function sendChatMessage(message, contextProductIds = [], token = null) {
  const { data } = await axios.post(
    `${AI_SERVICE_URL}/chatbot`,
    { message, context_product_ids: contextProductIds },
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
  return data;
}
