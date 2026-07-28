import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAdminPosts, deleteAdminPost } from '../../api/admin';
import { resolveImageUrl, onImgError } from '../../utils/resolveImageUrl';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  function reload() {
    setLoading(true);
    listAdminPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleDelete(post) {
    if (!window.confirm(`Xóa bài viết "${post.title}"? Hành động này không thể hoàn tác.`)) return;
    setDeletingId(post.id);
    try {
      await deleteAdminPost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">Quản lý tin tức</h3>
        <Link to="/admin/posts/new" className="btn btn-warning fw-bold rounded-pill px-3">
          <i className="bi bi-plus-lg"></i> Thêm bài viết
        </Link>
      </div>

      <div className="bg-white rounded-3 border">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle m-0">
              <thead className="table-light">
                <tr>
                  <th>Ảnh</th>
                  <th>Tiêu đề</th>
                  <th>Chuyên mục</th>
                  <th>Ngày đăng</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ width: 64 }}>
                      <img
                        src={resolveImageUrl(p.image)}
                        alt={p.title}
                        onError={onImgError}
                        style={{ width: 48, height: 48, objectFit: 'cover' }}
                        className="border rounded"
                      />
                    </td>
                    <td className="text-truncate" style={{ maxWidth: 320 }}>{p.title}</td>
                    <td>{p.category}</td>
                    <td>{formatDate(p.publishedAt)}</td>
                    <td className="text-end">
                      <Link to={`/admin/posts/${p.id}/edit`} className="btn btn-sm btn-outline-primary me-2">
                        <i className="bi bi-pencil"></i> Sửa
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                      >
                        <i className="bi bi-trash3"></i> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPosts;
