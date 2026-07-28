import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct, getRecommendations } from '../api/products';
import { getProductReviews, getReviewEligibility, submitReview } from '../api/reviews';
import { formatMoney } from '../utils/format';
import { formatDate } from '../utils/formatDate';
import { resolveImageUrl, onImgError } from '../utils/resolveImageUrl';
import { addItem } from '../utils/cart';
import { showToast } from '../utils/toast';
import ExpandableProductGrid from '../components/ExpandableProductGrid';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useJsonLd } from '../hooks/useJsonLd';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useWishlistIds } from '../hooks/useWishlistIds';

function metaDescriptionFromProduct(text) {
  if (!text) return '';
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= 160) return flat;
  return `${flat.slice(0, 157).trimEnd()}...`;
}

const BULLET_RE = /^[•·▪✔️✅➡️📍\-–—*]\s*/u;

function isBulletLine(line) {
  return BULLET_RE.test(line);
}

function isHeaderLine(line) {
  if (line.length > 60 || line.length < 3) return false;
  if (/[.,!?:]$/.test(line)) return false;
  const letters = line.replace(/[^\p{L}]/gu, '');
  if (!letters) return false;
  const isBoldUnicode = /[\u{1D400}-\u{1D7FF}]/u.test(line);
  const isUpper = letters === letters.toUpperCase() && letters !== letters.toLowerCase();
  return isBoldUnicode || isUpper;
}

// Mô tả sản phẩm là text thuần với xuống dòng - nhóm lại thành đoạn văn,
// danh sách gạch đầu dòng và tiêu đề phụ để hiển thị đẹp mắt hơn.
function formatDescription(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const blocks = [];
  let currentList = null;
  for (const line of lines) {
    if (isBulletLine(line)) {
      const content = line.replace(BULLET_RE, '');
      if (!currentList) {
        currentList = [];
        blocks.push({ type: 'list', items: currentList });
      }
      currentList.push(content);
    } else {
      currentList = null;
      blocks.push(isHeaderLine(line) ? { type: 'header', text: line } : { type: 'p', text: line });
    }
  }
  return blocks;
}

function renderStars(rating) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<i className="bi bi-star-fill" key={i}></i>);
    else if (rating >= i - 0.5) stars.push(<i className="bi bi-star-half" key={i}></i>);
    else stars.push(<i className="bi bi-star" key={i}></i>);
  }
  return stars;
}

