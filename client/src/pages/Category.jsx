import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts } from '../api/products';
import { getBrands } from '../api/categories';
import { useCategories } from '../hooks/useCategories';
import ProductCard from '../components/ProductCard';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const PAGE_SIZE = 10;

const PRICE_RANGES = [
  { id: 'price-all', value: 'all', label: 'Tất cả' },
  { id: 'price-1', value: '0-1000000', label: 'Dưới 1 triệu' },
  { id: 'price-2', value: '1000000-3000000', label: '1 triệu - 3 triệu' },
  { id: 'price-3', value: '3000000-999999999', label: 'Trên 3 triệu' },
];

function Category() {
  const [searchParams] = useSearchParams();
  const { categories } = useCategories();

  const categorySlug = searchParams.get('cat') || 'all';
  const subSlug = searchParams.get('sub') || '';
  const subSubSlug = searchParams.get('subsub') || '';
  const keyword = searchParams.get('q') || '';
  const initialBrands = searchParams.get('brands') ? searchParams.get('brands').split(',') : [];

  const [availableBrands, setAvailableBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState(initialBrands);
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [appliedFilters, setAppliedFilters] = useState({ brands: initialBrands, priceRange: 'all', sortBy: 'newest' });

  // Trên di động, bộ lọc chiếm hết phần đầu trang (nằm trên lưới sản phẩm do
  // Bootstrap xếp dọc ở màn hình nhỏ) - mặc định mở, nhưng tự thu lại ngay
  // sau khi khách chọn danh mục/lọc để thấy sản phẩm liền, không cần cuộn qua.
  // Trên desktop (d-lg-block) luôn hiện, state này không có tác dụng.
  const [showFilters, setShowFilters] = useState(true);

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // "Xem Thêm" nhân đôi limit gửi lên server (10 -> 20 -> 40...) và tải lại -
  // không tự tải hết cả nghìn sản phẩm khớp bộ lọc rồi mới cắt ở client.
  const [expandSteps, setExpandSteps] = useState(0);
  const limit = PAGE_SIZE * 2 ** expandSteps;

  const currentCategory = categories.find((c) => c.slug === categorySlug);
  const currentSub = currentCategory?.subCategories.find((s) => s.slug === subSlug);
  const currentSubSub = currentSub?.subSubCategories?.find((s) => s.slug === subSubSlug);

  const title = keyword
    ? `Kết quả cho "${keyword}"`
    : currentSubSub?.name || currentSub?.name || currentCategory?.name || 'Sản phẩm';

  // Canonical chỉ giữ cat/sub/subsub (bỏ brands/price/sort/q) - tránh nhiều
  // URL lọc khác nhau bị Google coi là nội dung trùng lặp của cùng 1 trang.
  useDocumentMeta({
    title: `${title} - Điện Máy NK`,
    description: `Mua ${title.toLowerCase()} chính hãng, giá tốt, giao nhanh, bảo hành uy tín tại Điện Máy NK.`,
    path: !keyword && categorySlug !== 'all'
      ? `/danh-muc?cat=${categorySlug}${subSlug ? `&sub=${subSlug}` : ''}${subSubSlug ? `&subsub=${subSubSlug}` : ''}`
      : undefined,
  });

  useEffect(() => {
    setSelectedBrands(initialBrands);
    setAppliedFilters({ brands: initialBrands, priceRange: 'all', sortBy: 'newest' });
    setPriceRange('all');
    setSortBy('newest');
    setExpandSteps(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, subSlug, subSubSlug, keyword]);

  useEffect(() => {
    getBrands(keyword ? 'all' : categorySlug, keyword ? '' : subSlug, keyword ? '' : subSubSlug).then(setAvailableBrands);
  }, [categorySlug, subSlug, subSubSlug, keyword]);

  useEffect(() => {
    setLoading(true);
    const params = { sortBy: appliedFilters.sortBy, limit };
    if (keyword) params.q = keyword;
    if (categorySlug !== 'all') params.category = categorySlug;
    if (subSlug) params.sub = subSlug;
    if (subSubSlug) params.subsub = subSubSlug;
    if (appliedFilters.brands.length) params.brands = appliedFilters.brands.join(',');
    if (appliedFilters.priceRange !== 'all') {
      const [min, max] = appliedFilters.priceRange.split('-');
      params.minPrice = min;
      params.maxPrice = max;
    }

    getProducts(params)
      .then((data) => {
        setProducts(data.items);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [categorySlug, subSlug, subSubSlug, keyword, appliedFilters, limit]);

  function toggleBrand(brand) {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }

  function applyFilters() {
    setAppliedFilters({ brands: selectedBrands, priceRange, sortBy });
    setExpandSteps(0);
    setShowFilters(false);
  }

  function resetFilters() {
    setSelectedBrands([]);
    setPriceRange('all');
    setSortBy('newest');
    setAppliedFilters({ brands: [], priceRange: 'all', sortBy: 'newest' });
    setExpandSteps(0);
    setShowFilters(false);
  }

  function handleSortChange(e) {
    const value = e.target.value;
    setSortBy(value);
    setAppliedFilters((prev) => ({ ...prev, sortBy: value }));
  }

  return (
    <main className="py-4 bg-light">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb m-0">
            <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{title}</li>
          </ol>
        </nav>

        <div className="row g-4">
          <aside className="col-lg-3 col-md-4">
            <div className="filter-sidebar bg-white p-4 rounded-3 border">
              <div
                className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom"
                role="button"
                onClick={() => setShowFilters((v) => !v)}
              >
                <h5 className="fw-bold m-0">
                  <i className="bi bi-funnel-fill text-warning"></i> Bộ lọc tìm kiếm
                </h5>
                <i className={`bi bi-chevron-${showFilters ? 'up' : 'down'} d-lg-none`}></i>
              </div>

              <div className={showFilters ? '' : 'd-none d-lg-block'}>

              {!keyword && categorySlug !== 'all' && currentCategory?.subCategories.length > 0 && (
                <div className="filter-group mb-4">
                  <h6 className="fw-bold mb-2">Danh mục con</h6>
                  <div className="sub-filter-list">
                    <Link
                      to={`/danh-muc?cat=${categorySlug}`}
                      className={`sub-filter-link${!subSlug ? ' active' : ''}`}
                      onClick={() => setShowFilters(false)}
                    >
                      Tất cả
                    </Link>
                    {currentCategory.subCategories.map((sub) => (
                      <Link
                        key={sub.slug}
                        to={`/danh-muc?cat=${categorySlug}&sub=${sub.slug}`}
                        className={`sub-filter-link${subSlug === sub.slug ? ' active' : ''}`}
                        onClick={() => setShowFilters(false)}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!keyword && subSlug && currentSub?.subSubCategories?.length > 0 && (
                <div className="filter-group mb-4">
                  <h6 className="fw-bold mb-2">Loại sản phẩm</h6>
                  <div className="sub-filter-list">
                    <Link
                      to={`/danh-muc?cat=${categorySlug}&sub=${subSlug}`}
                      className={`sub-filter-link${!subSubSlug ? ' active' : ''}`}
                      onClick={() => setShowFilters(false)}
                    >
                      Tất cả
                    </Link>
                    {currentSub.subSubCategories.map((subSub) => (
                      <Link
                        key={subSub.slug}
                        to={`/danh-muc?cat=${categorySlug}&sub=${subSlug}&subsub=${subSub.slug}`}
                        className={`sub-filter-link${subSubSlug === subSub.slug ? ' active' : ''}`}
                        onClick={() => setShowFilters(false)}
                      >
                        {subSub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="filter-group mb-4">
                <h6 className="fw-bold mb-2">Thương hiệu</h6>
                <div>
                  {availableBrands.map((brand) => (
                    <div className="form-check mb-2" key={brand}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`brand-${brand}`}
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                      />
                      <label className="form-check-label" htmlFor={`brand-${brand}`}>{brand}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="filter-group mb-4">
                <h6 className="fw-bold mb-2">Khoảng giá</h6>
                {PRICE_RANGES.map((range) => (
                  <div className="form-check mb-2" key={range.id}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="price-filter"
                      id={range.id}
                      checked={priceRange === range.value}
                      onChange={() => setPriceRange(range.value)}
                    />
                    <label className="form-check-label" htmlFor={range.id}>{range.label}</label>
                  </div>
                ))}
              </div>

              <button className="btn btn-warning w-100 fw-bold rounded-pill text-dark" onClick={applyFilters}>
                Áp Dụng Bộ Lọc
              </button>
              <button className="btn btn-link w-100 text-muted small mt-2" onClick={resetFilters}>
                Xóa bộ lọc
              </button>
              </div>
            </div>
          </aside>

          <section className="col-lg-9 col-md-8">
            <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 border mb-4 flex-wrap gap-2">
              <h5 className="m-0 fw-bold">
                <span>{title}</span> (<span className="text-danger">{total}</span> sản phẩm)
              </h5>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small text-nowrap">Sắp xếp theo:</span>
                <select className="form-select form-select-sm border-secondary-subtle" value={sortBy} onChange={handleSortChange}>
                  <option value="newest">Mới nhất</option>
                  <option value="price-asc">Giá từ thấp đến cao</option>
                  <option value="price-desc">Giá từ cao đến thấp</option>
                  <option value="bestseller">Bán chạy nhất</option>
                </select>
              </div>
            </div>

            {!loading && total === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inboxes text-muted" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted mt-2 mb-0">Không tìm thấy sản phẩm phù hợp với bộ lọc đã chọn.</p>
              </div>
            ) : (
              <>
                <div className="row g-3">
                  {products.map((p) => (
                    <div className="col-6 col-xl-4" key={p.id}>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
                {(total > limit || expandSteps > 0) && (
                  <div className="text-center mt-4 d-flex justify-content-center gap-2">
                    {total > limit && (
                      <button
                        type="button"
                        className="btn btn-outline-dark rounded-pill px-4 fw-bold"
                        onClick={() => setExpandSteps((s) => s + 1)}
                      >
                        Xem Thêm <i className="bi bi-chevron-down"></i>
                      </button>
                    )}
                    {expandSteps > 0 && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill px-4 fw-bold"
                        onClick={() => setExpandSteps((s) => Math.max(0, s - 1))}
                      >
                        Thu Gọn <i className="bi bi-chevron-up"></i>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Category;
