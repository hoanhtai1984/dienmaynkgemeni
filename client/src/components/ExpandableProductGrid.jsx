import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

// Hiển thị initialCount sản phẩm đầu tiên. "Xem Thêm" nhân đôi số lượng hiển
// thị mỗi lần nhấn (10 -> 20 -> 40 ...), "Thu Gọn" chia đôi ngược lại đến khi
// về initialCount. Reset về initialCount khi danh sách sản phẩm thay đổi
// (đổi bộ lọc/danh mục).
function ExpandableProductGrid({
  products,
  initialCount = 10,
  gridClassName = 'row g-3 row-cols-2 row-cols-md-3 row-cols-lg-5',
  itemClassName = 'col',
  // Cho phép dùng thẻ sản phẩm khác ProductCard (vd FlashSaleCard) - thẻ tự
  // lo phần className cột của chính nó nên không bọc thêm itemClassName nữa.
  renderItem,
}) {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    setSteps(0);
  }, [products]);

  if (products.length === 0) return null;

  const visibleCount = Math.min(initialCount * 2 ** steps, products.length);
  const visible = products.slice(0, visibleCount);
  const canExpand = visibleCount < products.length;
  const canCollapse = steps > 0;

  return (
    <>
      <div className={gridClassName}>
        {renderItem
          ? visible.map((p) => renderItem(p))
          : visible.map((p) => (
              <div className={itemClassName} key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
      </div>
      {(canExpand || canCollapse) && (
        <div className="text-center mt-4 d-flex justify-content-center gap-2">
          {canExpand && (
            <button
              type="button"
              className="btn btn-outline-dark rounded-pill px-4 fw-bold"
              onClick={() => setSteps((s) => s + 1)}
            >
              Xem Thêm <i className="bi bi-chevron-down"></i>
            </button>
          )}
          {canCollapse && (
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill px-4 fw-bold"
              onClick={() => setSteps((s) => Math.max(0, s - 1))}
            >
              Thu Gọn <i className="bi bi-chevron-up"></i>
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default ExpandableProductGrid;
