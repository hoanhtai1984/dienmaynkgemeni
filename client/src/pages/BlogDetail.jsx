import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPost } from '../api/posts';
import { resolveImageUrl, onImgError } from '../utils/resolveImageUrl';
import { formatDate } from '../utils/formatDate';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getPost(slug)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useDocumentMeta({
    title: post ? `${post.title} - Điện Máy NK` : undefined,
    description: post?.excerpt,
    image: post ? resolveImageUrl(post.image) : undefined,
    path: post?.slug ? `/tin-tuc/${post.slug}` : undefined,
  });

  if (loading) {
    return (
      <main className="py-5 bg-light text-center">
        <div className="spinner-border text-warning" role="status"></div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="py-5 bg-light">
        <div className="container text-center py-5">
          <i className="bi bi-emoji-frown text-muted" style={{ fontSize: '3rem' }}></i>
          <p className="text-muted mt-3 mb-3">Không tìm thấy bài viết bạn yêu cầu.</p>
          <Link to="/tin-tuc" className="btn btn-warning fw-bold rounded-pill px-4">Xem tất cả tin tức</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="py-4 bg-light">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb m-0">
            <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
            <li className="breadcrumb-item"><Link to="/tin-tuc">Tin tức</Link></li>
            <li className="breadcrumb-item active text-truncate" aria-current="page">{post.title}</li>
          </ol>
        </nav>

        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="bg-white p-4 p-md-5 rounded-4 border">
              <span className="badge bg-warning-subtle text-warning-emphasis fw-bold mb-3">{post.category}</span>
              <h1 className="fw-bold mb-2" style={{ fontSize: '1.75rem' }}>{post.title}</h1>
              <p className="text-muted small mb-4"><i className="bi bi-calendar3"></i> {formatDate(post.publishedAt)}</p>

              {post.image && (
                <img
                  src={resolveImageUrl(post.image)}
                  alt={post.title}
                  onError={onImgError}
                  className="w-100 rounded-3 mb-4"
                  style={{ maxHeight: 420, objectFit: 'cover' }}
                />
              )}

              <div className="post-content">
                {post.content.split('\n').filter((line) => line.trim()).map((paragraph, i) => (
                  <p key={i} className="mb-3">{paragraph}</p>
                ))}
              </div>

              <hr className="my-4" />
              <Link to="/tin-tuc" className="btn btn-outline-dark rounded-pill px-4">
                <i className="bi bi-arrow-left"></i> Quay lại danh sách tin tức
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default BlogDetail;
