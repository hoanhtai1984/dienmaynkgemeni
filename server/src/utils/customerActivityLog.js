const prisma = require('../lib/prisma');

// Ghi nhật ký khách hàng tự thay đổi hồ sơ/xoá tài khoản - khác
// logAdminActivity (đó là hành động của ADMIN lên đối tượng khác, đây là
// khách hàng tự thao tác trên chính mình). Lưu kèm tên/email tại thời điểm
// thao tác để admin vẫn đọc được đầy đủ trong báo cáo dù tài khoản đã bị xoá
// mềm sau đó. Không throw nếu ghi log lỗi - hành động chính (đổi hồ sơ/xoá
// tài khoản) không nên bị chặn chỉ vì audit log gặp sự cố.
async function logCustomerActivity(customer, { action, detail }) {
  try {
    await prisma.customerActivityLog.create({
      data: {
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        action,
        detail,
      },
    });
  } catch (err) {
    console.error('Ghi nhật ký khách hàng thất bại:', err.message);
  }
}

module.exports = { logCustomerActivity };
