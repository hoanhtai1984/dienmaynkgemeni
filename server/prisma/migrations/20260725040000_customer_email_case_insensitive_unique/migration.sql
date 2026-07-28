-- Chặn trùng email (không phân biệt hoa/thường) ở tầng DB cho tài khoản còn
-- hoạt động, đóng race condition khi 2 request đăng ký/liên kết OAuth cùng
-- email tới gần như đồng thời (kiểm tra ở tầng ứng dụng không đủ - cả 2 có
-- thể cùng vượt qua findFirst trước khi request nào kịp create). Cột sinh tự
-- động (generated) trả NULL khi tài khoản đã bị xoá mềm - MySQL cho phép
-- nhiều dòng cùng NULL trong unique index nên không chặn việc đăng ký lại
-- bằng email của tài khoản đã xoá (giữ đúng hành vi hiện tại).
-- Cột này không khai báo trong schema.prisma vì Prisma chưa hỗ trợ tốt
-- generated column kiểu CASE - chỉ tồn tại ở DB, Prisma Client không biết và
-- không cần biết tới nó.
ALTER TABLE Customer
  ADD COLUMN emailActiveKey VARCHAR(191)
  GENERATED ALWAYS AS (CASE WHEN deletedAt IS NULL THEN LOWER(email) ELSE NULL END) STORED;

ALTER TABLE Customer
  ADD UNIQUE INDEX Customer_emailActiveKey_key (emailActiveKey);
