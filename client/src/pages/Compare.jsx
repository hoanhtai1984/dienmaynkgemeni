import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProduct } from '../api/products';
import { formatMoney } from '../utils/format';
import { resolveImageUrl, onImgError } from '../utils/resolveImageUrl';
import { productUrl } from '../utils/productUrl';
import { useCompareIds } from '../hooks/useCompareCount';
import { removeFromCompare } from '../utils/compare';
import { addItem } from '../utils/cart';
import { showToast } from '../utils/toast';

function Compare() {
  const compareIds = useCompareIds();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(compareIds.map((id) => getProduct(id).catch(() => null)))
      .then((results) => setProducts(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [compareIds]);

  const allSpecKeys = [...new Set(products.flatMap((p) => Object.keys(p.specs || {})))];

  function handleAddToCart(product) {
    addItem(product, 1);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
  }

  return (
    <main className="py-4 bg-light">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb m-0">
            <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
            <li className="breadcrumb-item active" aria-current="page">So sánh sản phẩm</li>
          </ol>
        </nav>

        <h4 className="fw-bold mb-4">
          <i className="bi bi-bar-chart-fill text-warning"></i> So Sánh Sản Phẩm
        </h4>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3 border p-5 text-center">
            <i className="bi bi-bar-chart text-muted" style={{ fontSize: '3rem' }}></i>
            <p className="text-muted mt-3 mb-3">Chưa có sản phẩm nào để so sánh. Bấm nút <i className="bi bi-bar-chart-fill"></i> trên sản phẩm để thêm vào so sánh.</p>
            <Link to="/danh-muc" className="btn btn-warning fw-bold rounded-pill px-4">Xem sản phẩm</Link>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-3 border">
            <table className="table table-bordered align-middle m-0">
              <tbody>
                <tr>
                  <th style={{ width: 160 }} className="bg-light">Sản phẩm</th>
                  {products.map((p) => (
                    <td key={p.id} className="text-center position-relative" style={{ minWidth: 220 }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 rounded-circle p-0"
                        style={{ width: 24, height: 24, lineHeight: 1 }}
                        title="Bỏ khỏi so sánh"
                        onClick={() => removeFromCompare(p.id)}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                      <Link to={productUrl(p)}>
                        <img
                          src={resolveImageUrl(p.image)}
                          alt={p.name}
                          onError={onImgError}
                          style={{ width: 100, height: 100, objectFit: 'cover' }}
                          className="rounded mb-2 mt-3"
                        />
                      </Link>
                      <div className="fw-semibold small text-truncate-2">
                        <Link to={productUrl(p)} className="text-dark text-decoration-none">{p.name}</Link>
                      </div>
                      {p.stock === 0 && <span className="badge bg-secondary mt-1">Hết hàng</span>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="bg-light">Thương hiệu</th>
                  {products.map((p) => <td key={p.id} className="text-center">{p.brand}</td>)}
                </tr>
                <tr>
                  <th className="bg-light">Giá</th>
                  {products.map((p) => (
                    <td key={p.id} className="text-center">
                      <span className="text-danger fw-bold">{formatMoney(p.price)}</span>
                      {p.discount > 0 && (
                        <div className="text-muted text-decoration-line-through small">{formatMoney(p.oldPrice)}</div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="bg-light">Đánh giá</th>
                  {products.map((p) => (
                    <td key={p.id} className="text-center">
                      <i className="bi bi-star-fill text-warning"></i> {p.rating} ({p.reviewCount})
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="bg-light">Danh mục</th>
                  {products.map((p) => (
                    <td key={p.id} className="text-center small">
                      {[p.categoryName, p.subCategoryName, p.subSubCategoryName].filter(Boolean).join(' / ')}
                    </td>
                  ))}
                </tr>
                {allSpecKeys.map((key) => (
                  <tr key={key}>
                    <th className="bg-light">{key}</th>
                    {products.map((p) => (
                      <td key={p.id} className="text-center small">{p.specs?.[key] ?? <span className="text-muted">—</span>}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th className="bg-light"></th>
                  {products.map((p) => (
                    <td key={p.id} className="text-center">
                      <button
                        className="btn btn-warning btn-sm fw-bold text-dark"
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock === 0}
                      >
                        <i className="bi bi-cart-plus"></i> {p.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

export default Compare;
