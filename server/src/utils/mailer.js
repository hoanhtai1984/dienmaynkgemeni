const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');
const { decryptSecret } = require('./secretCrypto');

// Ưu tiên cấu hình lưu trong DB (admin tự điền ở /admin/settings, áp dụng
// ngay không cần deploy lại) - nếu chưa điền thì rơi về biến môi trường
// SMTP_*/.env (cách cấu hình cũ), rồi rơi về null (in link/nội dung ra
// console) nếu cả 2 đều chưa có. Đọc lại DB mỗi lần gửi (không cache) vì
// tần suất gửi email của site này rất thấp (đăng ký, quên mật khẩu).
async function getMailConfig() {
  const db = await prisma.mailSettings.findUnique({ where: { id: 1 } }).catch(() => null);
  if (db?.smtpHost && db?.smtpUser && db?.smtpPass) {
    return {
      host: db.smtpHost,
      port: db.smtpPort || 587,
      secure: db.smtpSecure,
      auth: { user: db.smtpUser, pass: decryptSecret(db.smtpPass) },
      from: db.mailFrom || process.env.MAIL_FROM || 'Điện Máy NK <no-reply@dienmaynk.vn>',
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      from: process.env.MAIL_FROM || 'Điện Máy NK <no-reply@dienmaynk.vn>',
    };
  }

  return null;
}

async function sendMail({ to, subject, html }) {
  const config = await getMailConfig();
  if (!config) return false;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({ from: config.from, to, subject, html });
  return true;
}

// Chưa cấu hình SMTP (vd: máy dev) thì in link ra console để tự test, không
// chặn luồng quên mật khẩu. Khi deploy thật, khai báo SMTP trong /admin/settings
// (ưu tiên) hoặc SMTP_HOST/SMTP_USER/SMTP_PASS trong .env để gửi email thật.
async function sendPasswordResetEmail(toEmail, resetLink) {
  const sent = await sendMail({
    to: toEmail,
    subject: 'Đặt lại mật khẩu - Điện Máy NK',
    html: `
      <p>Xin chào,</p>
      <p>Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản Điện Máy NK gắn với email này.</p>
      <p><a href="${resetLink}">Nhấn vào đây để đặt lại mật khẩu</a> (link có hiệu lực trong 1 giờ).</p>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `,
  });
  if (!sent) console.log(`[mailer] SMTP chưa cấu hình - link đặt lại mật khẩu cho ${toEmail}: ${resetLink}`);
}

async function sendWelcomeEmail(toEmail, name) {
  const sent = await sendMail({
    to: toEmail,
    subject: 'Chào mừng bạn đến với Điện Máy NK!',
    html: `
      <p>Xin chào ${name},</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại Điện Máy NK. Từ giờ bạn có thể đăng nhập để theo dõi đơn hàng, lưu thông tin giao hàng và nhận các ưu đãi dành riêng cho thành viên.</p>
      <p>Nếu bạn không phải là người thực hiện đăng ký này, vui lòng bỏ qua email hoặc liên hệ với chúng tôi.</p>
      <p>Chúc bạn mua sắm vui vẻ!</p>
    `,
  });
  if (!sent) console.log(`[mailer] SMTP chưa cấu hình - email chào mừng cho ${toEmail} (${name})`);
}

function money(n) {
  return `${Number(n || 0).toLocaleString('vi-VN')}đ`;
}

const ORDER_STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

function orderItemsHtml(order) {
  const rows = order.items
    .map(
      (it) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${it.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">x${it.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${money(it.price * it.quantity)}</td>
      </tr>`
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;">${rows}</table>`;
}

// Gửi khi vừa đặt hàng thành công - chỉ gửi nếu khách có nhập email (checkout
// là guest-checkout, email không bắt buộc). Best-effort: lỗi gửi mail không
// làm hỏng đơn hàng đã tạo thành công (transaction DB đã commit trước đó).
async function sendOrderConfirmationEmail(order) {
  if (!order.customerEmail) return;
  const sent = await sendMail({
    to: order.customerEmail,
    subject: `Xác nhận đơn hàng #${order.code} - Điện Máy NK`,
    html: `
      <p>Xin chào ${order.customerName},</p>
      <p>Cảm ơn bạn đã đặt hàng tại Điện Máy NK. Đơn hàng <strong>#${order.code}</strong> của bạn đã được ghi nhận.</p>
      ${orderItemsHtml(order)}
      <p>Tạm tính: ${money(order.total - order.shippingFee + order.discountAmount)}</p>
      <p>Phí vận chuyển: ${money(order.shippingFee)}</p>
      ${order.discountAmount ? `<p>Giảm giá${order.couponCode ? ` (${order.couponCode})` : ''}: -${money(order.discountAmount)}</p>` : ''}
      <p><strong>Tổng thanh toán: ${money(order.total)}</strong></p>
      <p>Giao đến: ${order.address}</p>
      <p>Chúng tôi sẽ liên hệ với bạn qua số điện thoại ${order.phone} để xác nhận đơn hàng.</p>
    `,
  });
  if (!sent) console.log(`[mailer] SMTP chưa cấu hình - xác nhận đơn hàng #${order.code} cho ${order.customerEmail}`);
}

// Gửi khi admin đổi trạng thái đơn hàng - chỉ gửi nếu khách có để lại email.
async function sendOrderStatusUpdateEmail(order, newStatus) {
  if (!order.customerEmail) return;
  const label = ORDER_STATUS_LABEL[newStatus] || newStatus;
  const sent = await sendMail({
    to: order.customerEmail,
    subject: `Đơn hàng #${order.code} - ${label} - Điện Máy NK`,
    html: `
      <p>Xin chào ${order.customerName},</p>
      <p>Đơn hàng <strong>#${order.code}</strong> của bạn vừa được cập nhật trạng thái: <strong>${label}</strong>.</p>
      ${orderItemsHtml(order)}
      <p><strong>Tổng thanh toán: ${money(order.total)}</strong></p>
      <p>Nếu có thắc mắc, vui lòng liên hệ hotline của chúng tôi.</p>
    `,
  });
  if (!sent) console.log(`[mailer] SMTP chưa cấu hình - cập nhật trạng thái đơn hàng #${order.code} (${label}) cho ${order.customerEmail}`);
}

module.exports = { sendPasswordResetEmail, sendWelcomeEmail, sendOrderConfirmationEmail, sendOrderStatusUpdateEmail };
