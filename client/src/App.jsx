import { Routes, Route, Navigate, Link } from 'react-router-dom';
import ScrollManager from './components/ScrollManager';
import Layout from './layout/Layout';
import AdminLayout from './layout/AdminLayout';
import Home from './pages/Home';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import Wishlist from './pages/Wishlist';
import Compare from './pages/Compare';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import OrderConfirmation from './pages/OrderConfirmation';
import ResetPassword from './pages/ResetPassword';
import GioiThieu from './pages/info/GioiThieu';
import HuongDanMuaHang from './pages/info/HuongDanMuaHang';
import ChinhSachBaoHanh from './pages/info/ChinhSachBaoHanh';
import ChinhSachDoiTra from './pages/info/ChinhSachDoiTra';
import VanChuyen from './pages/info/VanChuyen';
import CauHoiThuongGap from './pages/info/CauHoiThuongGap';
import LienHe from './pages/info/LienHe';
import DieuKhoanDichVu from './pages/info/DieuKhoanDichVu';
import ChinhSachBaoMat from './pages/info/ChinhSachBaoMat';
import ChinhSachThanhToan from './pages/info/ChinhSachThanhToan';
import ChinhSachKiemHang from './pages/info/ChinhSachKiemHang';
import ChinhSachBaoVeDuLieuCaNhan from './pages/info/ChinhSachBaoVeDuLieuCaNhan';
import QuyTrinhGiaiQuyetKhieuNai from './pages/info/QuyTrinhGiaiQuyetKhieuNai';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminReports from './pages/admin/AdminReports';
import AdminPosts from './pages/admin/AdminPosts';
import AdminPostForm from './pages/admin/AdminPostForm';
import AdminSettingsGeneral from './pages/admin/AdminSettingsGeneral';
import AdminSettingsContent from './pages/admin/AdminSettingsContent';
import AdminPolicyPages from './pages/admin/AdminPolicyPages';
import AdminMessages from './pages/admin/AdminMessages';
import AdminMembers from './pages/admin/AdminMembers';

function NotFound() {
  return (
    <main className="py-5 bg-light">
      <div className="container text-center py-5">
        <i className="bi bi-emoji-frown text-muted" style={{ fontSize: '3rem' }}></i>
        <p className="text-muted mt-3 mb-3">Không tìm thấy trang bạn yêu cầu.</p>
        <Link to="/" className="btn btn-warning fw-bold rounded-pill px-4">Về trang chủ</Link>
      </div>
    </main>
  );
}

function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="danh-muc" element={<Category />} />
          <Route path="san-pham/:slug" element={<ProductDetail />} />
          <Route path="gio-hang" element={<Cart />} />
          <Route path="don-hang-cua-toi" element={<MyOrders />} />
          <Route path="san-pham-yeu-thich" element={<Wishlist />} />
          <Route path="so-sanh" element={<Compare />} />
          <Route path="tin-tuc" element={<Blog />} />
          <Route path="tin-tuc/:slug" element={<BlogDetail />} />
          <Route path="dat-hang-thanh-cong" element={<OrderConfirmation />} />
          <Route path="dat-lai-mat-khau" element={<ResetPassword />} />
          <Route path="gioi-thieu" element={<GioiThieu />} />
          <Route path="huong-dan-mua-hang" element={<HuongDanMuaHang />} />
          <Route path="chinh-sach-bao-hanh" element={<ChinhSachBaoHanh />} />
          <Route path="chinh-sach-doi-tra" element={<ChinhSachDoiTra />} />
          <Route path="van-chuyen" element={<VanChuyen />} />
          <Route path="cau-hoi-thuong-gap" element={<CauHoiThuongGap />} />
          <Route path="lien-he" element={<LienHe />} />
          <Route path="dieu-khoan-dich-vu" element={<DieuKhoanDichVu />} />
          <Route path="chinh-sach-bao-mat" element={<ChinhSachBaoMat />} />
          <Route path="chinh-sach-thanh-toan" element={<ChinhSachThanhToan />} />
          <Route path="chinh-sach-kiem-hang" element={<ChinhSachKiemHang />} />
          <Route path="chinh-sach-bao-ve-du-lieu-ca-nhan" element={<ChinhSachBaoVeDuLieuCaNhan />} />
          <Route path="quy-trinh-giai-quyet-khieu-nai" element={<QuyTrinhGiaiQuyetKhieuNai />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="posts/new" element={<AdminPostForm />} />
          <Route path="posts/:id/edit" element={<AdminPostForm />} />
          <Route path="settings" element={<AdminSettingsGeneral />} />
          <Route path="settings-content" element={<AdminSettingsContent />} />
          <Route path="policy-pages" element={<AdminPolicyPages />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="members" element={<AdminMembers />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
