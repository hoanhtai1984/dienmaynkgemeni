import { useEffect, useState } from 'react';
import { getLatestSalesReport, listAdminSalesReports } from '../../api/admin';
import { formatMoney } from '../../utils/format';
import { exportToExcel } from '../../utils/exportExcel';
import DateRangeFilter from '../../components/DateRangeFilter';
import { resolveDateRange } from '../../utils/dateRangePresets';

function toDateParam(date) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

function AdminReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [datePreset, setDatePreset] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    getLatestSalesReport()
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  // Tải trước dữ liệu mỗi khi bộ lọc đổi (không phải lúc bấm "Tải về") - nút
  // tải về chỉ còn việc gọi exportToExcel đồng bộ, tránh bị trình duyệt chặn
  // âm thầm do mất "user activation" sau một await ngay trong lúc xử lý click.
  useEffect(() => {
    if (!showExportPanel) return;
    setHistoryLoading(true);
    setHistoryData(null);
    const range = resolveDateRange(datePreset, customFrom, customTo);
    listAdminSalesReports(toDateParam(range?.from), toDateParam(range?.to))
      .then(setHistoryData)
      .finally(() => setHistoryLoading(false));
  }, [showExportPanel, datePreset, customFrom, customTo]);

  function handleDownload() {
    if (!historyData) return;
    exportToExcel('bao-cao-ban-hang', [
      {
        name: 'Báo cáo theo ngày',
        rows: historyData.map((r) => ({
          'Ngày báo cáo': new Date(r.reportDate).toLocaleDateString('vi-VN'),
          'Số đơn hàng': r.totalOrders,
          'Doanh thu': r.totalRevenue,
        })),
      },
    ]);
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-warning" role="status"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">Báo cáo bán hàng</h3>
        <button type="button" className="btn btn-outline-success fw-bold" onClick={() => setShowExportPanel((v) => !v)}>
          <i className="bi bi-file-earmark-excel"></i> Xuất Excel
        </button>
      </div>

      {showExportPanel && (
        <div className="bg-white p-4 rounded-3 border mb-4">
          <h6 className="fw-bold mb-3">Bộ lọc xuất Excel (báo cáo theo ngày)</h6>
          <div className="row g-2 align-items-end mb-3">
            <div className="col-auto">
              <DateRangeFilter
                label="Khoảng ngày báo cáo"
                preset={datePreset}
                onPresetChange={setDatePreset}
                customFrom={customFrom}
                onCustomFromChange={setCustomFrom}
                customTo={customTo}
                onCustomToChange={setCustomTo}
              />
            </div>
            <div className="col-auto">
              <button type="button" className="btn btn-warning fw-bold" onClick={handleDownload} disabled={!historyData}>
                <i className="bi bi-download"></i> {historyLoading ? 'Đang tải...' : 'Tải về Excel'}
              </button>
            </div>
          </div>
          <p className="text-muted small mb-0">
            {historyData ? `Tìm thấy ${historyData.length} ngày có báo cáo trong khoảng đã chọn.` : ''}
          </p>
        </div>
      )}

      {!report ? (
        <div className="bg-white rounded-3 border p-4 text-muted">
          Chưa có báo cáo nào. Báo cáo được AI service tự động tạo mỗi 30 phút (xem <code>ai-service/</code>).
        </div>
      ) : (
        <>
          <p className="text-muted small mb-4">
            Ngày báo cáo: <strong>{new Date(report.reportDate).toLocaleDateString('vi-VN')}</strong> · Cập nhật lúc{' '}
            {new Date(report.generatedAt).toLocaleString('vi-VN')}
          </p>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="bg-white rounded-3 border p-4">
                <div className="text-muted small mb-1">Đơn hàng hôm nay</div>
                <div className="fs-2 fw-bold">{report.totalOrders}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="bg-white rounded-3 border p-4">
                <div className="text-muted small mb-1">Doanh thu hôm nay</div>
                <div className="fs-2 fw-bold text-danger">{formatMoney(report.totalRevenue)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3 border p-4">
            <h6 className="fw-bold mb-3">Sản phẩm bán chạy nhất</h6>
            {report.topProducts.length === 0 ? (
              <p className="text-muted small m-0">Chưa có dữ liệu.</p>
            ) : (
              <table className="table table-sm m-0">
                <tbody>
                  {report.topProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td className="text-muted">{p.brand}</td>
                      <td className="text-end fw-bold">{formatMoney(p.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminReports;
