import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { listAdminProducts, deleteAdminProduct, bulkCreateAdminProducts } from '../../api/admin';
import { formatMoney } from '../../utils/format';
import { resolveImageUrl, onImgError } from '../../utils/resolveImageUrl';
import { exportToExcel } from '../../utils/exportExcel';
import DateRangeFilter from '../../components/DateRangeFilter';
import { resolveDateRange, isWithinRange } from '../../utils/dateRangePresets';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 20;

const BULK_TEMPLATE_ROW = {
  'Tên sản phẩm *': 'Nồi chiên không dầu ABC 5L',
  'Thương hiệu *': 'ABC',
  'Giá bán *': 990000,
  'Giá gốc': 1290000,
  'Danh mục *': 'Điện Gia Dụng',
  'Danh mục con': 'Đồ Gia Dụng Nhà Bếp',
  'Danh mục con cấp 2': 'Nồi Chiên Không Dầu',
  'Mô tả': '',
  'Tồn kho': 10,
  'Đã bán': 0,
  'Nhãn': '',
};

function parseBulkRow(row) {
  return {
    name: row['Tên sản phẩm *'] ?? row['Tên sản phẩm'] ?? '',
    brand: row['Thương hiệu *'] ?? row['Thương hiệu'] ?? '',
    price: row['Giá bán *'] ?? row['Giá bán'] ?? '',
    oldPrice: row['Giá gốc'] ?? '',
    categoryName: row['Danh mục *'] ?? row['Danh mục'] ?? '',
    subCategoryName: row['Danh mục con'] ?? '',
    subSubCategoryName: row['Danh mục con cấp 2'] ?? '',
    description: row['Mô tả'] ?? '',
    stock: row['Tồn kho'] ?? '',
    sold: row['Đã bán'] ?? '',
    badgeLabel: row['Nhãn'] ?? '',
  };
}

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const debounceRef = useRef(null);

  const brandOptions = [...new Set(allProducts.map((p) => p.brand))].sort();

  function reload(pageNum, q) {
    setLoading(true);
    listAdminProducts({ q: (q ?? search).trim() || undefined, page: pageNum ?? page, limit: PAGE_SIZE })
      .then((res) => {
        setProducts(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }

  function reloadAllProducts() {
    listAdminProducts().then((res) => setAllProducts(res.items));
  }

  useEffect(() => { reload(page); }, [page]);
  useEffect(reloadAllProducts, []);

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      reload(1, value);
    }, 300);
  }

  async function handleDelete(product) {
    if (!window.confirm(`Xóa sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`)) return;
    setDeletingId(product.id);
    try {
      await deleteAdminProduct(product.id);
      reload();
      reloadAllProducts();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload() {
    const range = resolveDateRange(datePreset, customFrom, customTo);
    const all = await listAdminProducts();
    const filtered = all.items.filter((p) => {
      if (!isWithinRange(p.createdAt, range)) return false;
      if (filterBrand && p.brand !== filterBrand) return false;
      if (filterStock === 'in-stock' && !(p.stock > 0)) return false;
      if (filterStock === 'out-of-stock' && p.stock > 0) return false;
      return true;
    });

    exportToExcel('san-pham', [
      {
        name: 'Sản phẩm',
        rows: filtered.map((p) => ({
          'Mã SP': p.id,
          'Tên sản phẩm': p.name,
          'Thương hiệu': p.brand,
          'Giá bán': p.price,
          'Giá gốc': p.oldPrice,
          'Tồn kho': p.stock,
          'Đã bán': p.sold,
          'Đánh giá': p.rating,
          'Số lượt đánh giá': p.reviewCount,
          'Nhãn': p.badgeLabel || '',
        })),
      },
    ]);
  }

  function handleDownloadTemplate() {
    exportToExcel('mau-nhap-san-pham-hang-loat', [{ name: 'Sản phẩm', rows: [BULK_TEMPLATE_ROW] }]);
  }

  async function handleBulkFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBulkResults(null);
    setBulkFileName(file.name);
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet);
    setBulkRows(rawRows.map(parseBulkRow));
  }

  async function handleBulkSubmit() {
    setBulkSubmitting(true);
    try {
      const { results } = await bulkCreateAdminProducts(bulkRows);
      setBulkResults(results);
      if (results.some((r) => r.success)) {
        reload();
        reloadAllProducts();
      }
    } finally {
      setBulkSubmitting(false);
    }
  }

  function handleBulkReset() {
    setBulkRows([]);
    setBulkFileName('');
    setBulkResults(null);
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h3 className="fw-bold m-0">Quản lý sản phẩm</h3>
        <div className="d-flex gap-2 flex-wrap">
          <div className="position-relative">
            <i className="bi bi-search position-absolute text-muted" style={{ left: 12, top: 9 }}></i>
            <input
              type="text"
              className="form-control form-control-sm ps-4"
              style={{ width: 260 }}
              placeholder="Tìm theo tên, thương hiệu, SKU..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <button type="button" className="btn btn-outline-success fw-bold" onClick={() => setShowExportPanel((v) => !v)}>
            <i className="bi bi-file-earmark-excel"></i> Xuất Excel
          </button>
          <button
            type="button"
            className="btn btn-outline-dark fw-bold"
            onClick={() => { setShowBulkPanel((v) => !v); handleBulkReset(); }}
          >
            <i className="bi bi-upload"></i> Thêm hàng loạt
          </button>
          <Link to="/admin/products/new" className="btn btn-warning fw-bold rounded-pill px-3">
            <i className="bi bi-plus-lg"></i> Thêm sản phẩm
          </Link>
        </div>
      </div>

      {showBulkPanel && (
        <div className="bg-white p-4 rounded-3 border mb-4">
          <h6 className="fw-bold mb-2">Thêm sản phẩm hàng loạt bằng Excel</h6>
          <p className="text-muted small mb-3">
            Sản phẩm nhập hàng loạt sẽ chưa có ảnh - vào "Sửa" từng sản phẩm sau khi nhập để thêm ảnh.
            Cột "Danh mục" phải khớp đúng tên danh mục đang có trên site.
          </p>
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleDownloadTemplate}>
              <i className="bi bi-file-earmark-arrow-down"></i> Tải file mẫu
            </button>
            <input type="file" accept=".xlsx,.xls" className="form-control form-control-sm" style={{ width: 260 }} onChange={handleBulkFileChange} />
          </div>

          {bulkRows.length > 0 && !bulkResults && (
            <div className="mb-3">
              <p className="mb-2">
                Đã đọc được <strong>{bulkRows.length}</strong> dòng sản phẩm từ file <strong>{bulkFileName}</strong>.
              </p>
              <button type="button" className="btn btn-warning fw-bold" onClick={handleBulkSubmit} disabled={bulkSubmitting}>
                {bulkSubmitting ? 'Đang thêm...' : `Xác nhận thêm ${bulkRows.length} sản phẩm`}
              </button>
            </div>
          )}

          {bulkResults && (
            <div>
              <p className="mb-2">
                <span className="text-success fw-bold">{bulkResults.filter((r) => r.success).length} thành công</span>
                {' · '}
                <span className="text-danger fw-bold">{bulkResults.filter((r) => !r.success).length} lỗi</span>
              </p>
              {bulkResults.some((r) => !r.success) && (
                <ul className="list-unstyled small mb-2">
                  {bulkResults.filter((r) => !r.success).map((r) => (
                    <li key={r.row} className="text-danger">Dòng {r.row}: {r.error}</li>
                  ))}
                </ul>
              )}
              <button type="button" className="btn btn-sm btn-outline-dark" onClick={handleBulkReset}>
                Nhập file khác
              </button>
            </div>
          )}
        </div>
      )}

      {showExportPanel && (
        <div className="bg-white p-4 rounded-3 border mb-4">
          <h6 className="fw-bold mb-3">Bộ lọc xuất Excel</h6>
          <div className="row g-2 align-items-end mb-3">
            <div className="col-auto">
              <DateRangeFilter
                label="Ngày thêm sản phẩm"
                preset={datePreset}
                onPresetChange={setDatePreset}
                customFrom={customFrom}
                onCustomFromChange={setCustomFrom}
                customTo={customTo}
                onCustomToChange={setCustomTo}
              />
            </div>
            <div className="col-auto">
              <label className="form-label small fw-bold">Thương hiệu</label>
              <select className="form-select form-select-sm" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                <option value="">Tất cả thương hiệu</option>
                {brandOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <label className="form-label small fw-bold">Tình trạng kho</label>
              <select className="form-select form-select-sm" value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="in-stock">Còn hàng</option>
                <option value="out-of-stock">Hết hàng</option>
              </select>
            </div>
            <div className="col-auto">
              <button type="button" className="btn btn-warning fw-bold" onClick={handleDownload}>
                <i className="bi bi-download"></i> Tải về Excel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3 border">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-5 text-muted">
            {search.trim() ? `Không tìm thấy sản phẩm nào khớp với "${search.trim()}".` : 'Chưa có sản phẩm nào.'}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle m-0">
              <thead className="table-light">
                <tr>
                  <th>Ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>SKU</th>
                  <th>Thương hiệu</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ width: 64 }}>
                      <img
                        src={resolveImageUrl(p.images[0]?.url)}
                        alt={p.name}
                        onError={onImgError}
                        style={{ width: 48, height: 48, objectFit: 'contain' }}
                        className="border rounded"
                      />
                    </td>
                    <td>{p.name}</td>
                    <td>{p.sku || <span className="text-muted">—</span>}</td>
                    <td>{p.brand}</td>
                    <td>{formatMoney(p.price)}</td>
                    <td>
                      {p.stock > 0 ? (
                        <span className="badge bg-success-subtle text-success fw-bold">{p.stock}</span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger fw-bold">Hết hàng</span>
                      )}
                    </td>
                    <td className="text-end">
                      <Link to={`/admin/products/${p.id}/edit`} className="btn btn-sm btn-outline-primary me-2">
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
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default AdminProducts;
