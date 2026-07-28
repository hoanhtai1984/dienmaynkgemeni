// Dữ liệu hành chính Việt Nam sau sáp nhập 01/07/2025 (Nghị quyết 202/2025/QH15) -
// chỉ còn 2 cấp Tỉnh/Thành phố -> Phường/Xã (không còn cấp Quận/Huyện). Nguồn:
// gói vietnam-address-database (MIT), rút gọn lại còn đúng field cần dùng để
// giảm dung lượng gửi xuống client.
const raw = require('vietnam-address-database');

const tables = raw.filter((x) => x.type === 'table');
const rawProvinces = tables.find((t) => t.name === 'provinces').data;
const rawWards = tables.find((t) => t.name === 'wards').data;

const provinces = rawProvinces.map((p) => ({ code: p.province_code, name: p.name }));
const wards = rawWards.map((w) => ({ code: w.ward_code, name: w.name, provinceCode: w.province_code }));

const provinceByCode = new Map(provinces.map((p) => [p.code, p]));
const wardByCode = new Map(wards.map((w) => [w.code, w]));

module.exports = { provinces, wards, provinceByCode, wardByCode };
