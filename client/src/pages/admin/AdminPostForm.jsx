import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getAdminPost, createAdminPost, updateAdminPost } from '../../api/admin';
import { resolveImageUrl, onImgError } from '../../utils/resolveImageUrl';

const CATEGORY_OPTIONS = ['Mẹo Hay Gia Đình', 'Tư Vấn Mua Sắm', 'Bí Quyết Công Nghệ', 'Hướng Dẫn Sử Dụng'];

const EMPTY_FORM = {
  title: '',
  slug: '',
  category: CATEGORY_OPTIONS[0],
  excerpt: '',
  content: '',
  publishedAt: '',
};

function toDatetimeLocal(isoString) {
  const d = isoString ? new Date(isoString) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminPostForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...EMPTY_FORM, publishedAt: toDatetimeLocal() });
  const [existingImage, setExistingImage] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getAdminPost(id).then((p) => {
      setForm({
        title: p.title,
        slug: p.slug,
        category: p.category,
        excerpt: p.excerpt,
        content: p.content,
        publishedAt: toDatetimeLocal(p.publishedAt),
      });
      setExistingImage(p.image);
      setLoading(false);
    });
  }, [id, isEdit]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('title', form.title);
      if (form.slug.trim()) fd.append('slug', form.slug.trim());
      fd.append('category', form.category);
      fd.append('excerpt', form.excerpt);
      fd.append('content', form.content);
      fd.append('publishedAt', new Date(form.publishedAt).toISOString());
      if (newFile) fd.append('image', newFile);

      if (isEdit) {
        await updateAdminPost(id, fd);
      } else {
        await createAdminPost(fd);
      }
      navigate('/admin/posts');
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
        <h3 className="fw-bold m-0">{isEdit ? 'Sửa bài viết' : 'Thêm bài viết mới'}</h3>
        <Link to="/admin/posts" className="btn btn-outline-dark btn-sm">
          <i className="bi bi-arrow-left"></i> Quay lại
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Nội dung</h6>
              <div className="mb-3">
                <label className="form-label small fw-bold">Tiêu đề *</label>
                <input className="form-control" value={form.title} onChange={handleChange('title')} required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Đường dẫn (slug)</label>
                <input className="form-control" placeholder="Để trống sẽ tự tạo từ tiêu đề" value={form.slug} onChange={handleChange('slug')} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Mô tả ngắn (excerpt) *</label>
                <textarea className="form-control" rows={2} value={form.excerpt} onChange={handleChange('excerpt')} required />
              </div>
              <div>
                <label className="form-label small fw-bold">Nội dung bài viết *</label>
                <textarea className="form-control" rows={14} value={form.content} onChange={handleChange('content')} required />
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Thông tin đăng bài</h6>
              <div className="mb-3">
                <label className="form-label small fw-bold">Chuyên mục *</label>
                <select className="form-select" value={form.category} onChange={handleChange('category')} required>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label small fw-bold">Ngày đăng</label>
                <input type="datetime-local" className="form-control" value={form.publishedAt} onChange={handleChange('publishedAt')} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Ảnh đại diện</h6>
              <p className="text-muted small mb-3">
                <strong>Khuyến nghị ảnh khổ ngang, tỉ lệ 16:9</strong> (vd 1280×720px trở lên) -
                hiển thị dạng cắt vừa khung ở cả trang danh sách tin tức và đầu bài viết.
              </p>
              {existingImage && (
                <img
                  src={resolveImageUrl(existingImage)}
                  onError={onImgError}
                  alt=""
                  className="w-100 rounded mb-3"
                  style={{ maxHeight: 160, objectFit: 'cover' }}
                />
              )}
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(e) => setNewFile(e.target.files[0] || null)}
              />
            </div>

            <button type="submit" className="btn btn-warning w-100 fw-bold rounded-pill py-2" disabled={submitting}>
              {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật bài viết' : 'Đăng bài viết'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminPostForm;
