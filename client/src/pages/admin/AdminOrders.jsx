import { Fragment, useEffect, useState } from 'react';
import { listAdminOrders, updateAdminOrderStatus, updateAdminOrderPaymentStatus } from '../../api/admin';
import { API_BASE_URL } from '../../api/client';
import { formatMoney } from '../../utils/format';
import { formatDate } from '../../utils/formatDate';
import { exportToExcel } from '../../utils/exportExcel';
import DateRangeFilter from '../../components/DateRangeFilter';
import { resolveDateRange, isWithinRange } from '../../utils/dateRangePresets';
import Pagination from '../../components/Pagination';
import OrderTimeline from '../../components/OrderTimeline';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ xác nhận', badge: 'bg-secondary' },
  { value: 'CONFIRMED', label: 'Đã xác nhận', badge: 'bg-primary' },
  { value: 'SHIPPING', label: 'Đang giao', badge: 'bg-info text-dark' },
  { value: 'COMPLETED', label: 'Hoàn thành', badge: 'bg-success' },
  { value: 'CANCELLED', label: 'Đã hủy', badge: 'bg-danger' },
];

const PAYMENT_LABEL = { COD: 'COD', BANK_TRANSFER: 'Chuyển khoản' };
const PAYMENT_STATUS_OPTIONS = [
  { value: 'UNPAID', label: 'Chưa thanh toán', badge: 'bg-secondary' },
  { value: 'PAID', label: 'Đã thanh toán', badge: 'bg-success' },
];

function paymentStatusMeta(status) {
  return PAYMENT_STATUS_OPTIONS.find((s) => s.value === status) || PAYMENT_STATUS_OPTIONS[0];
}

function statusMeta(status) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

