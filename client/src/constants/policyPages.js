import { DEFAULT_SECTIONS as BAO_HANH } from '../pages/info/ChinhSachBaoHanh';
import { DEFAULT_SECTIONS as DOI_TRA } from '../pages/info/ChinhSachDoiTra';
import { DEFAULT_SECTIONS as VAN_CHUYEN } from '../pages/info/VanChuyen';
import { DEFAULT_SECTIONS as THANH_TOAN } from '../pages/info/ChinhSachThanhToan';
import { DEFAULT_SECTIONS as KIEM_HANG } from '../pages/info/ChinhSachKiemHang';
import { DEFAULT_SECTIONS as BAO_VE_DU_LIEU } from '../pages/info/ChinhSachBaoVeDuLieuCaNhan';
import { DEFAULT_SECTIONS as KHIEU_NAI } from '../pages/info/QuyTrinhGiaiQuyetKhieuNai';
import { DEFAULT_SECTIONS as DIEU_KHOAN } from '../pages/info/DieuKhoanDichVu';
import { DEFAULT_SECTIONS as BAO_MAT } from '../pages/info/ChinhSachBaoMat';

// Danh sách các trang "Chính sách"/"Hỗ trợ" có nội dung sửa được trong admin
// (AdminPolicyPages.jsx) - defaultSections dùng để mồi sẵn form khi trang đó
// chưa có nội dung tùy chỉnh nào trong DB (policyPages JSON của SiteSettings).
export const POLICY_PAGES = [
  { slug: 'chinh-sach-bao-hanh', title: 'Chính sách bảo hành', defaultSections: BAO_HANH },
  { slug: 'chinh-sach-doi-tra', title: 'Chính sách đổi trả', defaultSections: DOI_TRA },
  { slug: 'van-chuyen', title: 'Chính sách vận chuyển', defaultSections: VAN_CHUYEN },
  { slug: 'chinh-sach-thanh-toan', title: 'Chính sách thanh toán', defaultSections: THANH_TOAN },
  { slug: 'chinh-sach-kiem-hang', title: 'Chính sách kiểm hàng', defaultSections: KIEM_HANG },
  { slug: 'chinh-sach-bao-ve-du-lieu-ca-nhan', title: 'Chính sách bảo vệ dữ liệu cá nhân', defaultSections: BAO_VE_DU_LIEU },
  { slug: 'quy-trinh-giai-quyet-khieu-nai', title: 'Quy trình giải quyết khiếu nại', defaultSections: KHIEU_NAI },
  { slug: 'dieu-khoan-dich-vu', title: 'Điều khoản dịch vụ', defaultSections: DIEU_KHOAN },
  { slug: 'chinh-sach-bao-mat', title: 'Chính sách bảo mật', defaultSections: BAO_MAT },
];
