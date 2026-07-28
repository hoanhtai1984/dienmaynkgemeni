import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/huong-dan-mua-hang', label: 'Hướng dẫn mua hàng' },
  { to: '/chinh-sach-bao-hanh', label: 'Chính sách bảo hành' },
  { to: '/chinh-sach-doi-tra', label: 'Chính sách đổi trả' },
  { to: '/van-chuyen', label: 'Chính sách vận chuyển' },
  { to: '/chinh-sach-thanh-toan', label: 'Chính sách thanh toán' },
  { to: '/chinh-sach-kiem-hang', label: 'Chính sách kiểm hàng' },
  { to: '/cau-hoi-thuong-gap', label: 'Câu hỏi thường gặp' },
  { to: '/dieu-khoan-dich-vu', label: 'Điều khoản dịch vụ' },
  { to: '/chinh-sach-bao-mat', label: 'Chính sách bảo mật' },
  { to: '/chinh-sach-bao-ve-du-lieu-ca-nhan', label: 'Chính sách bảo vệ dữ liệu cá nhân' },
  { to: '/quy-trinh-giai-quyet-khieu-nai', label: 'Quy trình giải quyết khiếu nại' },
  { to: '/lien-he', label: 'Liên hệ hỗ trợ' },
];

function InfoSidebar() {
  return (
    <div className="list-group info-side-nav">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => `list-group-item list-group-item-action${isActive ? ' active' : ''}`}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}

export default InfoSidebar;
