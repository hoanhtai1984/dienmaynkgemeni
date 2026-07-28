import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../api/posts';
import { resolveImageUrl, onImgError } from '../utils/resolveImageUrl';
import { formatDate } from '../utils/formatDate';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 12;

function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    getPosts({ page, limit: PAGE_SIZE })
      .then((res) => {
        setPosts(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useDocumentMeta({
    title: 'Tin Tức & Mẹo Hay - Điện Máy NK',
    description: 'Tin tức, mẹo hay và hướng dẫn sử dụng điện máy, điện gia dụng từ Điện Máy NK.',
    path: '/tin-tuc',
  });

  return (
    <main className="py-4 bg-light">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb m-0">
            <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Tin tức</li>
          </ol>
        </nav>

        <h3 className="fw-bold mb-4">
          <i className="bi bi-newspaper text-warning"></i> Tin Tức &amp; Mẹo Hay
        </h3>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted mb-0">Chưa có bài viết nào.</p>
          </div>
        ) : (
          <div className="row g-4">
            {posts.map((post) => (
              <div className="col-md-6 col-lg-4" key={post.id}>
                <Link to={`/tin-tuc/${post.slug}`} className="text-decoration-none text-dark">
                  <div className="bg-white rounded-4 border h-100 overflow-hidden">
                    <div className="ratio ratio-16x9">
                      <img src={resolveImageUrl(post.image)} alt={post.title} onError={onImgError} className="object-fit-cover" />
                    </div>
                    <div className="p-3">
                      <span className="badge bg-warning-subtle text-warning-emphasis fw-bold small mb-2">{post.category}</span>
                      <h6 className="fw-bold text-truncate-2">{post.title}</h6>
                      <p className="text-muted small text-truncate-2 mb-2">{post.excerpt}</p>
                      <small className="text-muted"><i className="bi bi-calendar3"></i> {formatDate(post.publishedAt)}</small>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </main>
  );
}

export default Blog;
