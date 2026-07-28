-- AlterTable
ALTER TABLE `SiteSettings` ADD COLUMN `coreFeatures` JSON NULL;

-- Backfill existing row with the 4 items currently hardcoded on the homepage
UPDATE `SiteSettings`
SET `coreFeatures` = JSON_ARRAY(
  JSON_OBJECT('title', 'Giao Hàng Siêu Tốc', 'description', 'Nội thành TP.HCM trong 2 giờ'),
  JSON_OBJECT('title', 'Chính Hãng 100%', 'description', 'Bảo hành điện tử toàn quốc'),
  JSON_OBJECT('title', 'Lỗi Là Đổi Mới', 'description', 'Đổi trả uy tín trong 35 ngày đầu'),
  JSON_OBJECT('title', 'Trả Góp Lãi Suất 0%', 'description', 'Thủ tục nhanh, hỗ trợ qua thẻ')
)
WHERE `coreFeatures` IS NULL;

ALTER TABLE `SiteSettings` MODIFY `coreFeatures` JSON NOT NULL;
