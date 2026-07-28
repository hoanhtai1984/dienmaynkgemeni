const DEFAULT_PAGE_SIZE = 20;

// `limit` là opt-in - giống hệt quy ước đã dùng ở productsController.list:
// không truyền limit thì trả về TOÀN BỘ kết quả khớp (không phân trang) -
// dùng cho các chỗ cần tải hết để xuất Excel/lọc phía client mà không cần
// đổi endpoint. Truyền limit thì mới thực sự phân trang (skip/take).
function parsePagination(query, defaultPageSize = DEFAULT_PAGE_SIZE) {
  const limit = query.limit ? Math.max(1, Number(query.limit)) : undefined;
  const page = limit ? Math.max(1, Number(query.page) || 1) : 1;
  const skip = limit ? (page - 1) * limit : undefined;
  return { limit, page, skip, defaultPageSize };
}

function paginatedResponse(items, total, page, limit) {
  return {
    items,
    total,
    page,
    pageSize: limit || total,
    totalPages: limit ? Math.max(1, Math.ceil(total / limit)) : 1,
  };
}

module.exports = { parsePagination, paginatedResponse, DEFAULT_PAGE_SIZE };
