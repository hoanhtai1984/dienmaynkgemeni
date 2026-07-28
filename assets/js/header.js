/*==================================================
            DIEN MAY NK - HEADER DYNAMICS
    (Chạy SAU khi components.js đã bơm header/footer
    vào DOM, nên các phần tử #site-header, #backToTop
    luôn tồn tại khi đoạn code này thực thi.)
==================================================*/
document.addEventListener("DOMContentLoaded", function () {
    const header = document.getElementById("site-header");
    const backToTop = document.getElementById("backToTop");

    if (header) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 80) {
                header.classList.add("sticky");
            } else {
                header.classList.remove("sticky");
            }
        });
    }

    if (backToTop) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 300) {
                backToTop.classList.add("show");
            } else {
                backToTop.classList.remove("show");
            }
        });

        backToTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // Nút liên hệ nhanh nổi (Zalo / gọi hotline)
    const contactFab = document.getElementById("contactFab");
    const contactFabToggle = document.getElementById("contactFabToggle");
    if (contactFab && contactFabToggle) {
        contactFabToggle.addEventListener("click", function (e) {
            e.stopPropagation();
            contactFab.classList.toggle("open");
        });
        document.addEventListener("click", function (e) {
            if (!contactFab.contains(e.target)) {
                contactFab.classList.remove("open");
            }
        });
    }

    // Submit form tìm kiếm ở header -> điều hướng sang trang kết quả tìm kiếm
    const searchForm = document.getElementById("header-search-form");
    if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const input = document.getElementById("search-input");
            const keyword = input ? input.value.trim() : "";
            if (keyword.length > 0) {
                window.location.href = "category.html?q=" + encodeURIComponent(keyword);
            }
        });
    }

    // Flyout "Danh Mục" giữa logo và ô tìm kiếm: chuyển panel bên phải theo mục đang hover bên trái
    const categoryNav = document.getElementById("categoryNav");
    const categoryFlyout = document.getElementById("categoryFlyout");
    const categoryNavBtn = document.getElementById("categoryNavBtn");
    if (categoryNav && categoryFlyout) {
        const sidebarItems = categoryFlyout.querySelectorAll(".category-flyout-sidebar li");
        const panels = categoryFlyout.querySelectorAll(".flyout-panel-content");

        sidebarItems.forEach(function (li) {
            li.addEventListener("mouseenter", function () {
                sidebarItems.forEach(item => item.classList.remove("active"));
                panels.forEach(panel => panel.classList.remove("active"));
                li.classList.add("active");
                const target = document.getElementById(li.dataset.panel);
                if (target) target.classList.add("active");
            });
        });

        // Hỗ trợ bấm để mở/đóng (dành cho laptop có màn hình cảm ứng, không hover được)
        if (categoryNavBtn) {
            categoryNavBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                categoryFlyout.classList.toggle("show");
            });
        }
        document.addEventListener("click", function (e) {
            if (!categoryNav.contains(e.target)) {
                categoryFlyout.classList.remove("show");
            }
        });
    }
});
