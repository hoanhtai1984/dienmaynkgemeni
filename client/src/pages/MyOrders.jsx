import { Fragment, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getMyOrders, cancelMyOrder } from '../api/customerAuth';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { formatMoney } from '../utils/format';
import { formatDate } from '../utils/formatDate';
import { showToast } from '../utils/toast';
import OrderTimeline from '../components/OrderTimeline';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ xác nhận', badge: 'bg-secondary' },
  { value: 'CONFIRMED', label: 'Đã xác nhận', badge: 'bg-primary' },
  { value: 'SHIPPING', label: 'Đang giao', badge: 'bg-info text-dark' },
  { value: 'COMPLETED', label: 'Hoàn thành', badge: 'bg-success' },
  { value: 'CANCELLED', label: 'Đã hủy', badge: 'bg-danger' },
];

const PAYMENT_LABEL = { COD: 'COD', BANK_TRANSFER: 'Chuyển khoản' };

function statusMeta(status) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

// Đơn xuất hóa đơn công ty đã chuyển khoản (tiền đã thực sự vào tài khoản)
// không cho tự hủy - xem cùng điều kiện ở server/src/controllers/customerOrdersController.js.
function canCancel(order) {
  if (order.status === 'CANCELLED') return false;
  if (order.invoiceRequested && order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'PAID') return false;
  return true;
}

function MyOrders() {
  const { customer, loading: authLoading } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!customer) return;
    getMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [customer]);

  useEffect(() => {
    if (!authLoading && !customer) {
      showToast('Vui lòng đăng nhập để xem đơn hàng của bạn');
    }
  }, [authLoading, customer]);

  async function handleCancel(order) {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${order.code}?`)) return;
    setCancellingId(order.id);
    try {
      const updated = await cancelMyOrder(order.id);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      showToast('Đã hủy đơn hàng');
    } catch (err) {
      showToast(err.response?.data?.error || 'Hủy đơn hàng thất bại, vui lòng thử lại.');
    } finally {
      setCancellingId(null);
    }
  }

  if (authLoading) {
    return (
      <main className="py-5 bg-light">
        <div className="container text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
        </div>
      </main>
    );
  }

  if (!customer) {
    showToast('Vui lòng đăng nhập để xem đơn hàng của bạn');
    return <Navigate to="/" replace />;
  }

  return (
    <main className="py-5 bg-light">
      <div className="container">
        <h2 className="fw-bold mb-4">
          <i className="bi bi-bag-check-fill text-warning"></i> Đơn hàng của tôi
        </h2>

        <div className="bg-white rounded-3 border">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bag-x text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3 mb-3">Bạn chưa có đơn hàng nào.</p>
              <Link to="/" className="btn btn-warning fw-bold rounded-pill px-4">Tiếp tục mua sắm</Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle m-0">
                <thead className="table-light">
                  <tr>
                    <th>Mã đơn</th>
                    <th>Ngày đặt</th>
                    <th>Thanh toán</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <Fragment key={order.id}>
                      <tr>
                        <td className="fw-bold">{order.code}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</td>
                        <td className="text-danger fw-bold">{formatMoney(order.total)}</td>
                        <td>
                          <span className={`badge ${statusMeta(order.status).badge}`}>{statusMeta(order.status).label}</span>
                        </td>
                        <td className="text-end">
                          {canCancel(order) && (
                            <button
                              className="btn btn-sm btn-outline-danger me-2"
                              disabled={cancellingId === order.id}
                              onClick={() => handleCancel(order)}
                            >
                              {cancellingId === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                          >
                            <i className={`bi bi-chevron-${expandedId === order.id ? 'up' : 'down'}`}></i>
                          </button>
                        </td>
                      </tr>
                      {expandedId === order.id && (
                        <tr>
                          <td colSpan={6} className="bg-light">
                            <div className="p-2">
                              <OrderTimeline history={order.statusHistory} statusLabels={STATUS_OPTIONS} />
                              <div className="small text-muted mb-2">Người nhận: {order.customerName} - {order.phone}</div>
                              <div className="small text-muted mb-2">Địa chỉ: {order.address}</div>
                              {order.note && <div className="small text-muted mb-2">Ghi chú: {order.note}</div>}
                              {order.invoiceRequested && (
                                <div className="small mb-2 p-2 bg-white border rounded">
                                  <div className="fw-bold text-primary mb-1">
                                    <i className="bi bi-receipt"></i> Yêu cầu xuất hóa đơn công ty
                                  </div>
                                  <div>Tên công ty: {order.companyName}</div>
                                  <div>MST: {order.companyTaxCode}</div>
                                  {order.companyAddress && <div>Địa chỉ: {order.companyAddress}</div>}
                                  {order.companyEmail && <div>Email: {order.companyEmail}</div>}
                                </div>
                              )}
                              <table className="table table-sm m-0">
                                <tbody>
                                  {order.items.map((item) => (
                                    <tr key={item.id}>
                                      <td>{item.name}</td>
                                      <td className="text-center" style={{ width: 80 }}>x{item.quantity}</td>
                                      <td className="text-end" style={{ width: 140 }}>{formatMoney(item.price * item.quantity)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default MyOrders;
