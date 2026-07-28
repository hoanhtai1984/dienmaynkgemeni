/*==================================================
    DIEN MAY NK - SHARED HEADER / FOOTER COMPONENTS
    ---------------------------------------------
    Thay vì copy-paste code header/footer vào từng
    file HTML (dễ gây lệch nhau khi sửa), toàn bộ
    header/footer được định nghĩa DUY NHẤT ở đây và
    tự động "bơm" vào mọi trang có sẵn 2 thẻ:
        <div id="header-placeholder"></div>
        <div id="footer-placeholder"></div>

    Script này PHẢI được nạp (script src) TRƯỚC
    header.js / main.js / cart.js ở cuối mỗi trang,
    vì các script đó cần các phần tử #site-header,
    #backToTop... đã tồn tại trong DOM.
==================================================*/

const HEADER_HTML = `
<header id="site-header">
    <div class="top-bar">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6 col-md-6 col-12 text-center text-md-start">
                    <div class="top-left">
                        <i class="bi bi-telephone-fill"></i> Hotline: <strong>0971 370 152</strong>
                    </div>
                </div>
                <div class="col-lg-6 col-md-6 d-none d-md-block">
                    <ul class="top-menu">
                        <li><a href="gioi-thieu.html">Giới thiệu</a></li>
                        <li><a href="huong-dan-mua-hang.html">Hướng dẫn mua hàng</a></li>
                        <li><a href="cau-hoi-thuong-gap.html">Câu hỏi thường gặp</a></li>
                        <li><a href="lien-he.html">Liên hệ</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <div class="main-header">
        <div class="container">
            <div class="row align-items-center gy-3">
                <div class="col-lg-2 col-md-3 col-6">
                    <a href="index.html" class="logo">
                        <img src="assets/images/logo.png" alt="Điện Máy NK" onerror="this.src='https://placehold.co/190x50?text=DienMayNK'">
                    </a>
                </div>
                <div class="col-lg-2 d-none d-lg-block">
                    <div class="category-nav" id="categoryNav">
                        <button class="category-nav-btn" type="button" id="categoryNavBtn">
                            <i class="bi bi-grid-fill"></i> Danh Mục
                            <i class="bi bi-chevron-down"></i>
                        </button>
                        <div class="category-flyout" id="categoryFlyout">
                            <ul class="category-flyout-sidebar">
                                <li class="active" data-panel="panel-dien-tu"><a href="category.html?cat=dien-tu"><i class="bi bi-tv-fill"></i> Điện Tử</a></li>
                                <li data-panel="panel-dien-lanh"><a href="category.html?cat=dien-lanh"><i class="bi bi-snow"></i> Điện Lạnh</a></li>
                                <li data-panel="panel-dien-gia-dung"><a href="category.html?cat=dien-gia-dung"><i class="bi bi-house-gear-fill"></i> Điện Gia Dụng</a></li>
                                <li data-panel="panel-lam-dep"><a href="category.html?cat=thiet-bi-lam-dep-cham-soc"><i class="bi bi-heart-pulse-fill"></i> Làm Đẹp &amp; CSCN</a></li>
                                <li data-panel="panel-gia-dung"><a href="category.html?cat=gia-dung"><i class="bi bi-cup-hot-fill"></i> Gia Dụng</a></li>
                                <li data-panel="panel-phu-kien"><a href="category.html?cat=phu-kien"><i class="bi bi-mouse2-fill"></i> Phụ Kiện</a></li>
                                <li data-panel="panel-thanh-ly"><a href="category.html?cat=hang-thanh-ly"><i class="bi bi-tag-fill"></i> Hàng Thanh Lý</a></li>
                            </ul>
                            <div class="category-flyout-panel">
                                <div class="flyout-panel-content active" id="panel-dien-tu">
                                    <div class="flyout-icon-grid">
                                        <a href="category.html?cat=dien-tu&amp;sub=tivi"><span class="flyout-icon"><i class="bi bi-tv"></i></span>Tivi</a>
                                        <a href="category.html?cat=dien-tu&amp;sub=loa-thanh"><span class="flyout-icon"><i class="bi bi-speaker"></i></span>Loa Thanh</a>
                                    </div>
                                </div>
                                <div class="flyout-panel-content" id="panel-dien-lanh">
                                    <div class="flyout-icon-grid">
                                        <a href="category.html?cat=dien-lanh&amp;sub=may-lanh"><span class="flyout-icon"><i class="bi bi-snow"></i></span>Máy Lạnh</a>
                                        <a href="category.html?cat=dien-lanh&amp;sub=tu-lanh"><span class="flyout-icon"><i class="bi bi-snow2"></i></span>Tủ Lạnh, Tủ Đông</a>
                                        <a href="category.html?cat=dien-lanh&amp;sub=may-giat"><span class="flyout-icon"><i class="bi bi-arrow-repeat"></i></span>Máy Giặt</a>
                                        <a href="category.html?cat=dien-lanh&amp;sub=may-say"><span class="flyout-icon"><i class="bi bi-brightness-high"></i></span>Máy Sấy</a>
                                        <a href="category.html?cat=dien-lanh&amp;sub=may-tam-nuoc-nong"><span class="flyout-icon"><i class="bi bi-droplet-half"></i></span>Máy Tắm Nước Nóng</a>
                                    </div>
                                </div>
                                <div class="flyout-panel-content" id="panel-dien-gia-dung">
                                    <div class="flyout-icon-grid">
                                        <a href="category.html?cat=dien-gia-dung&amp;sub=quat-lam-mat"><span class="flyout-icon"><i class="bi bi-wind"></i></span>Quạt, Làm Mát</a>
                                        <a href="category.html?cat=dien-gia-dung&amp;sub=may-loc-khong-khi"><span class="flyout-icon"><i class="bi bi-cloud-haze2-fill"></i></span>Lọc Không Khí</a>
                                        <a href="category.html?cat=dien-gia-dung&amp;sub=may-rua-chen"><span class="flyout-icon"><i class="bi bi-droplet"></i></span>Máy Rửa Chén</a>
                                        <a href="category.html?cat=dien-gia-dung&amp;sub=may-loc-nuoc"><span class="flyout-icon"><i class="bi bi-droplet-fill"></i></span>Máy Lọc Nước</a>
                                        <a href="category.html?cat=dien-gia-dung&amp;sub=do-gia-dung-nha-bep"><span class="flyout-icon"><i class="bi bi-egg-fried"></i></span>Đồ Nhà Bếp</a>
                                        <a href="category.html?cat=dien-gia-dung&amp;sub=may-hut-bui"><span class="flyout-icon"><i class="bi bi-recycle"></i></span>Máy Hút Bụi</a>
                                        <a href="category.html?cat=dien-gia-dung&amp;sub=ban-ui"><span class="flyout-icon"><i class="bi bi-bag-fill"></i></span>Bàn Ủi</a>
                                    </div>
                                </div>
                                <div class="flyout-panel-content" id="panel-lam-dep">
                                    <div class="flyout-icon-grid">
                                        <a href="category.html?cat=thiet-bi-lam-dep-cham-soc&amp;sub=thiet-bi-lam-dep"><span class="flyout-icon"><i class="bi bi-magic"></i></span>Thiết Bị Làm Đẹp</a>
                                        <a href="category.html?cat=thiet-bi-lam-dep-cham-soc&amp;sub=thiet-bi-cham-soc-ca-nhan"><span class="flyout-icon"><i class="bi bi-heart-pulse"></i></span>Chăm Sóc Cá Nhân</a>
                                    </div>
                                </div>
                                <div class="flyout-panel-content" id="panel-gia-dung">
                                    <div class="flyout-icon-grid">
                                        <a href="category.html?cat=gia-dung&amp;sub=noi-chao"><span class="flyout-icon"><i class="bi bi-basket2-fill"></i></span>Nồi/Chảo</a>
                                        <a href="category.html?cat=gia-dung&amp;sub=dao-thot-dung-cu-bep"><span class="flyout-icon"><i class="bi bi-scissors"></i></span>Dao/Thớt/Dụng Cụ Bếp</a>
                                        <a href="category.html?cat=gia-dung&amp;sub=binh-giu-nhiet"><span class="flyout-icon"><i class="bi bi-cup-straw"></i></span>Bình Giữ Nhiệt</a>
                                        <a href="category.html?cat=gia-dung&amp;sub=san-pham-khac"><span class="flyout-icon"><i class="bi bi-three-dots"></i></span>Sản Phẩm Khác</a>
                                    </div>
                                </div>
                                <div class="flyout-panel-content" id="panel-phu-kien">
                                    <div class="flyout-icon-grid">
                                        <a href="category.html?cat=phu-kien&amp;sub=chuot-ban-phim"><span class="flyout-icon"><i class="bi bi-mouse2-fill"></i></span>Chuột, Bàn Phím</a>
                                        <a href="category.html?cat=phu-kien&amp;sub=camera-the-nho"><span class="flyout-icon"><i class="bi bi-camera-fill"></i></span>Camera, Thẻ Nhớ</a>
                                        <a href="category.html?cat=phu-kien&amp;sub=gia-treo"><span class="flyout-icon"><i class="bi bi-display"></i></span>Giá Treo</a>
                                        <a href="category.html?cat=phu-kien&amp;sub=man-hinh"><span class="flyout-icon"><i class="bi bi-display"></i></span>Màn Hình</a>
                                        <a href="category.html?cat=phu-kien&amp;sub=den-ban"><span class="flyout-icon"><i class="bi bi-lightbulb-fill"></i></span>Đèn Bàn</a>
                                        <a href="category.html?cat=phu-kien&amp;sub=phu-kien-khac"><span class="flyout-icon"><i class="bi bi-plug-fill"></i></span>Phụ Kiện Khác</a>
                                    </div>
                                </div>
                                <div class="flyout-panel-content" id="panel-thanh-ly">
                                    <div class="flyout-icon-grid">
                                        <a href="category.html?cat=hang-thanh-ly&amp;sub=hang-can-mop"><span class="flyout-icon"><i class="bi bi-exclamation-triangle-fill"></i></span>Hàng Cấn Móp</a>
                                        <a href="category.html?cat=hang-thanh-ly&amp;sub=hang-da-qua-su-dung"><span class="flyout-icon"><i class="bi bi-arrow-repeat"></i></span>Đã Qua Sử Dụng</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6 col-12 order-3 order-md-2">
                    <form class="search-form" id="header-search-form">
                        <div class="search-box">
                            <i class="bi bi-search"></i>
                            <input type="text" id="search-input" autocomplete="off" placeholder="Bạn cần tìm gì hôm nay?">
                            <button type="submit">Tìm kiếm</button>
                            <div id="search-suggestions" class="d-none"></div>
                        </div>
                    </form>
                </div>
                <div class="col-lg-4 col-md-3 col-6 order-2 order-md-3">
                    <div class="header-right">
                        <a href="#" class="header-item d-none d-xl-flex">
                            <i class="bi bi-geo-alt"></i>
                            <div>
                                <small>Giao đến</small>
                                <strong>TP. Hồ Chí Minh</strong>
                            </div>
                        </a>
                        <a href="#" class="header-icon d-none d-lg-flex">
                            <i class="bi bi-heart"></i>
                        </a>
                        <a href="#" class="header-item d-none d-lg-flex">
                            <i class="bi bi-person-circle"></i>
                            <div>
                                <small>Tài khoản</small>
                                <strong>Đăng nhập</strong>
                            </div>
                        </a>
                        <a href="cart.html" class="cart-btn">
                            <i class="bi bi-cart3"></i>
                            <span class="cart-count">0</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <nav class="main-nav navbar navbar-expand-lg">
        <div class="container">
            <button class="navbar-toggler me-auto my-2" type="button" data-bs-toggle="collapse" data-bs-target="#mainMenu">
                <i class="bi bi-list"></i> Danh Mục Sản Phẩm
            </button>
            <div class="collapse navbar-collapse" id="mainMenu">
                <ul class="navbar-nav w-100 justify-content-between">
                    <li class="nav-item dropdown mega-menu">
                        <a class="nav-link" href="category.html?cat=dien-tu"><i class="bi bi-tv-fill"></i> Điện Tử</a>
                        <div class="mega-content">
                            <div class="row">
                                <div class="col-lg-4">
                                    <h6>DANH MỤC</h6>
                                    <a href="category.html?cat=dien-tu&amp;sub=tivi">Tivi</a><a href="category.html?cat=dien-tu&amp;sub=loa-thanh">Loa Thanh</a>
                                </div>
                                <div class="col-lg-8 d-none d-lg-block">
                                    <img src="https://placehold.co/400x150?text=Dien+Tu" class="img-fluid rounded" alt="Điện Tử">
                                </div>
                            </div>
                        </div>
                    </li>
                    <li class="nav-item dropdown mega-menu">
                        <a class="nav-link" href="category.html?cat=dien-lanh"><i class="bi bi-snow"></i> Điện Lạnh</a>
                        <div class="mega-content">
                            <div class="row">
                                <div class="col-lg-4">
                                    <h6>DANH MỤC</h6>
                                    <a href="category.html?cat=dien-lanh&amp;sub=may-lanh">Máy Lạnh</a><a href="category.html?cat=dien-lanh&amp;sub=tu-lanh">Tủ Lạnh, Tủ Đông, Tủ Mát</a><a href="category.html?cat=dien-lanh&amp;sub=may-giat">Máy Giặt</a><a href="category.html?cat=dien-lanh&amp;sub=may-say">Máy Sấy</a><a href="category.html?cat=dien-lanh&amp;sub=may-tam-nuoc-nong">Máy Tắm Nước Nóng</a>
                                </div>
                                <div class="col-lg-8 d-none d-lg-block">
                                    <img src="https://placehold.co/400x150?text=Dien+Lanh" class="img-fluid rounded" alt="Điện Lạnh">
                                </div>
                            </div>
                        </div>
                    </li>
                    <li class="nav-item dropdown mega-menu">
                        <a class="nav-link" href="category.html?cat=dien-gia-dung"><i class="bi bi-house-gear-fill"></i> Điện Gia Dụng</a>
                        <div class="mega-content">
                            <div class="row">
                                <div class="col-lg-3">
                                    <h6>NHÀ CỬA</h6>
                                    <a href="category.html?cat=dien-gia-dung&amp;sub=quat-lam-mat">Quạt, Thiết Bị Làm Mát</a><a href="category.html?cat=dien-gia-dung&amp;sub=may-loc-khong-khi">Máy Lọc Không Khí, Tạo Ẩm, Hút Ẩm</a><a href="category.html?cat=dien-gia-dung&amp;sub=may-hut-bui">Máy Hút Bụi</a><a href="category.html?cat=dien-gia-dung&amp;sub=ban-ui">Bàn Ủi</a>
                                </div>
                                <div class="col-lg-3">
                                    <h6>NHÀ BẾP</h6>
                                    <a href="category.html?cat=dien-gia-dung&amp;sub=may-rua-chen">Máy Rửa Chén</a><a href="category.html?cat=dien-gia-dung&amp;sub=may-loc-nuoc">Máy Lọc Nước, Cây Nước Nóng Lạnh, Làm Đá</a><a href="category.html?cat=dien-gia-dung&amp;sub=do-gia-dung-nha-bep">Đồ Gia Dụng Nhà Bếp</a>
                                </div>
                                <div class="col-lg-6 d-none d-lg-block">
                                    <img src="https://placehold.co/400x150?text=Dien+Gia+Dung" class="img-fluid rounded" alt="Điện Gia Dụng">
                                </div>
                            </div>
                        </div>
                    </li>
                    <li class="nav-item dropdown mega-menu">
                        <a class="nav-link" href="category.html?cat=thiet-bi-lam-dep-cham-soc"><i class="bi bi-heart-pulse-fill"></i> Làm Đẹp &amp; Chăm Sóc Cá Nhân</a>
                        <div class="mega-content">
                            <div class="row">
                                <div class="col-lg-4">
                                    <h6>DANH MỤC</h6>
                                    <a href="category.html?cat=thiet-bi-lam-dep-cham-soc&amp;sub=thiet-bi-lam-dep">Thiết Bị Làm Đẹp</a><a href="category.html?cat=thiet-bi-lam-dep-cham-soc&amp;sub=thiet-bi-cham-soc-ca-nhan">Thiết Bị Chăm Sóc Cá Nhân</a>
                                </div>
                                <div class="col-lg-8 d-none d-lg-block">
                                    <img src="https://placehold.co/400x150?text=Lam+Dep" class="img-fluid rounded" alt="Làm Đẹp & Chăm Sóc Cá Nhân">
                                </div>
                            </div>
                        </div>
                    </li>
                    <li class="nav-item dropdown mega-menu">
                        <a class="nav-link" href="category.html?cat=gia-dung"><i class="bi bi-cup-hot-fill"></i> Gia Dụng</a>
                        <div class="mega-content">
                            <div class="row">
                                <div class="col-lg-4">
                                    <h6>DANH MỤC</h6>
                                    <a href="category.html?cat=gia-dung&amp;sub=noi-chao">Nồi/Chảo, Bộ Nồi/Bộ Nồi Chảo</a><a href="category.html?cat=gia-dung&amp;sub=dao-thot-dung-cu-bep">Dao/Thớt/Dụng Cụ Bếp</a><a href="category.html?cat=gia-dung&amp;sub=binh-giu-nhiet">Bình Giữ Nhiệt</a><a href="category.html?cat=gia-dung&amp;sub=san-pham-khac">Sản Phẩm Khác</a>
                                </div>
                                <div class="col-lg-8 d-none d-lg-block">
                                    <img src="https://placehold.co/400x150?text=Gia+Dung" class="img-fluid rounded" alt="Gia Dụng">
                                </div>
                            </div>
                        </div>
                    </li>
                    <li class="nav-item dropdown mega-menu">
                        <a class="nav-link" href="category.html?cat=phu-kien"><i class="bi bi-mouse2-fill"></i> Phụ Kiện</a>
                        <div class="mega-content">
                            <div class="row">
                                <div class="col-lg-3">
                                    <h6>THIẾT BỊ SỐ</h6>
                                    <a href="category.html?cat=phu-kien&amp;sub=chuot-ban-phim">Chuột, Bàn Phím</a><a href="category.html?cat=phu-kien&amp;sub=camera-the-nho">Camera, Thẻ Nhớ</a><a href="category.html?cat=phu-kien&amp;sub=man-hinh">Màn Hình</a>
                                </div>
                                <div class="col-lg-3">
                                    <h6>KHÁC</h6>
                                    <a href="category.html?cat=phu-kien&amp;sub=gia-treo">Giá Treo Màn Hình, Giá Treo Tivi</a><a href="category.html?cat=phu-kien&amp;sub=den-ban">Đèn Bàn</a><a href="category.html?cat=phu-kien&amp;sub=phu-kien-khac">Phụ Kiện Khác</a>
                                </div>
                                <div class="col-lg-6 d-none d-lg-block">
                                    <img src="https://placehold.co/400x150?text=Phu+Kien" class="img-fluid rounded" alt="Phụ Kiện">
                                </div>
                            </div>
                        </div>
                    </li>
                    <li class="nav-item dropdown mega-menu">
                        <a class="nav-link" href="category.html?cat=hang-thanh-ly"><i class="bi bi-tag-fill"></i> Hàng Thanh Lý</a>
                        <div class="mega-content">
                            <div class="row">
                                <div class="col-lg-4">
                                    <h6>DANH MỤC</h6>
                                    <a href="category.html?cat=hang-thanh-ly&amp;sub=hang-can-mop">Hàng Chưa Qua Sử Dụng: Cấn Móp</a><a href="category.html?cat=hang-thanh-ly&amp;sub=hang-da-qua-su-dung">Hàng Đã Qua Sử Dụng</a>
                                </div>
                                <div class="col-lg-8 d-none d-lg-block">
                                    <img src="https://placehold.co/400x150?text=Thanh+Ly" class="img-fluid rounded" alt="Hàng Thanh Lý">
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</header>
`;

