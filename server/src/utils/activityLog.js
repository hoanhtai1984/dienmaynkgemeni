const prisma = require('../lib/prisma');

// Ghi nhật ký hành động của thành viên quản trị - lưu kèm tên/email tại thời
// điểm thao tác (xem AdminActivityLog trong schema) để báo cáo vẫn đọc được
// dù tài khoản đó sau này bị xóa. Không throw nếu ghi log lỗi - hành động
// chính của người dùng không nên bị chặn chỉ vì audit log gặp sự cố.
async function logAdminActivity(req, { action, entityType, entityId = null, detail }) {
  try {
    await prisma.adminActivityLog.create({
      data: {
        adminId: req.admin.id,
        adminName: req.admin.name,
        adminEmail: req.admin.email,
        action,
        entityType,
        entityId,
        detail,
      },
    });
  } catch (err) {
    console.error('Ghi nhật ký admin thất bại:', err.message);
  }
}

module.exports = { logAdminActivity };
