import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getWishlist } from '../api/wishlist';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { showToast } from '../utils/toast';
import ExpandableProductGrid from '../components/ExpandableProductGrid';
import { WISHLIST_UPDATED_EVENT } from '../hooks/useWishlistIds';

function Wishlist() {
  const { customer, loading: authLoading } = useCustomerAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    getWishlist()
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!customer) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  useEffect(() => {
    window.addEventListener(WISHLIST_UPDATED_EVENT, reload);
    return () => window.removeEventListener(WISHLIST_UPDATED_EVENT, reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  useEffect(() => {
    if (!authLoading && !customer) {
      showToast('Vui lòng đăng nhập để xem sản phẩm yêu thích');
    }
  }, [authLoading, customer]);

  if (authLoading) {
    return (
      <main className="py-5 bg-light">
        <div className="container text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
        </div>
      </main>
    );
  }

  if (!customer) {
    showToast('Vui lòng đăng nhập để xem sản phẩm yêu thích');
    return <Navigate to="/" replace />;
  }

  return (
    <main className="py-5 bg-light">
      <div className="container">
        <h2 className="fw-bold mb-4">
          <i className="bi bi-heart-fill text-warning"></i> Sản phẩm yêu thích
        </h2>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3 border text-center py-5">
            <i className="bi bi-heart text-muted" style={{ fontSize: '3rem' }}></i>
            <p className="text-muted mt-3 mb-3">Bạn chưa lưu sản phẩm yêu thích nào.</p>
            <Link to="/" className="btn btn-warning fw-bold rounded-pill px-4">Tiếp tục mua sắm</Link>
          </div>
        ) : (
          <ExpandableProductGrid products={products} initialCount={12} />
        )}
      </div>
    </main>
  );
}

export default Wishlist;
