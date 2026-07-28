const prisma = require('../lib/prisma');
const { encryptSecret } = require('../utils/secretCrypto');

function serialize(settings) {
  return {
    smtpHost: settings?.smtpHost || '',
    smtpPort: settings?.smtpPort || '',
    smtpSecure: settings?.smtpSecure || false,
    smtpUser: settings?.smtpUser || '',
    // Không bao giờ trả mật khẩu thật ra ngoài (kể cả cho admin) - chỉ báo
    // đã lưu hay chưa để form biết hiện placeholder phù hợp.
    smtpPassSet: !!settings?.smtpPass,
    mailFrom: settings?.mailFrom || '',
  };
}

async function get(req, res) {
  const settings = await prisma.mailSettings.findUnique({ where: { id: 1 } });
  res.json(serialize(settings));
}

async function update(req, res) {
  const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, mailFrom } = req.body;

  const current = await prisma.mailSettings.findUnique({ where: { id: 1 } });

  const data = {
    smtpHost: smtpHost?.trim() || null,
    smtpPort: smtpPort ? Number(smtpPort) : null,
    smtpSecure: !!smtpSecure,
    smtpUser: smtpUser?.trim() || null,
    mailFrom: mailFrom?.trim() || null,
    // Để trống ô mật khẩu = giữ nguyên mật khẩu đã lưu trước đó, không ghi
    // đè bằng rỗng - vì GET không bao giờ trả mật khẩu thật nên ô này luôn
    // trống khi mở form, admin chỉ cần điền lại khi thật sự muốn đổi. Mã hoá
    // trước khi lưu - trước đây lưu thẳng dạng văn bản, xem secretCrypto.js.
    smtpPass: smtpPass?.trim() ? encryptSecret(smtpPass.trim()) : current?.smtpPass || null,
  };

  const settings = await prisma.mailSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  res.json(serialize(settings));
}

module.exports = { get, update };
