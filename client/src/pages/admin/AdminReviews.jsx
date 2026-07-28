import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAdminReviews, setAdminReviewApproved, setAdminReviewReply, deleteAdminReview } from '../../api/admin';
import { formatDate } from '../../utils/formatDate';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 20;

function stars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function ReplyCell({ review, onSaved }) {
  const [reply, setReply] = useState(review.adminReply || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await setAdminReviewReply(review.id, reply.trim());
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minWidth: 220 }}>
      <textarea
        className="form-control form-control-sm mb-1"
        rows={2}
        placeholder="Phản hồi công khai..."
        value={reply}
        onChange={(e) => setReply(e.target.value)}
      />
      <button type="button" className="btn btn-sm btn-outline-dark" onClick={handleSave} disabled={saving}>
        {saving ? 'Đang lưu...' : 'Lưu phản hồi'}
      </button>
    </div>
  );
}

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  function reload() {
    setLoading(true);
    listAdminReviews(filter || undefined, { page, limit: PAGE_SIZE })
      .then((res) => {
        setReviews(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [filter, page]);
  useEffect(() => setPage(1), [filter]);

  async function handleSetApproved(review, approved) {
    setUpdatingId(review.id);
    try {
      await setAdminReviewApproved(review.id, approved);
      reload();
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(review) {
    if (!window.confirm(`Xóa đánh giá của "${review.customer.name}" cho sản phẩm "${review.product.name}"?`)) return;
    setUpdatingId(review.id);
    try {
      await deleteAdminReview(review.id);
      reload();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h3 className="fw-bold m-0">Đánh giá sản phẩm</h3>
        <select className="form-select form-select-sm" style={{ width: 220 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="false">Chờ duyệt</option>
          <option value="true">Đã duyệt</option>
        </select>
      </div>

      <div className="bg-white rounded-3 border">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-5 text-muted">Chưa có đánh giá nào.</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle m-0">
              <thead className="table-light">
                <tr>
                  <th>Sản phẩm</th>
                  <th>Khách hàng</th>
                  <th>Đánh giá</th>
                  <th>Nội dung</th>
                  <th>Phản hồi</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/san-pham/${r.product.slug}`} target="_blank" rel="noreferrer">{r.product.name}</Link>
                    </td>
                    <td>
                      {r.customer.name}
                      <div className="text-muted small">{r.customer.email}</div>
                    </td>
                    <td className="text-warning text-nowrap">{stars(r.rating)}</td>
                    <td style={{ maxWidth: 260 }}>{r.comment || <span className="text-muted">(không có nội dung)</span>}</td>
                    <td><ReplyCell review={r} onSaved={reload} /></td>
                    <td className="text-nowrap">{formatDate(r.createdAt)}</td>
                    <td>
                      <span className={`badge ${r.approved ? 'bg-success' : 'bg-secondary'}`}>
                        {r.approved ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleSetApproved(r, !r.approved)}
                          disabled={updatingId === r.id}
                        >
                          {r.approved ? 'Ẩn' : 'Duyệt'}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(r)}
                          disabled={updatingId === r.id}
                        >
                          <i className="bi bi-trash3"></i> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default AdminReviews;
