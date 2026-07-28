// Component phân trang dùng chung cho các bảng danh sách trong admin + trang
// Tin tức - chỉ hiện khi có từ 2 trang trở lên, luôn hiện tối đa 5 số trang
// quanh trang hiện tại để không tràn ngang trên bảng dài.
function pageNumbers(page, totalPages) {
  const maxButtons = 5;
  let start = Math.max(1, page - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="d-flex justify-content-center py-3">
      <ul className="pagination pagination-sm m-0">
        <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
          <button type="button" className="page-link" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            <i className="bi bi-chevron-left"></i>
          </button>
        </li>
        {pageNumbers(page, totalPages)[0] > 1 && (
          <li className="page-item disabled d-none d-sm-block">
            <span className="page-link">…</span>
          </li>
        )}
        {pageNumbers(page, totalPages).map((p) => (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
            <button type="button" className="page-link" onClick={() => onPageChange(p)}>
              {p}
            </button>
          </li>
        ))}
        {pageNumbers(page, totalPages).at(-1) < totalPages && (
          <li className="page-item disabled d-none d-sm-block">
            <span className="page-link">…</span>
          </li>
        )}
        <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
          <button type="button" className="page-link" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