function productSummary(items) {
  if (!items || items.length === 0) return '';
  const [first, ...rest] = items;
  const firstLabel = `${first.name} x${first.quantity}`;
  return rest.length > 0 ? `${firstLabel} (+${rest.length} sp khác)` : firstLabel;
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  function reload() {
    setLoading(true);
    listAdminOrders(filter || undefined, { page, limit: PAGE_SIZE })
      .then((res) => {
        setOrders(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [filter, page]);
  useEffect(() => setPage(1), [filter]);

  async function handleStatusChange(order, status) {
    setUpdatingId(order.id);
    try {
      const updated = await updateAdminOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handlePaymentStatusChange(order, paymentStatus) {
    setUpdatingId(order.id);
    try {
      const updated = await updateAdminOrderPaymentStatus(order.id, paymentStatus);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDownload() {
    // Bảng đang phân trang (chỉ giữ 1 trang trong state) - xuất Excel phải
    // lấy lại TOÀN BỘ đơn khớp bộ lọc trạng thái hiện tại (không truyền
    // page/limit = server trả về hết, xem server/src/utils/pagination.js),
    // không phải chỉ dựa vào `orders` đang hiển thị trên trang.
    const { items: allOrders } = await listAdminOrders(filter || undefined);
    const range = resolveDateRange(datePreset, customFrom, customTo);
    const filtered = allOrders.filter((o) => {
      if (!isWithinRange(o.createdAt, range)) return false;
      if (filterPayment && o.paymentMethod !== filterPayment) return false;
      return true;
    });

    exportToExcel('don-hang', [
      {
        name: 'Đơn hàng',
        rows: filtered.map((o) => ({
          'Mã đơn': o.code,
          'Khách hàng': o.customerName,
          'Số điện thoại': o.phone,
          'Email': o.customerEmail || '',
          'Địa chỉ': o.address,
          'Ghi chú': o.note || '',
          'Thanh toán': PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod,
          'Đã thanh toán': paymentStatusMeta(o.paymentStatus).label,
          'Phí vận chuyển': o.shippingFee,
          'Giảm giá': o.discountAmount,
          'Mã giảm giá': o.couponCode || '',
          'Tổng tiền': o.total,
          'Trạng thái': statusMeta(o.status).label,
          'Ngày đặt': formatDate(o.createdAt),
          'Xuất hóa đơn': o.invoiceRequested ? 'Có' : 'Không',
          'Tên công ty': o.companyName || '',
          'MST': o.companyTaxCode || '',
        })),
      },
    ]);
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h3 className="fw-bold m-0">Quản lý đơn hàng</h3>
        <div className="d-flex gap-2 flex-wrap">
          <select className="form-select form-select-sm" style={{ width: 220 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button type="button" className="btn btn-sm btn-outline-success fw-bold" onClick={() => setShowExportPanel((v) => !v)}>
            <i className="bi bi-file-earmark-excel"></i> Xuất Excel
          </button>
        </div>
      </div>

      {showExportPanel && (
        <div className="bg-white p-4 rounded-3 border mb-4">
          <h6 className="fw-bold mb-3">Bộ lọc xuất Excel</h6>
          <div className="row g-2 align-items-end mb-3">
            <div className="col-auto">
              <DateRangeFilter
                label="Ngày đặt hàng"
                preset={datePreset}
                onPresetChange={setDatePreset}
                customFrom={customFrom}
                onCustomFromChange={setCustomFrom}
                customTo={customTo}
                onCustomToChange={setCustomTo}
              />
            </div>
            <div className="col-auto">
              <label className="form-label small fw-bold">Thanh toán</label>
              <select className="form-select form-select-sm" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="COD">COD</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </select>
            </div>
            <div className="col-auto">
              <button type="button" className="btn btn-warning fw-bold" onClick={handleDownload}>
                <i className="bi bi-download"></i> Tải về Excel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3 border">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-5 text-muted">Chưa có đơn hàng nào.</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle m-0">
              <thead className="table-light">
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Thanh toán</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Đã thanh toán</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <Fragment key={order.id}>
                    <tr>
                      <td className="fw-bold">{order.code}</td>
                      <td>
                        {order.customerName}
                        <div className="text-muted small">{order.phone}</div>
                        {order.customerEmail && <div className="text-muted small">{order.customerEmail}</div>}
                      </td>
                      <td
                        className="small text-truncate"
                        style={{ maxWidth: 220 }}
                        title={productSummary(order.items)}
                      >
                        {productSummary(order.items)}
                      </td>
                      <td>{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</td>
                      <td className="text-danger fw-bold">{formatMoney(order.total)}</td>
                      <td style={{ width: 200 }}>
                        <select
                          className={`form-select form-select-sm ${statusMeta(order.status).badge} text-white fw-bold border-0`}
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value} className="text-dark bg-white">{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ width: 170 }}>
                        <select
                          className={`form-select form-select-sm ${paymentStatusMeta(order.paymentStatus).badge} text-white fw-bold border-0`}
                          value={order.paymentStatus}
                          disabled={updatingId === order.id}
                          onChange={(e) => handlePaymentStatusChange(order, e.target.value)}
                        >
                          {PAYMENT_STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value} className="text-dark bg-white">{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
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
                        <td colSpan={8} className="bg-light">
                          <div className="p-2">
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                              <OrderTimeline history={order.statusHistory} statusLabels={STATUS_OPTIONS} />
                              <a
                                href={`${API_BASE_URL}/api/admin/orders/${order.id}/invoice`}
                                className="btn btn-sm btn-outline-dark text-nowrap"
                                target="_blank"
                                rel="noreferrer"
                              >
                                <i className="bi bi-file-earmark-pdf"></i> Tải hóa đơn PDF
                              </a>
                            </div>
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
                                <tr>
                                  <td colSpan={2} className="text-end text-muted">Phí vận chuyển</td>
                                  <td className="text-end">{formatMoney(order.shippingFee)}</td>
                                </tr>
                                {order.discountAmount > 0 && (
                                  <tr>
                                    <td colSpan={2} className="text-end text-muted">
                                      Giảm giá{order.couponCode ? ` (${order.couponCode})` : ''}
                                    </td>
                                    <td className="text-end text-danger">-{formatMoney(order.discountAmount)}</td>
                                  </tr>
                                )}
                                <tr className="fw-bold">
                                  <td colSpan={2} className="text-end">Tổng thanh toán</td>
                                  <td className="text-end">{formatMoney(order.total)}</td>
                                </tr>
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
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default AdminOrders;
