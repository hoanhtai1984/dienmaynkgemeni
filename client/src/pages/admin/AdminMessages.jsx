import { useEffect, useState } from 'react';
import {
  listAdminContacts,
  updateAdminContactStatus,
  listAdminChatMessages,
  listAdminNewsletter,
} from '../../api/admin';
import { formatDate } from '../../utils/formatDate';
import { exportToExcel } from '../../utils/exportExcel';
import DateRangeFilter from '../../components/DateRangeFilter';
import { resolveDateRange, isWithinRange } from '../../utils/dateRangePresets';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 20;

const CONTACT_SUBJECT_LABEL = {
  TU_VAN: 'Tư vấn sản phẩm',
  BAO_HANH: 'Bảo hành / Sửa chữa',
  DON_HANG: 'Hỏi về đơn hàng',
  KHAC: 'Khác',
};

const CONTACT_STATUS_LABEL = {
  NEW: 'Chưa xử lý',
  RESOLVED: 'Đã xử lý',
};

function ExportPanel({ children, onDownload }) {
  return (
    <div className="bg-white p-4 rounded-3 border mb-3">
      <h6 className="fw-bold mb-3">Bộ lọc xuất Excel</h6>
      <div className="row g-2 align-items-end mb-3">
        {children}
        <div className="col-auto">
          <button type="button" className="btn btn-warning fw-bold" onClick={onDownload}>
            <i className="bi bi-download"></i> Tải về Excel
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactsTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  function reload() {
    setLoading(true);
    listAdminContacts(statusFilter || undefined, { page, limit: PAGE_SIZE })
      .then((res) => {
        setMessages(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [statusFilter, page]);
  useEffect(() => setPage(1), [statusFilter]);

  async function handleToggleStatus(message) {
    await updateAdminContactStatus(message.id, message.status === 'NEW' ? 'RESOLVED' : 'NEW');
    reload();
  }

  async function handleDownload() {
    const { items: allMessages } = await listAdminContacts(statusFilter || undefined);
    const range = resolveDateRange(datePreset, customFrom, customTo);
    const filtered = allMessages.filter((m) => {
      if (!isWithinRange(m.createdAt, range)) return false;
      if (filterSubject && m.subject !== filterSubject) return false;
      return true;
    });

    exportToExcel('lien-he', [
      {
        name: 'Liên hệ',
        rows: filtered.map((m) => ({
          'Người gửi': m.name,
          'Số điện thoại': m.phone,
          'Email': m.email || '',
          'Chủ đề': CONTACT_SUBJECT_LABEL[m.subject] || m.subject,
          'Nội dung': m.message,
          'Trạng thái': CONTACT_STATUS_LABEL[m.status] || m.status,
          'Tài khoản liên kết': m.customer?.email || '',
          'Ngày gửi': formatDate(m.createdAt),
        })),
      },
    ]);
  }

  return (
    <div>
      <div className="d-flex justify-content-end gap-2 mb-3">
        <select
          className="form-select form-select-sm"
          style={{ width: 200 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="NEW">Chưa xử lý</option>
          <option value="RESOLVED">Đã xử lý</option>
        </select>
        <button type="button" className="btn btn-sm btn-outline-success fw-bold" onClick={() => setShowExportPanel((v) => !v)}>
          <i className="bi bi-file-earmark-excel"></i> Xuất Excel
        </button>
      </div>

      {showExportPanel && (
        <ExportPanel onDownload={handleDownload}>
          <div className="col-auto">
            <DateRangeFilter
              label="Ngày gửi"
              preset={datePreset}
              onPresetChange={setDatePreset}
              customFrom={customFrom}
              onCustomFromChange={setCustomFrom}
              customTo={customTo}
              onCustomToChange={setCustomTo}
            />
          </div>
          <div className="col-auto">
            <label className="form-label small fw-bold">Chủ đề</label>
            <select className="form-select form-select-sm" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="">Tất cả</option>
              {Object.entries(CONTACT_SUBJECT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </ExportPanel>
      )}

      <div className="bg-white rounded-3 border">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-5 text-muted">Chưa có tin nhắn liên hệ nào.</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle m-0">
              <thead className="table-light">
                <tr>
                  <th>Người gửi</th>
                  <th>Chủ đề</th>
                  <th>Nội dung</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="fw-bold">
                        {m.name}
                        {m.customer && <span className="badge bg-info text-dark ms-2">Có tài khoản</span>}
                      </div>
                      <div className="text-muted small">{m.phone}{m.email ? ` · ${m.email}` : ''}</div>
                    </td>
                    <td>{CONTACT_SUBJECT_LABEL[m.subject] || m.subject}</td>
                    <td style={{ maxWidth: 320 }}>{m.message}</td>
                    <td>{formatDate(m.createdAt)}</td>
                    <td>
                      <span className={`badge ${m.status === 'NEW' ? 'bg-danger' : 'bg-success'}`}>
                        {CONTACT_STATUS_LABEL[m.status] || m.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-dark" onClick={() => handleToggleStatus(m)}>
                        {m.status === 'NEW' ? 'Đánh dấu đã xử lý' : 'Mở lại'}
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

function ChatbotTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyNeedsHelp, setOnlyNeedsHelp] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    listAdminChatMessages(onlyNeedsHelp, { page, limit: PAGE_SIZE })
      .then((res) => {
        setMessages(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [onlyNeedsHelp, page]);
  useEffect(() => setPage(1), [onlyNeedsHelp]);

  async function handleDownload() {
    const { items: allMessages } = await listAdminChatMessages(onlyNeedsHelp);
    const range = resolveDateRange(datePreset, customFrom, customTo);
    const filtered = allMessages.filter((m) => isWithinRange(m.createdAt, range));

    exportToExcel('chatbot', [
      {
        name: 'Chatbot',
        rows: filtered.map((m) => ({
          'Khách hàng': m.customer ? `${m.customer.name} (${m.customer.email})` : 'Khách vãng lai',
          'Tin nhắn khách': m.message,
          'Trả lời của bot': m.reply,
          'Cần hỗ trợ': m.needsHelp ? 'Có' : 'Không',
          'Thời gian': formatDate(m.createdAt),
        })),
      },
    ]);
  }

  return (
    <div>
      <div className="d-flex justify-content-end align-items-center gap-3 mb-3">
        <div className="form-check d-flex align-items-center gap-1">
          <input
            type="checkbox"
            className="form-check-input"
            id="chatNeedsHelp"
            checked={onlyNeedsHelp}
            onChange={(e) => setOnlyNeedsHelp(e.target.checked)}
          />
          <label className="form-check-label small" htmlFor="chatNeedsHelp">Chỉ hiện cần hỗ trợ</label>
        </div>
        <button type="button" className="btn btn-sm btn-outline-success fw-bold" onClick={() => setShowExportPanel((v) => !v)}>
          <i className="bi bi-file-earmark-excel"></i> Xuất Excel
        </button>
      </div>

      {showExportPanel && (
        <ExportPanel onDownload={handleDownload}>
          <div className="col-auto">
            <DateRangeFilter
              label="Thời gian chat"
              preset={datePreset}
              onPresetChange={setDatePreset}
              customFrom={customFrom}
              onCustomFromChange={setCustomFrom}
              customTo={customTo}
              onCustomToChange={setCustomTo}
            />
          </div>
        </ExportPanel>
      )}

      <div className="bg-white rounded-3 border">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-5 text-muted">Chưa có lịch sử chat nào.</div>
        ) : (
          <ul className="list-unstyled m-0 p-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`mb-2 p-2 rounded border ${m.needsHelp ? 'border-danger bg-danger bg-opacity-10' : ''}`}
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <span className="fw-bold small">
                    {m.customer ? `${m.customer.name} (${m.customer.email})` : 'Khách vãng lai'}
                  </span>
                  <span className="text-muted small">{formatDate(m.createdAt)}</span>
                </div>
                <div><strong>Khách:</strong> {m.message}</div>
                <div><strong>Bot:</strong> {m.reply}</div>
                {m.needsHelp && <span className="badge bg-danger mt-1">Cần hỗ trợ</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function NewsletterTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    listAdminNewsletter({ page, limit: PAGE_SIZE })
      .then((res) => {
        setSubs(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  async function handleDownload() {
    const { items: allSubs } = await listAdminNewsletter();
    const range = resolveDateRange(datePreset, customFrom, customTo);
    const filtered = allSubs.filter((s) => isWithinRange(s.subscribedAt, range));

    exportToExcel('dang-ky-nhan-tin', [
      {
        name: 'Đăng ký nhận tin',
        rows: filtered.map((s) => ({
          'Email': s.email,
          'Tài khoản liên kết': s.customer ? s.customer.name : '',
          'Ngày đăng ký': formatDate(s.subscribedAt),
        })),
      },
    ]);
  }

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-sm btn-outline-success fw-bold" onClick={() => setShowExportPanel((v) => !v)}>
          <i className="bi bi-file-earmark-excel"></i> Xuất Excel
        </button>
      </div>

      {showExportPanel && (
        <ExportPanel onDownload={handleDownload}>
          <div className="col-auto">
            <DateRangeFilter
              label="Ngày đăng ký"
              preset={datePreset}
              onPresetChange={setDatePreset}
              customFrom={customFrom}
              onCustomFromChange={setCustomFrom}
              customTo={customTo}
              onCustomToChange={setCustomTo}
            />
          </div>
        </ExportPanel>
      )}

      <div className="bg-white rounded-3 border">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : subs.length === 0 ? (
          <div className="text-center py-5 text-muted">Chưa có ai đăng ký nhận tin.</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle m-0">
              <thead className="table-light">
                <tr>
                  <th>Email</th>
                  <th>Tài khoản liên kết</th>
                  <th>Ngày đăng ký</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id}>
                    <td>{s.email}</td>
                    <td>{s.customer ? s.customer.name : <span className="text-muted">Chưa có tài khoản</span>}</td>
                    <td>{formatDate(s.subscribedAt)}</td>
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

function AdminMessages() {
  const [tab, setTab] = useState('contacts');

  return (
    <div>
      <h3 className="fw-bold mb-4">Tin nhắn khách hàng</h3>
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link${tab === 'contacts' ? ' active' : ''}`} onClick={() => setTab('contacts')}>
            Liên hệ
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link${tab === 'chatbot' ? ' active' : ''}`} onClick={() => setTab('chatbot')}>
            Chatbot
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link${tab === 'newsletter' ? ' active' : ''}`} onClick={() => setTab('newsletter')}>
            Đăng ký nhận tin
          </button>
        </li>
      </ul>

      {tab === 'contacts' && <ContactsTab />}
      {tab === 'chatbot' && <ChatbotTab />}
      {tab === 'newsletter' && <NewsletterTab />}
    </div>
  );
}

export default AdminMessages;
