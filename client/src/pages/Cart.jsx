import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAddressData } from '../hooks/useAddressData';
import { formatMoney } from '../utils/format';
import { resolveImageUrl, onImgError } from '../utils/resolveImageUrl';
import { productUrl } from '../utils/productUrl';
import { createOrder, validateCoupon } from '../api/orders';

// Phí ship cố định theo cấu hình admin, MIỄN PHÍ nếu đơn đạt ngưỡng
// freeShippingThreshold - giống hệt logic computeShippingFee ở
// server/src/controllers/ordersController.js, chỉ dùng để HIỂN THỊ preview
// trước khi đặt hàng; server luôn tính lại từ đầu, không tin số liệu client gửi.
function computeShippingFee(settings, subtotal) {
  if (!settings) return 0;
  if (settings.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold) return 0;
  return settings.shippingFlatFee || 0;
}

function CartRow({ item, onUpdateQty, onRemove }) {
  function handleRemove() {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?')) {
      onRemove(item.id);
    }
  }

  return (
    <div className="row align-items-center py-3 border-bottom cart-item">
      <div className="col-md-6 col-12 mb-3 mb-md-0">
        <div className="d-flex align-items-center gap-3">
          <img
            src={resolveImageUrl(item.image)}
            alt={item.name}
            className="img-fluid border rounded"
            style={{ width: 80, height: 80, objectFit: 'contain' }}
            onError={onImgError}
          />
          <div>
            <h6 className="fw-bold mb-1">
              <Link to={productUrl(item)} className="text-dark text-decoration-none">{item.name}</Link>
            </h6>
            <span className="text-muted small">Thương hiệu: {item.brand}</span>
            <button className="btn btn-link btn-sm text-danger p-0 d-block mt-1 text-decoration-none" onClick={handleRemove}>
              <i className="bi bi-trash3"></i> Xóa khỏi giỏ
            </button>
          </div>
        </div>
      </div>
      <div className="col-md-2 col-4 text-start text-md-center">
        <span className="d-md-none text-muted small">Giá: </span>
        <span className="fw-bold">{formatMoney(item.price)}</span>
      </div>
      <div className="col-md-2 col-4 text-center">
        <div className="input-group input-group-sm justify-content-center">
          <button
            className="btn btn-outline-secondary px-2"
            type="button"
            onClick={() => item.qty > 1 && onUpdateQty(item.id, item.qty - 1)}
          >
            -
          </button>
          <input type="text" className="form-control text-center" value={item.qty} style={{ maxWidth: 40 }} readOnly />
          <button className="btn btn-outline-secondary px-2" type="button" onClick={() => onUpdateQty(item.id, item.qty + 1)}>
            +
          </button>
        </div>
      </div>
      <div className="col-md-2 col-4 text-end">
        <span className="d-md-none text-muted small">Tổng: </span>
        <span className="fw-bold text-danger">{formatMoney(item.price * item.qty)}</span>
      </div>
    </div>
  );
}

