# Điện Máy NK

Website bán điện máy - full-stack rewrite từ site tĩnh HTML/CSS/JS ban đầu (vẫn giữ nguyên ở thư mục gốc để tham khảo) sang **React + Node.js/Express + MySQL (Prisma) + Python (FastAPI)**.

## Cấu trúc repo

```
dienmaynk/
├── (các file .html + assets/ ở gốc)   Site tĩnh cũ — KHÔNG chỉnh sửa, chỉ để tham khảo/đối chiếu
├── client/                             React + Vite (giao diện người dùng + trang quản trị)
├── server/                             Express + Prisma + MySQL (REST API)
└── ai-service/                         FastAPI + APScheduler (chatbot, gợi ý, cập nhật giá, báo cáo)
```

## Chạy local

Yêu cầu: Node.js 20+, Python 3.11+, MySQL đang chạy (khuyến nghị [Laragon](https://laragon.org/download) trên Windows).

**1. Server (Node/Express):**

```bash
cd server
npm install
cp .env.example .env   # rồi sửa DATABASE_URL cho khớp MySQL local
npx prisma migrate dev
npx prisma db seed
npm run dev             # http://localhost:4000
```

Tài khoản admin mặc định sau khi seed: lấy từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `server/.env`.

Chạy test tự động (đăng ký/đăng nhập/đăng xuất, đặt hàng, rate limiting) bằng `npm test` trong `server/` — tự tạo và seed một database `dienmaynk_test` riêng, không đụng tới database dev.

**2. AI service (Python/FastAPI):**

```bash
cd ai-service
python -m venv venv
venv\Scripts\pip install -r requirements.txt   # macOS/Linux: venv/bin/pip
cp .env.example .env    # DATABASE_URL dùng driver mysql+pymysql://, trỏ cùng database với server/.env
venv\Scripts\python -m uvicorn app.main:app --port 8000 --reload   # http://localhost:8000
```

Khi khởi động, service tự chạy 1 lần các job (cập nhật giá, phân tích bán hàng, gợi ý sản phẩm), sau đó lặp lại theo lịch (xem `app/scheduler.py`). Không cần chạy `ai-service` để dùng phần còn lại của web — nó chỉ phục vụ chatbot + dữ liệu gợi ý/báo cáo, các phần khác của site vẫn hoạt động bình thường nếu tắt service này.

**3. Client (React):**

```bash
cd client
npm install
npm run dev              # http://localhost:5173
```

## Stack

- **Frontend**: React 19 + Vite + React Router + Bootstrap 5
- **Backend**: Express 5 + Prisma 6 + JWT (admin only)
- **Database**: MySQL
- **AI service**: Python + FastAPI + APScheduler + SQLAlchemy — chatbot dựa trên rule/từ khoá + tra cứu sản phẩm thật (chưa gắn LLM ngoài), gợi ý sản phẩm, tự động cập nhật giá theo lượt bán, phân tích doanh thu hàng ngày

## Deploy production

Xem [DEPLOY.md](DEPLOY.md).

## Tài liệu khác

- [HUONG-DAN-ANH-SAN-PHAM.md](HUONG-DAN-ANH-SAN-PHAM.md) — quy ước đặt ảnh sản phẩm (site tĩnh cũ)
- [HUONG-DAN-KET-NOI-DON-HANG.md](HUONG-DAN-KET-NOI-DON-HANG.md) — hướng dẫn Google Sheets webhook (site tĩnh cũ, **không còn dùng** ở bản React — đơn hàng nay lưu thẳng vào MySQL qua `POST /api/orders`)
