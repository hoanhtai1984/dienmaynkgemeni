import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import {
  getAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProductImage,
} from '../../api/admin';
import { getBrands } from '../../api/categories';
import { resolveImageUrl, onImgError } from '../../utils/resolveImageUrl';

const BADGE_OPTIONS = ['', 'Bán chạy nhất', 'Sắp cháy hàng', 'Vừa mở bán', 'Mới'];

const EMPTY_FORM = {
  name: '',
  sku: '',
  brand: '',
  price: '',
  oldPrice: '',
  sold: '',
  stock: '',
  weight: '',
  badge: '',
  description: '',
  categoryId: '',
  subCategoryId: '',
  subSubCategoryId: '',
  promoEndsAt: '',
  promoSlots: '',
  promoSold: '',
};

function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { categories } = useCategories();

  const [form, setForm] = useState(EMPTY_FORM);
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [brandOptions, setBrandOptions] = useState([]);
  const [currentRating, setCurrentRating] = useState(null);

  useEffect(() => {
    getBrands().then(setBrandOptions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getAdminProduct(id).then((p) => {
      setForm({
        name: p.name,
        sku: p.sku || '',
        brand: p.brand,
        price: p.price,
        oldPrice: p.oldPrice,
        sold: p.sold,
        stock: p.stock,
        weight: p.weight || '',
        badge: p.badgeLabel || '',
        description: p.description,
        categoryId: p.categoryId,
        subCategoryId: p.subCategoryId || '',
        subSubCategoryId: p.subSubCategoryId || '',
        promoEndsAt: toDatetimeLocal(p.promoEndsAt),
        promoSlots: p.promoSlots || '',
        promoSold: p.promoSold || '',
      });
      setCurrentRating({ rating: p.rating, reviewCount: p.reviewCount });
      const specEntries = Object.entries(p.specs || {});
      setSpecs(specEntries.length ? specEntries.map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }]);
      setExistingImages(p.images);
      setLoading(false);
    });
  }, [id, isEdit]);

  const currentCategory = categories.find((c) => String(c.id) === String(form.categoryId));
  const currentSubCategory = currentCategory?.subCategories.find((s) => String(s.id) === String(form.subCategoryId));

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleCategoryChange(e) {
    setForm((prev) => ({ ...prev, categoryId: e.target.value, subCategoryId: '', subSubCategoryId: '' }));
  }

  function handleSubCategoryChange(e) {
    setForm((prev) => ({ ...prev, subCategoryId: e.target.value, subSubCategoryId: '' }));
  }

  function updateSpecRow(index, field, value) {
    setSpecs((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addSpecRow() {
    setSpecs((prev) => [...prev, { key: '', value: '' }]);
  }

  function removeSpecRow(index) {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleRemoveExistingImage(imageId) {
    if (!window.confirm('Xóa ảnh này?')) return;
    await deleteAdminProductImage(id, imageId);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const specsObj = Object.fromEntries(
        specs.filter((row) => row.key.trim()).map((row) => [row.key.trim(), row.value])
      );

      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('sku', form.sku);
      fd.append('brand', form.brand);
      fd.append('price', form.price);
      fd.append('oldPrice', form.oldPrice || form.price);
      fd.append('sold', form.sold || 0);
      fd.append('stock', form.stock || 0);
      if (form.weight) fd.append('weight', form.weight);
      fd.append('badge', form.badge);
      fd.append('description', form.description);
      fd.append('categoryId', form.categoryId);
      if (form.subCategoryId) fd.append('subCategoryId', form.subCategoryId);
      if (form.subSubCategoryId) fd.append('subSubCategoryId', form.subSubCategoryId);
      if (form.promoEndsAt) fd.append('promoEndsAt', new Date(form.promoEndsAt).toISOString());
      if (form.promoSlots) fd.append('promoSlots', form.promoSlots);
      if (form.promoSold) fd.append('promoSold', form.promoSold);
      fd.append('specs', JSON.stringify(specsObj));
      newFiles.forEach((file) => fd.append('images', file));

      if (isEdit) {
        await updateAdminProduct(id, fd);
      } else {
        await createAdminProduct(fd);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
        <Link to="/admin/products" className="btn btn-outline-dark btn-sm">
          <i className="bi bi-arrow-left"></i> Quay lại
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Thông tin cơ bản</h6>
              <div className="mb-3">
                <label className="form-label small fw-bold">Tên sản phẩm *</label>
                <input className="form-control" value={form.name} onChange={handleChange('name')} required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Mã SKU (quản lý nội bộ)</label>
                <input className="form-control" value={form.sku} onChange={handleChange('sku')} placeholder="Để trống nếu chưa có mã" />
                <small className="text-muted">Không hiển thị ra website - dùng để phân biệt các sản phẩm trùng tên.</small>
              </div>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Thương hiệu *</label>
                  <input
                    className="form-control"
                    value={form.brand}
                    onChange={handleChange('brand')}
                    list="brandOptions"
                    autoComplete="off"
                    required
                  />
                  <datalist id="brandOptions">
                    {brandOptions.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Nhãn (badge)</label>
                  <select className="form-select" value={form.badge} onChange={handleChange('badge')}>
                    {BADGE_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b || '(Không có)'}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Mô tả</label>
                <textarea className="form-control" rows={4} value={form.description} onChange={handleChange('description')} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold m-0">Thông số kỹ thuật</h6>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addSpecRow}>
                  <i className="bi bi-plus"></i> Thêm dòng
                </button>
              </div>
              {specs.map((row, i) => (
                <div className="row g-2 mb-2" key={i}>
                  <div className="col-5">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Tên thông số"
                      value={row.key}
                      onChange={(e) => updateSpecRow(i, 'key', e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Giá trị"
                      value={row.value}
                      onChange={(e) => updateSpecRow(i, 'value', e.target.value)}
                    />
                  </div>
                  <div className="col-1">
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeSpecRow(i)}>
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-3 border">
              <h6 className="fw-bold mb-3">Hình ảnh</h6>
              {existingImages.length > 0 && (
                <div className="d-flex flex-wrap gap-3 mb-3">
                  {existingImages.map((img) => (
                    <div key={img.id} className="position-relative">
                      <img
                        src={resolveImageUrl(img.url)}
                        onError={onImgError}
                        alt=""
                        style={{ width: 90, height: 90, objectFit: 'cover' }}
                        className="border rounded"
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-0"
                        style={{ width: 22, height: 22, lineHeight: 1 }}
                        onClick={() => handleRemoveExistingImage(img.id)}
                      >
                        <i className="bi bi-x small"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                className="form-control"
                accept="image/*"
                multiple
                onChange={(e) => setNewFiles(Array.from(e.target.files))}
              />
              <small className="text-muted d-block mt-1">
                Có thể chọn nhiều ảnh cùng lúc. <strong>Khuyến nghị ảnh vuông (tỉ lệ 1:1), tối
                thiểu 800×800px</strong>, nền trắng hoặc trong suốt - ảnh sẽ hiển thị vừa khung
                (không cắt) ở cả trang chi tiết và lưới sản phẩm.
              </small>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Giá & tồn kho</h6>
              <div className="mb-3">
                <label className="form-label small fw-bold">Giá bán *</label>
                <input type="number" className="form-control" value={form.price} onChange={handleChange('price')} required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Giá gốc</label>
                <input type="number" className="form-control" value={form.oldPrice} onChange={handleChange('oldPrice')} />
              </div>
              {currentRating && (
                <div className="mb-3 p-2 bg-light rounded small">
                  <i className="bi bi-star-fill text-warning"></i> {currentRating.rating.toFixed(1)}/5 ({currentRating.reviewCount} đánh giá)
                  <div className="text-muted mt-1">
                    Tự động tính từ đánh giá khách hàng đã duyệt - xem/duyệt tại{' '}
                    <Link to="/admin/reviews">trang Đánh giá</Link>.
                  </div>
                </div>
              )}
              <div className="row g-3 mt-0">
                <div className="col-6">
                  <label className="form-label small fw-bold">Đã bán</label>
                  <input type="number" className="form-control" value={form.sold} onChange={handleChange('sold')} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">Số lượng tồn kho</label>
                  <input type="number" min="0" className="form-control" value={form.stock} onChange={handleChange('stock')} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">Cân nặng (gram)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="(Không bắt buộc) Dùng để tính phí vận chuyển sau này"
                    value={form.weight}
                    onChange={handleChange('weight')}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Danh mục</h6>
              <div className="mb-3">
                <label className="form-label small fw-bold">Danh mục *</label>
                <select className="form-select" value={form.categoryId} onChange={handleCategoryChange} required>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {currentCategory && currentCategory.subCategories.length > 0 && (
                <div className={currentSubCategory?.subSubCategories?.length > 0 ? 'mb-3' : ''}>
                  <label className="form-label small fw-bold">Danh mục con</label>
                  <select className="form-select" value={form.subCategoryId} onChange={handleSubCategoryChange}>
                    <option value="">-- Không có --</option>
                    {currentCategory.subCategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {currentSubCategory && currentSubCategory.subSubCategories?.length > 0 && (
                <div>
                  <label className="form-label small fw-bold">Loại sản phẩm</label>
                  <select className="form-select" value={form.subSubCategoryId} onChange={handleChange('subSubCategoryId')}>
                    <option value="">-- Không có --</option>
                    {currentSubCategory.subSubCategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Khuyến mãi giờ vàng</h6>
              <p className="text-muted small mb-3">Để trống nếu sản phẩm không có khuyến mãi giới hạn thời gian.</p>
              <div className="mb-3">
                <label className="form-label small fw-bold">Kết thúc lúc</label>
                <input type="datetime-local" className="form-control" value={form.promoEndsAt} onChange={handleChange('promoEndsAt')} />
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label small fw-bold">Số suất khuyến mãi</label>
                  <input type="number" min="1" className="form-control" value={form.promoSlots} onChange={handleChange('promoSlots')} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">Đã bán (khuyến mãi)</label>
                  <input type="number" min="0" className="form-control" value={form.promoSold} onChange={handleChange('promoSold')} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-warning w-100 fw-bold rounded-pill py-2" disabled={submitting}>
              {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminProductForm;
