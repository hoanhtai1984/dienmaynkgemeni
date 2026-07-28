import { Link } from 'react-router-dom';
import { useCompareIds } from '../hooks/useCompareCount';
import { clearCompare } from '../utils/compare';

function CompareBar() {
  const compareIds = useCompareIds();

  if (compareIds.length === 0) return null;

  return (
    <div className="compare-bar bg-dark text-white py-2 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
      <span className="fw-semibold small">
        <i className="bi bi-bar-chart-fill text-warning"></i> Đã chọn {compareIds.length} sản phẩm để so sánh
      </span>
      <div className="d-flex gap-2">
        <Link to="/so-sanh" className="btn btn-warning btn-sm fw-bold text-dark">
          So Sánh Ngay
        </Link>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={clearCompare}>
          Xóa hết
        </button>
      </div>
    </div>
  );
}

export default CompareBar;
