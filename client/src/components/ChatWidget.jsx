import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendChatMessage } from '../api/chatbot';
import { formatMoney } from '../utils/format';
import { resolveImageUrl, onImgError } from '../utils/resolveImageUrl';
import { productUrl } from '../utils/productUrl';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useCustomerAuth } from '../context/CustomerAuthContext';

const WELCOME_MESSAGE = {
  role: 'bot',
  text: 'Xin chào! Mình là trợ lý ảo của Điện Máy NK. Bạn cần tìm sản phẩm gì hay có thắc mắc gì không?',
  products: [],
};

function ChatWidget() {
  const { settings } = useSiteSettings();
  const { token } = useCustomerAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    // Most recent bot reply that actually showed products, sent along as
    // context so a short follow-up ("Có hàng sẵn không?" with no product
    // named in it) resolves against what was last discussed instead of an
    // unrelated catalog-wide search. Skips back past replies with no
    // products (e.g. an unrecognized question in between) rather than only
    // looking at the immediately preceding message, which would otherwise
    // silently lose context the moment one reply in the middle came up empty.
    const lastProductMessage = [...messages].reverse().find((m) => m.role === 'bot' && m.products?.length > 0);
    const contextProductIds = (lastProductMessage?.products || []).map((p) => p.id);

    setMessages((prev) => [...prev, { role: 'user', text: trimmed, products: [] }]);
    setInput('');
    setSending(true);

    try {
      const res = await sendChatMessage(trimmed, contextProductIds, token);
      setMessages((prev) => [...prev, { role: 'bot', text: res.reply, products: res.products || [] }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: `Xin lỗi, mình đang gặp sự cố kết nối. Vui lòng gọi hotline ${settings.hotline}.`, products: [] },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 170, right: 30, zIndex: 1000 }}>
      {open && (
        <div
          className="bg-white rounded-4 shadow-lg border mb-3"
          style={{ width: 320, maxHeight: 440, display: 'flex', flexDirection: 'column', position: 'absolute', bottom: 66, right: 0 }}
        >
          <div className="bg-warning text-dark fw-bold rounded-top-4 px-3 py-2 d-flex justify-content-between align-items-center">
            <span><i className="bi bi-robot"></i> Trợ lý Điện Máy NK</span>
            <button type="button" className="btn-close" onClick={() => setOpen(false)}></button>
          </div>

          <div ref={bodyRef} className="flex-grow-1 p-3 overflow-auto" style={{ minHeight: 200 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`mb-3 d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                <div
                  className={`rounded-3 px-3 py-2 small ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                  style={{ maxWidth: '85%' }}
                >
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                  {msg.products.length > 0 && (
                    <div className="mt-2 d-flex flex-column gap-2">
                      {msg.products.map((p) => (
                        <Link
                          key={p.id}
                          to={productUrl(p)}
                          className="d-flex align-items-center gap-2 text-decoration-none text-dark bg-white rounded-2 p-1 border"
                          onClick={() => setOpen(false)}
                        >
                          <img
                            src={resolveImageUrl(p.image)}
                            alt={p.name}
                            onError={onImgError}
                            style={{ width: 40, height: 40, objectFit: 'contain' }}
                          />
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="text-truncate" style={{ fontSize: 12 }}>{p.name}</div>
                            <div className="text-danger fw-bold" style={{ fontSize: 12 }}>{formatMoney(p.price)}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && <div className="text-muted small">Đang trả lời...</div>}
          </div>

          <form onSubmit={handleSend} className="border-top p-2 d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className="btn btn-warning btn-sm fw-bold" disabled={sending}>
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary rounded-circle shadow p-0 d-flex align-items-center justify-content-center overflow-hidden"
        style={{ width: 56, height: 56 }}
        onClick={() => setOpen((v) => !v)}
        title="Chat với trợ lý ảo"
      >
        {open ? (
          <i className="bi bi-x-lg fs-5"></i>
        ) : (
          <img
            src="/assets/images/chatbot-icon.png"
            alt="Trợ lý ảo Điện Máy NK"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