function Cart() {
  const { cart, totalCount, totalPrice, removeItem, updateQty, clearCart } = useCart();
  const { settings } = useSiteSettings();
  const { provinces, wards } = useAddressData();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    provinceCode: '',
    wardCode: '',
    addressDetail: '',
    note: '',
    payment: 'COD',
    invoiceRequested: false,
    companyName: '',
    companyTaxCode: '',
    companyAddress: '',
    companyEmail: '',
    invoiceTermsAgreed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const appliedSubtotalRef = useRef(null);

  const shippingFee = computeShippingFee(settings, totalPrice);
  const couponValid = appliedCoupon && appliedSubtotalRef.current === totalPrice;
  const discountAmount = couponValid ? appliedCoupon.discountAmount : 0;
  const finalTotal = totalPrice + shippingFee - discountAmount;

  const sortedProvinces = [...provinces].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const wardsInProvince = wards
    .filter((w) => w.provinceCode === form.provinceCode)
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  // Giỏ hàng đổi (thêm/bớt/sửa số lượng) sau khi đã áp mã thì số tiền giảm
  // giá cũ không còn đúng nữa (mốc đơn tối thiểu, % tính trên subtotal khác) -
  // buộc phải áp lại thay vì âm thầm dùng số cũ sai lệch với server.
  useEffect(() => {
    if (appliedCoupon && appliedSubtotalRef.current !== totalPrice) {
      setAppliedCoupon(null);
      setCouponError('Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã giảm giá.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPrice]);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const result = await validateCoupon(couponInput.trim(), totalPrice);
      appliedSubtotalRef.current = totalPrice;
      setAppliedCoupon(result);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.error || 'Mã giảm giá không hợp lệ');
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  }

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  // Đổi tỉnh/thành thì phường/xã đã chọn trước đó (thuộc tỉnh cũ) không còn
  // hợp lệ nữa - phải xóa để bắt chọn lại, tránh gửi lên cặp mã tỉnh/phường
  // không khớp nhau (server sẽ từ chối, xem ordersController.create).
  function handleProvinceChange(e) {
    setForm((prev) => ({ ...prev, provinceCode: e.target.value, wardCode: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    setError('');

    try {
      const order = await createOrder({
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        provinceCode: form.provinceCode,
        wardCode: form.wardCode,
        addressDetail: form.addressDetail.trim(),
        ...(form.note.trim() && { note: form.note.trim() }),
        paymentMethod: form.payment,
        items: cart.map((item) => ({ productId: item.id, quantity: item.qty })),
        ...(form.email.trim() && { customerEmail: form.email.trim() }),
        ...(couponValid && { couponCode: appliedCoupon.code }),
        ...(form.invoiceRequested && {
          invoiceRequested: true,
          companyName: form.companyName.trim(),
          companyTaxCode: form.companyTaxCode.trim(),
          companyAddress: form.companyAddress.trim(),
          companyEmail: form.companyEmail.trim(),
        }),
      });
      clearCart();
      navigate('/dat-hang-thanh-cong', { state: { order } });
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="py-5 bg-light">
      <div className="container">
        <h2 className="fw-bold mb-4">
          <i className="bi bi-cart-check-fill text-warning"></i> Giỏ Hàng ({totalCount} sản phẩm)
        </h2>

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="bg-white p-4 rounded-3 border shadow-sm mb-4">
              {cart.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-cart-x text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-3 mb-3">Giỏ hàng của bạn đang trống.</p>
                  <Link to="/" className="btn btn-warning fw-bold rounded-pill px-4">Tiếp tục mua sắm</Link>
                </div>
              ) : (
                <>
                  <div className="row border-bottom pb-2 mb-3 fw-bold text-muted d-none d-md-flex small">
                    <div className="col-md-6">Sản phẩm</div>
                    <div className="col-md-2 text-center">Giá tiền</div>
                    <div className="col-md-2 text-center">Số lượng</div>
                    <div className="col-md-2 text-end">Thành tiền</div>
                  </div>
                  <div>
                    {cart.map((item) => (
                      <CartRow key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeItem} />
                    ))}
                  </div>
                  <div className="mt-3">
                    <Link to="/danh-muc" className="btn btn-outline-dark btn-sm rounded-pill px-3">
                      <i className="bi bi-arrow-left"></i> Tiếp tục mua sắm
                    </Link>
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="bg-white p-4 rounded-3 border shadow-sm">
                <h5 className="fw-bold mb-3 pb-2 border-bottom">
                  <i className="bi bi-truck text-primary"></i> Thông tin giao hàng
                </h5>
                <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger py-2 small">{error}</div>}
                <div className="mb-3">
                  <label className="form-label small fw-bold">Họ và tên *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Nhập tên người nhận"
                    value={form.name}
                    onChange={handleChange('name')}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Số điện thoại *</label>
                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    placeholder="Nhập số điện thoại"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Email nhận thông tin đơn hàng</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    placeholder="(Không bắt buộc) Nhận email xác nhận và cập nhật trạng thái đơn hàng"
                    value={form.email}
                    onChange={handleChange('email')}
                  />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold">Tỉnh/Thành phố *</label>
                    <select
                      className="form-select form-select-sm"
                      value={form.provinceCode}
                      onChange={handleProvinceChange}
                      required
                    >
                      <option value="">-- Chọn --</option>
                      {sortedProvinces.map((p) => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold">Phường/Xã *</label>
                    <select
                      className="form-select form-select-sm"
                      value={form.wardCode}
                      onChange={handleChange('wardCode')}
                      disabled={!form.provinceCode}
                      required
                    >
                      <option value="">-- Chọn --</option>
                      {wardsInProvince.map((w) => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Địa chỉ chi tiết *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Số nhà, tên đường..."
                    value={form.addressDetail}
                    onChange={handleChange('addressDetail')}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Ghi chú đơn hàng</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    placeholder="(Không bắt buộc) Yêu cầu thêm về giao hàng, thời gian nhận hàng..."
                    value={form.note}
                    onChange={handleChange('note')}
                  />
                </div>
                <div className="mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="invoice-requested"
                      checked={form.invoiceRequested}
                      disabled={!settings.bankAccountNumber}
                      onChange={(e) => {
                        const invoiceRequested = e.target.checked;
                        // Xuất hóa đơn công ty bắt buộc chuyển khoản 100% - không áp
                        // dụng COD (xem cùng điều kiện ở server/src/controllers/ordersController.js).
                        setForm((prev) => ({ ...prev, invoiceRequested, payment: invoiceRequested ? 'BANK_TRANSFER' : prev.payment }));
                      }}
                    />
                    <label className="form-check-label small fw-bold" htmlFor="invoice-requested">
                      Yêu cầu xuất hóa đơn công ty (VAT)
                    </label>
                  </div>
                  {!settings.bankAccountNumber && (
                    <p className="small text-muted mb-0 mt-1">
                      Cửa hàng chưa hỗ trợ chuyển khoản - vui lòng gọi hotline nếu cần xuất hóa đơn công ty.
                    </p>
                  )}
                  {form.invoiceRequested && (
                    <div className="mt-3 ps-1">
                      <p className="small text-primary mb-2">
                        <i className="bi bi-info-circle-fill"></i> Đơn xuất hóa đơn công ty bắt buộc thanh toán chuyển khoản 100%, không áp dụng COD.
                      </p>
                      <div className="mb-2">
                        <label className="form-label small fw-bold">Tên công ty *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Công ty TNHH..."
                          value={form.companyName}
                          onChange={handleChange('companyName')}
                          required={form.invoiceRequested}
                        />
                      </div>
                      <div className="mb-2">
                        <label className="form-label small fw-bold">Mã số thuế *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Nhập mã số thuế công ty"
                          value={form.companyTaxCode}
                          onChange={handleChange('companyTaxCode')}
                          required={form.invoiceRequested}
                        />
                      </div>
                      <div className="mb-2">
                        <label className="form-label small fw-bold">Địa chỉ công ty *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Địa chỉ đăng ký kinh doanh"
                          value={form.companyAddress}
                          onChange={handleChange('companyAddress')}
                          required={form.invoiceRequested}
                        />
                      </div>
                      <div className="mb-2">
                        <label className="form-label small fw-bold">Email nhận hóa đơn</label>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          placeholder="(Không bắt buộc)"
                          value={form.companyEmail}
                          onChange={handleChange('companyEmail')}
                        />
                      </div>
                      <p className="small text-muted mb-2">
                        Hóa đơn GTGT được xuất trong vòng 3-5 ngày làm việc sau khi đơn hàng hoàn tất.
                        Thông tin công ty do quý khách cung cấp cần chính xác - Điện Máy NK không chịu
                        trách nhiệm nếu hóa đơn xuất sai do sai lệch thông tin được cung cấp.
                      </p>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="invoice-terms-agreed"
                          checked={form.invoiceTermsAgreed}
                          onChange={(e) => setForm((prev) => ({ ...prev, invoiceTermsAgreed: e.target.checked }))}
                          required={form.invoiceRequested}
                        />
                        <label className="form-check-label small" htmlFor="invoice-terms-agreed">
                          Tôi đồng ý với điều khoản xuất hóa đơn công ty nêu trên
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                  <button
                    type="submit"
                    className="btn btn-warning w-100 py-2 fw-bold text-dark rounded-pill fs-5"
                    disabled={cart.length === 0 || submitting || (form.invoiceRequested && !form.invoiceTermsAgreed)}
                  >
                    <i className="bi bi-bag-check-fill"></i> {submitting ? 'Đang xử lý...' : 'XÁC NHẬN ĐẶT HÀNG'}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="col-lg-5">
            <div style={{ position: 'sticky', top: '1rem' }}>
            <div className="bg-white p-4 rounded-3 border shadow-sm mb-4">
              <h5 className="fw-bold mb-3 pb-2 border-bottom">Tóm tắt đơn hàng</h5>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tạm tính:</span>
                <span className="fw-bold text-dark">{formatMoney(totalPrice)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Phí vận chuyển:</span>
                <span className={`fw-bold ${shippingFee === 0 ? 'text-success' : 'text-dark'}`}>
                  {shippingFee === 0 ? 'Miễn phí' : formatMoney(shippingFee)}
                </span>
              </div>

              <div className="mb-2">
                {!couponValid ? (
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="Mã giảm giá"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                    >
                      {couponLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-center bg-light rounded px-2 py-1">
                    <span className="small">
                      <i className="bi bi-tag-fill text-success"></i> Mã <strong>{appliedCoupon.code}</strong> đã áp dụng
                    </span>
                    <button type="button" className="btn btn-sm btn-link text-danger p-0 text-decoration-none" onClick={handleRemoveCoupon}>
                      Xóa
                    </button>
                  </div>
                )}
                {couponError && <div className="text-danger small mt-1">{couponError}</div>}
              </div>

              {discountAmount > 0 && (
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Giảm giá:</span>
                  <span className="fw-bold text-danger">-{formatMoney(discountAmount)}</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between align-items-center mb-0">
                <span className="fw-bold">Tổng tiền thanh toán:</span>
                <span className="fs-4 fw-bold text-danger">{formatMoney(finalTotal)}</span>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="bg-white p-4 rounded-3 border shadow-sm">
                <h5 className="fw-bold mb-3 pb-2 border-bottom">Phương thức thanh toán</h5>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="payment-method"
                    id="pay-cod"
                    checked={form.payment === 'COD'}
                    disabled={form.invoiceRequested}
                    onChange={() => setForm((prev) => ({ ...prev, payment: 'COD' }))}
                  />
                  <label className="form-check-label small" htmlFor="pay-cod">Thanh toán khi nhận hàng (COD)</label>
                </div>
                {settings.bankAccountNumber && (
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="payment-method"
                      id="pay-bank"
                      checked={form.payment === 'BANK_TRANSFER'}
                      onChange={() => setForm((prev) => ({ ...prev, payment: 'BANK_TRANSFER' }))}
                    />
                    <label className="form-check-label small" htmlFor="pay-bank">Chuyển khoản ngân hàng (Qua mã QR)</label>
                  </div>
                )}
                {form.payment === 'BANK_TRANSFER' && settings.bankAccountNumber && (
                  <div className="mt-3 p-3 bg-light rounded-3 border">
                    <div className="d-flex flex-column flex-sm-row gap-3 align-items-start">
                      {settings.bankQrImage && (
                        <a
                          href={resolveImageUrl(settings.bankQrImage)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-shrink-0 mx-auto mx-sm-0"
                          title="Bấm để xem mã QR cỡ lớn"
                        >
                          <img
                            src={resolveImageUrl(settings.bankQrImage)}
                            alt="Mã QR chuyển khoản"
                            style={{ width: 220, height: 220, objectFit: 'contain' }}
                            className="border rounded bg-white"
                          />
                          <div className="text-center text-primary small mt-1">
                            <i className="bi bi-zoom-in"></i> Bấm để phóng to
                          </div>
                        </a>
                      )}
                      <div className="small">
                        {settings.bankName && <div><strong>Ngân hàng:</strong> {settings.bankName}</div>}
                        <div><strong>Số tài khoản:</strong> {settings.bankAccountNumber}</div>
                        {settings.bankAccountHolder && <div><strong>Chủ tài khoản:</strong> {settings.bankAccountHolder}</div>}
                        <div className="text-muted mt-1">
                          Vui lòng chuyển đúng số tiền <strong>{formatMoney(finalTotal)}</strong> và ghi rõ họ tên/số điện thoại trong nội dung chuyển khoản.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Cart;