const FOOTER_HTML = `
<footer class="site-footer">
    <div class="container">
        <div class="row gy-4">
            <div class="col-lg-4 col-md-6">
                <img src="assets/images/logo.png" alt="Điện Máy NK" class="footer-logo" onerror="this.src='https://placehold.co/190x50?text=DienMayNK'">
                <p class="mt-3">Điện Máy NK chuyên cung cấp điện máy chính hãng, giá tốt, giao hàng toàn quốc.</p>
                <p><i class="bi bi-geo-alt-fill text-warning"></i> TP. Hồ Chí Minh</p>
                <p><i class="bi bi-telephone-fill text-warning"></i> 0971 370 152</p>
                <p><i class="bi bi-envelope-fill text-warning"></i> contact@dienmaynk.vn</p>
            </div>
            <div class="col-lg-2 col-6">
                <h5>Chính sách</h5>
                <ul class="footer-menu">
                    <li><a href="chinh-sach-bao-hanh.html">Chính sách bảo hành</a></li>
                    <li><a href="chinh-sach-doi-tra.html">Chính sách đổi trả</a></li>
                    <li><a href="van-chuyen.html">Vận chuyển</a></li>
                </ul>
            </div>
            <div class="col-lg-2 col-6">
                <h5>Hỗ trợ</h5>
                <ul class="footer-menu">
                    <li><a href="huong-dan-mua-hang.html">Hướng dẫn mua hàng</a></li>
                    <li><a href="cau-hoi-thuong-gap.html">Câu hỏi thường gặp</a></li>
                    <li><a href="lien-he.html">Liên hệ</a></li>
                </ul>
            </div>
            <div class="col-lg-4 col-md-6">
                <h5>Kết nối với chúng tôi</h5>
                <div class="footer-social mb-3">
                    <a href="#"><i class="bi bi-facebook"></i></a>
                    <a href="#"><i class="bi bi-youtube"></i></a>
                    <a href="#"><i class="bi bi-tiktok"></i></a>
                    <a href="#"><i class="bi bi-instagram"></i></a>
                </div>
                <h5>Đăng ký nhận tin</h5>
                <div class="input-group mt-2">
                    <input type="email" class="form-control" placeholder="Email của bạn">
                    <button class="btn btn-warning" type="button">Gửi</button>
                </div>
            </div>
        </div>
    </div>
    <div class="footer-bottom">
        &copy; 2026 <strong>dienmaynk.vn</strong> - Tất cả các quyền được bảo lưu.
    </div>
</footer>

<button id="backToTop" title="Lên đầu trang">
    <i class="bi bi-arrow-up"></i>
</button>

<div class="contact-fab" id="contactFab">
    <div class="contact-fab-menu" id="contactFabMenu">
        <a href="https://zalo.me/0971370152" target="_blank" rel="noopener" class="contact-fab-item zalo">
            <span class="contact-fab-icon">Za</span>
            <span class="contact-fab-label">Chat Zalo</span>
        </a>
        <a href="tel:0971370152" class="contact-fab-item phone">
            <span class="contact-fab-icon"><i class="bi bi-telephone-fill"></i></span>
            <span class="contact-fab-label">Gọi ngay: 0971 370 152</span>
        </a>
    </div>
    <button class="contact-fab-toggle" id="contactFabToggle" type="button" title="Liên hệ nhanh">
        <i class="bi bi-headset"></i>
    </button>
</div>
`;

(function injectComponents() {
    const headerSlot = document.getElementById("header-placeholder");
    const footerSlot = document.getElementById("footer-placeholder");

    if (headerSlot) headerSlot.outerHTML = HEADER_HTML;
    if (footerSlot) footerSlot.outerHTML = FOOTER_HTML;

    // Đánh dấu mục menu đang active theo trang/danh mục hiện tại
    const params = new URLSearchParams(window.location.search);
    const currentCat = params.get("cat");
    if (currentCat) {
        document.querySelectorAll(`.main-nav a[href*="cat=${currentCat}"]`).forEach(a => {
            const parentLink = a.closest(".nav-item")?.querySelector(".nav-link");
            if (parentLink) parentLink.classList.add("text-primary");
        });
    }
})();