function ReviewsTab({ productId }) {
  const { isAuthenticated } = useCustomerAuth();
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function reloadReviews() {
    setReviewsLoading(true);
    getProductReviews(productId)
      .then(setReviews)
      .finally(() => setReviewsLoading(false));
  }

  useEffect(() => {
    reloadReviews();
    if (isAuthenticated) {
      getReviewEligibility(productId).then((data) => {
        setEligibility(data);
        if (data.existingReview) {
          setForm({ rating: data.existingReview.rating, comment: data.existingReview.comment || '' });
        }
      });
    } else {
      setEligibility(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, isAuthenticated]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      const result = await submitReview({ productId, rating: form.rating, comment: form.comment.trim() });
      setEligibility((prev) => ({ ...prev, existingReview: { rating: result.rating, comment: result.comment, approved: result.approved } }));
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <div className="text-warning fs-5">{renderStars(reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0)}</div>
        <span className="text-muted">{reviews.length} đánh giá</span>
      </div>

      {reviewsLoading ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-muted">Chưa có đánh giá nào cho sản phẩm này.</p>
      ) : (
        <div className="mb-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-bottom pb-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <strong>{r.customerName}</strong>
                <span className="text-muted small">{formatDate(r.createdAt)}</span>
              </div>
              <div className="text-warning small mb-1">{renderStars(r.rating)}</div>
              {r.comment && <p className="mb-0">{r.comment}</p>}
              {r.adminReply && (
                <div className="bg-light rounded-3 p-2 mt-2 ms-3">
                  <div className="fw-bold small text-warning-emphasis">
                    <i className="bi bi-shop"></i> Phản hồi từ Điện Máy NK
                  </div>
                  <p className="small mb-1">{r.adminReply}</p>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{formatDate(r.adminReplyAt)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-light p-3 rounded-3">
        {!isAuthenticated ? (
          <p className="text-muted mb-0 small">Vui lòng đăng nhập (biểu tượng tài khoản ở đầu trang) để đánh giá sản phẩm này.</p>
        ) : eligibility === null ? (
          <div className="text-center py-2">
            <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
          </div>
        ) : !eligibility.eligible ? (
          <p className="text-muted mb-0 small">Bạn cần mua và nhận sản phẩm này trước khi có thể đánh giá.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <h6 className="fw-bold mb-2">{eligibility.existingReview ? 'Sửa đánh giá của bạn' : 'Viết đánh giá'}</h6>
            {eligibility.existingReview && !success && (
              <p className="small text-muted mb-2">
                {eligibility.existingReview.approved ? 'Đánh giá của bạn đang hiển thị công khai.' : 'Đánh giá của bạn đang chờ duyệt.'}
              </p>
            )}
            {error && <div className="alert alert-danger py-2 small mb-2">{error}</div>}
            {success && <div className="alert alert-success py-2 small mb-2">Đã gửi đánh giá, cảm ơn bạn! Đánh giá sẽ hiển thị sau khi được duyệt.</div>}
            <div className="mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <i
                  key={n}
                  className={`bi ${n <= form.rating ? 'bi-star-fill' : 'bi-star'} text-warning fs-4 me-1`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setForm((prev) => ({ ...prev, rating: n }))}
                ></i>
              ))}
            </div>
            <textarea
              className="form-control form-control-sm mb-2"
              rows={3}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm (không bắt buộc)"
              value={form.comment}
              onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
            />
            <button type="submit" className="btn btn-warning btn-sm fw-bold" disabled={submitting}>
              {submitting ? 'Đang gửi...' : eligibility.existingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isWishlisted, toggle: toggleWishlist } = useWishlistIds();

  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [qty, setQty] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('specs');

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getProduct(slug)
      .then((data) => {
        setProduct(data);
        setActiveImage(data.image);
        setQty(1);
        // Link cũ/bookmark dạng bare id hoặc slug đã lỗi thời (đổi tên sản
        // phẩm) vẫn tra đúng sản phẩm - đưa URL về đúng slug hiện tại để
        // hiển thị đẹp và nhất quán khi chia sẻ link từ trang này về sau.
        if (data.slug && data.slug !== slug) {
          navigate(`/san-pham/${data.slug}`, { replace: true });
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    getRecommendations(slug)
      .then(setRecommendations)
      .catch(() => setRecommendations([]));
  }, [slug, navigate]);

  useDocumentMeta({
    title: product ? `${product.name} - Điện Máy NK` : undefined,
    description: product ? metaDescriptionFromProduct(product.description) : undefined,
    image: product ? resolveImageUrl(product.image) : undefined,
    path: product?.slug ? `/san-pham/${product.slug}` : undefined,
  });

  useJsonLd(
    'product-jsonld',
    product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: resolveImageUrl(product.image),
          description: metaDescriptionFromProduct(product.description),
          sku: product.sku || undefined,
          brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
          ...(product.rating
            ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: Math.max(product.sold || 1, 1) } }
            : {}),
          offers: {
            '@type': 'Offer',
            url: `${window.location.origin}/san-pham/${product.slug}`,
            priceCurrency: 'VND',
            price: product.price,
            availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        }
      : null
  );

  useJsonLd(
    'breadcrumb-jsonld',
    product
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: window.location.origin },
            { '@type': 'ListItem', position: 2, name: product.categoryName, item: `${window.location.origin}/danh-muc?cat=${product.category}` },
            { '@type': 'ListItem', position: 3, name: product.name },
          ],
        }
      : null
  );

  if (loading) {
    return (
      <main className="py-4 bg-light">
        <div className="container text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="text-muted mt-3">Đang tải thông tin sản phẩm...</p>
        </div>
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main className="py-4 bg-light">
        <div className="container text-center py-5">
          <i className="bi bi-emoji-frown text-muted" style={{ fontSize: '3rem' }}></i>
          <p className="text-muted mt-3">Không tìm thấy sản phẩm bạn yêu cầu.</p>
          <Link to="/" className="btn btn-warning fw-bold rounded-pill px-4">Về trang chủ</Link>
        </div>
      </main>
    );
  }

  const outOfStock = product.stock === 0;

  function handleAddToCart() {
    addItem(product, qty);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
  }

  function handleBuyNow() {
    addItem(product, qty);
    navigate('/gio-hang');
  }

  return (
    <main className="py-4 bg-light">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb m-0">
            <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
            <li className="breadcrumb-item"><Link to={`/danh-muc?cat=${product.category}`}>{product.categoryName}</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
          </ol>
        </nav>

        <div className="bg-white p-4 rounded-3 border mb-4">
          <div className="row g-4">
            <div className="col-md-5">
              <div className="product-gallery border rounded-3 p-3 text-center bg-white">
                <img src={resolveImageUrl(activeImage)} className="img-fluid rounded" alt={product.name} onError={onImgError} />
              </div>
              {product.images.length > 1 && (
                <div className="thumbnail-list">
                  {product.images.map((img, index) => (
                    <div
                      key={index}
                      className={`thumbnail-item${img === activeImage ? ' active' : ''}`}
                      onClick={() => setActiveImage(img)}
                    >
                      <img src={resolveImageUrl(img)} alt={`Ảnh ${index + 1}`} onError={onImgError} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-md-7">
              {product.badge && <span className="badge bg-danger mb-2 me-2">{product.badge}</span>}
              {outOfStock && <span className="badge bg-secondary mb-2">Hết hàng</span>}
              <h2 className="fw-bold text-dark fs-3 mb-2">{product.name}</h2>

              <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                <div className="text-warning small">
                  {renderStars(product.rating)}
                  <span className="text-muted ms-1">({product.reviewCount} đánh giá)</span>
                </div>
                <div className="text-muted small">| Thương hiệu: <strong className="text-dark">{product.brand}</strong></div>
                <div className="text-muted small">| Đã bán: <strong className="text-dark">{product.sold}</strong></div>
              </div>

              <div className="price-box p-3 bg-light rounded-3 mb-4">
                <div className="d-flex align-items-baseline gap-3 flex-wrap">
                  <span className="fs-2 fw-bold text-danger">{formatMoney(product.price)}</span>
                  {product.discount > 0 && (
                    <>
                      <span className="text-muted text-decoration-line-through">{formatMoney(product.oldPrice)}</span>
                      <span className="badge bg-danger-subtle text-danger fw-bold rounded">-{product.discount}%</span>
                    </>
                  )}
                </div>
                <small className="text-success d-block mt-2">
                  <i className="bi bi-check-circle-fill"></i> Giá đã bao gồm thuế VAT và miễn phí vận chuyển nội thành
                </small>
              </div>

              <div className="mb-4">
                <label className="fw-bold small d-block mb-2">Số lượng</label>
                <div className="qty-selector">
                  <button type="button" disabled={outOfStock} onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                  <input type="text" className="qty-selector-input" value={qty} readOnly />
                  <button type="button" disabled={outOfStock} onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
                </div>
              </div>

              {outOfStock ? (
                <div className="alert alert-secondary fw-bold text-center py-3 mb-0">
                  Sản phẩm tạm hết hàng, vui lòng quay lại sau hoặc liên hệ hotline để được hỗ trợ.
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-sm-6">
                    <button className="btn btn-danger w-100 py-3 fw-bold fs-5" onClick={handleAddToCart}>
                      <i className="bi bi-cart-plus-fill"></i> THÊM VÀO GIỎ
                    </button>
                  </div>
                  <div className="col-sm-6">
                    <button className="btn btn-warning w-100 py-3 fw-bold fs-5 text-dark" onClick={handleBuyNow}>
                      MUA NGAY
                    </button>
                  </div>
                </div>
              )}
              <button
                type="button"
                className={`btn w-100 mt-3 fw-bold ${isWishlisted(product.id) ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
                onClick={() => toggleWishlist(product.id)}
              >
                <i className={`bi ${isWishlisted(product.id) ? 'bi-heart-fill' : 'bi-heart'}`}></i>{' '}
                {isWishlisted(product.id) ? 'Đã lưu vào yêu thích' : 'Lưu vào yêu thích'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3 border">
          <div className="product-tabs d-flex gap-2 p-3 border-bottom">
            <button
              type="button"
              className={`product-tab-btn${activeTab === 'specs' ? ' active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              Thông số kỹ thuật
            </button>
            <button
              type="button"
              className={`product-tab-btn${activeTab === 'info' ? ' active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Thông tin sản phẩm
            </button>
            <button
              type="button"
              className={`product-tab-btn${activeTab === 'reviews' ? ' active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Đánh giá ({product.reviewCount})
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'specs' && (
              Object.keys(product.specs).length > 0 ? (
                <table className="table table-striped m-0 specs-table">
                  <tbody>
                    {Object.entries(product.specs).map(([key, value]) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted m-0">Sản phẩm chưa có thông số kỹ thuật chi tiết.</p>
              )
            )}

            {activeTab === 'info' && (
              <div className="product-description">
                {formatDescription(product.description).map((block, i) => {
                  if (block.type === 'header') {
                    return <h6 key={i} className="fw-bold mt-3 mb-2 text-dark">{block.text}</h6>;
                  }
                  if (block.type === 'list') {
                    return (
                      <ul key={i} className="mb-3">
                        {block.items.map((item, j) => <li key={j}>{item}</li>)}
                      </ul>
                    );
                  }
                  return <p key={i} className="mb-2">{block.text}</p>;
                })}
              </div>
            )}

            {activeTab === 'reviews' && <ReviewsTab productId={product.id} />}
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-4">
            <h4 className="fw-bold mb-3">Sản phẩm liên quan</h4>
            <ExpandableProductGrid products={recommendations} initialCount={10} />
          </div>
        )}
      </div>
    </main>
  );
}

export default ProductDetail;
