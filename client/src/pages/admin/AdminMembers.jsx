import { useEffect, useState } from 'react';
import {
  listAdminMembers,
  createAdminMember,
  deleteAdminMember,
  resetAdminMemberPassword,
  getAdminMemberActivity,
} from '../../api/admin';
import { exportToExcel } from '../../utils/exportExcel';
import DateRangeFilter from '../../components/DateRangeFilter';
import { resolveDateRange } from '../../utils/dateRangePresets';
import { showToast } from '../../utils/toast';

const ROLE_LABEL = { OWNER: 'Chủ tài khoản', MANAGER: 'Quản lý', STAFF: 'Nhân viên' };
const ACTION_LABEL = { CREATE: 'Thêm mới', UPDATE: 'Cập nhật', DELETE: 'Xóa' };
const ENTITY_LABEL = { PRODUCT: 'Sản phẩm', ORDER: 'Đơn hàng', MEMBER: 'Thành viên' };

const EMPTY_FORM = { name: '', email: '', role: 'STAFF', password: '' };

function toDateParam(date) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

function AdminMembers() {
  const [tab, setTab] = useState('members');

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [resettingId, setResettingId] = useState(null);

  const [memberFilter, setMemberFilter] = useState('');
  const [datePreset, setDatePreset] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [logs, setLogs] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);

  function reload() {
    setLoading(true);
    listAdminMembers()
      .then(setMembers)
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  useEffect(() => {
    if (tab !== 'activity') return;
    setLogsLoading(true);
    const range = resolveDateRange(datePreset, customFrom, customTo);
    getAdminMemberActivity({
      memberId: memberFilter || undefined,
      from: toDateParam(range?.from),
      to: toDateParam(range?.to),
    })
      .then(setLogs)
      .finally(() => setLogsLoading(false));
  }, [tab, memberFilter, datePreset, customFrom, customTo]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password.trim()) payload.password = form.password.trim();
      const result = await createAdminMember(payload);
      // result.password chỉ có khi hệ thống tự sinh (để trống ô mật khẩu) -
      // nếu OWNER tự đặt thì server không trả lại, không cần hiện banner.
      if (result.password) {
        setCreatedResult({ name: result.name, password: result.password, mode: 'created' });
      } else {
        showToast(`Đã tạo thành viên "${result.name}" với mật khẩu bạn đã đặt`);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(member) {
    if (!window.confirm(`Xóa thành viên "${member.name}" (${member.email})? Hành động này không thể hoàn tác.`)) return;
    setDeletingId(member.id);
    try {
      await deleteAdminMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } finally {
      setDeletingId(null);
    }
  }

  // Cho phép admin gốc lấy lại quyền truy cập bất cứ lúc nào nếu thành viên
  // quên mật khẩu hoặc nghi bị lộ - không cần biết mật khẩu cũ. Để trống ô
  // nhập (OK) thì hệ thống tự sinh; hủy (Cancel) thì bỏ qua toàn bộ thao tác.
  async function handleResetPassword(member) {
    const customPassword = window.prompt(
      `Đặt lại mật khẩu cho "${member.name}" (${member.email}).\nĐể trống rồi bấm OK để hệ thống tự sinh mật khẩu mạnh, hoặc tự nhập mật khẩu mới (>=12 ký tự, đủ hoa/thường/số/ký tự đặc biệt).\nMật khẩu cũ sẽ không còn dùng được và phiên đăng nhập hiện tại của họ sẽ bị đăng xuất.`
    );
    if (customPassword === null) return;
    setResettingId(member.id);
    try {
      const result = await resetAdminMemberPassword(member.id, customPassword.trim() || undefined);
      if (result.password) {
        setCreatedResult({ name: member.name, password: result.password, mode: 'reset' });
      } else {
        showToast(`Đã đặt lại mật khẩu cho "${member.name}" với mật khẩu bạn đã đặt`);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
    } finally {
      setResettingId(null);
    }
  }

  function handleExportLogs() {
    if (!logs) return;
    exportToExcel('nhat-ky-hoat-dong', [
      {
        name: 'Nhật ký hoạt động',
        rows: logs.map((l) => ({
          'Thời gian': new Date(l.createdAt).toLocaleString('vi-VN'),
          'Thành viên': l.adminName,
          Email: l.adminEmail,
          'Hành động': ACTION_LABEL[l.action] || l.action,
          'Đối tượng': ENTITY_LABEL[l.entityType] || l.entityType,
          'Chi tiết': l.detail,
        })),
      },
    ]);
  }

  async function handleCopyPassword() {
    if (!createdResult) return;
    await navigator.clipboard.writeText(createdResult.password);
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold m-0">Thành viên quản trị</h3>
        {tab === 'members' && (
          <button type="button" className="btn btn-warning fw-bold rounded-pill px-3" onClick={() => { setShowForm((v) => !v); setError(''); }}>
            <i className="bi bi-person-plus"></i> Thêm thành viên
          </button>
        )}
      </div>

      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button type="button" className={`nav-link ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
            Danh sách thành viên
          </button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')}>
            Nhật ký hoạt động
          </button>
        </li>
      </ul>

      {createdResult && (
        <div className="alert alert-success">
          <p className="fw-bold mb-2">
            <i className="bi bi-check-circle"></i>{' '}
            {createdResult.mode === 'reset'
              ? `Đã đặt lại mật khẩu cho "${createdResult.name}" thành công.`
              : `Đã tạo thành viên "${createdResult.name}" thành công.`}
          </p>
          <p className="mb-2">
            Mật khẩu đăng nhập (chỉ hiển thị <strong>một lần duy nhất</strong>, hãy sao chép và gửi cho thành viên qua kênh riêng):
          </p>
          <div className="d-flex align-items-center gap-2 mb-2">
            <code className="bg-white border rounded px-3 py-2 fs-5">{createdResult.password}</code>
            <button type="button" className="btn btn-sm btn-outline-dark" onClick={handleCopyPassword}>
              <i className="bi bi-clipboard"></i> Sao chép
            </button>
          </div>
          <button type="button" className="btn btn-sm btn-outline-success" onClick={() => setCreatedResult(null)}>
            Đã lưu, đóng thông báo này
          </button>
        </div>
      )}

      {tab === 'members' && (
        <>
          {showForm && (
            <div className="bg-white p-4 rounded-3 border mb-4">
              <h6 className="fw-bold mb-3">Thêm thành viên mới</h6>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Họ tên *</label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Vai trò *</label>
                    <select
                      className="form-select"
                      value={form.role}
                      onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="STAFF">Nhân viên (Sản phẩm, Đơn hàng, Khách hàng, Tin nhắn, Báo cáo, Tin tức)</option>
                      <option value="MANAGER">Quản lý (toàn quyền trừ Thành viên)</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Mật khẩu (tùy chọn)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Để trống để hệ thống tự sinh mật khẩu mạnh"
                  />
                  <p className="text-muted small mb-0 mt-1">
                    Nếu tự nhập, mật khẩu phải có ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                    Để trống thì hệ thống tự sinh và chỉ hiển thị một lần sau khi tạo.
                  </p>
                </div>
                <button type="submit" className="btn btn-warning fw-bold" disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Tạo thành viên'}
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-3 border">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status"></div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle m-0">
                  <thead className="table-light">
                    <tr>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                      <th>Ngày tạo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{m.email}</td>
                        <td>
                          <span className={`badge ${m.role === 'OWNER' ? 'bg-dark' : m.role === 'MANAGER' ? 'bg-primary' : 'bg-secondary'}`}>
                            {ROLE_LABEL[m.role] || m.role}
                          </span>
                        </td>
                        <td>{new Date(m.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="text-end">
                          {m.role !== 'OWNER' && (
                            <div className="d-flex gap-2 justify-content-end">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleResetPassword(m)}
                                disabled={resettingId === m.id}
                              >
                                <i className="bi bi-key"></i> {resettingId === m.id ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(m)}
                                disabled={deletingId === m.id}
                              >
                                <i className="bi bi-trash3"></i> Xóa
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'activity' && (
        <div>
          <div className="bg-white p-4 rounded-3 border mb-4">
            <div className="row g-2 align-items-end mb-3">
              <div className="col-auto">
                <label className="form-label small fw-bold">Thành viên</label>
                <select className="form-select form-select-sm" value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}>
                  <option value="">Tất cả thành viên</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({ROLE_LABEL[m.role] || m.role})</option>
                  ))}
                </select>
              </div>
              <div className="col-auto">
                <DateRangeFilter
                  label="Khoảng thời gian"
                  preset={datePreset}
                  onPresetChange={setDatePreset}
                  customFrom={customFrom}
                  onCustomFromChange={setCustomFrom}
                  customTo={customTo}
                  onCustomToChange={setCustomTo}
                />
              </div>
              <div className="col-auto">
                <button type="button" className="btn btn-warning fw-bold" onClick={handleExportLogs} disabled={!logs || logs.length === 0}>
                  <i className="bi bi-download"></i> Xuất Excel
                </button>
              </div>
            </div>
            <p className="text-muted small mb-0">
              {logsLoading ? 'Đang tải...' : logs ? `Tìm thấy ${logs.length} hoạt động trong khoảng đã chọn.` : ''}
            </p>
          </div>

          <div className="bg-white rounded-3 border">
            {logsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status"></div>
              </div>
            ) : !logs || logs.length === 0 ? (
              <p className="text-muted p-4 m-0">Không có hoạt động nào trong khoảng thời gian này.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle m-0">
                  <thead className="table-light">
                    <tr>
                      <th>Thời gian</th>
                      <th>Thành viên</th>
                      <th>Hành động</th>
                      <th>Đối tượng</th>
                      <th>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td className="text-nowrap">{new Date(l.createdAt).toLocaleString('vi-VN')}</td>
                        <td>{l.adminName}</td>
                        <td>{ACTION_LABEL[l.action] || l.action}</td>
                        <td>{ENTITY_LABEL[l.entityType] || l.entityType}</td>
                        <td>{l.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMembers;
