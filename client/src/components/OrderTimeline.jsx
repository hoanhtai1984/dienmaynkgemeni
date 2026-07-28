function OrderTimeline({ history, statusLabels }) {
  if (!history || history.length === 0) return null;

  function meta(status) {
    return statusLabels.find((s) => s.value === status) || statusLabels[0];
  }

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
      {history.map((entry, i) => (
        <div key={entry.id} className="d-flex align-items-center gap-2">
          {i > 0 && <i className="bi bi-arrow-right text-muted small"></i>}
          <div className="text-center">
            <span className={`badge ${meta(entry.status).badge}`}>{meta(entry.status).label}</span>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
              {new Date(entry.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrderTimeline;
