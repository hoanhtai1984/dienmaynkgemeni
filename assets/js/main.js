/*==================================================
            DIEN MAY NK - MAIN PAGE LOGIC (index.html)
    ---------------------------------------------
    Toàn bộ nút "Thêm vào giỏ / Mua Ngay" trên trang chủ
    giờ đã có data-id thật trỏ vào products-data.js, nên
    được xử lý tự động bởi bindAddToCartButtons() trong
    cart-manager.js - file này chỉ còn xử lý riêng phần
    hệ thống Tab danh mục sản phẩm.
==================================================*/
document.addEventListener("DOMContentLoaded", function () {

    // =======================================================
    // LOGIC HỆ THỐNG TAB DANH MỤC & ẨN/HIỆN RÚT GỌN (8 SẢN PHẨM)
    // =======================================================
    const loadMoreTabsBtn = document.getElementById("btn-load-more-tabs");
    const defaultVisibleCount = 8;
    let tabStates = {};

    function handleTabProductsVisibility() {
        const activeTabPane = document.querySelector(".tab-content .tab-pane.active");
        if (!activeTabPane || !loadMoreTabsBtn) return;

        const currentTabId = activeTabPane.id;
        const targetItems = activeTabPane.querySelectorAll(".dynamic-item");

        if (tabStates[currentTabId] === undefined) {
            tabStates[currentTabId] = false;
        }

        const isExpanded = tabStates[currentTabId];

        targetItems.forEach((item, index) => {
            if (index >= defaultVisibleCount) {
                item.classList.toggle("d-none", !isExpanded);
            } else {
                item.classList.remove("d-none");
            }
        });

        if (targetItems.length <= defaultVisibleCount) {
            loadMoreTabsBtn.style.display = "none";
        } else {
            loadMoreTabsBtn.style.display = "inline-block";
            loadMoreTabsBtn.innerHTML = isExpanded
                ? `Thu gọn bớt <i class="bi bi-chevron-up ms-1"></i>`
                : `Xem thêm sản phẩm <i class="bi bi-chevron-down ms-1"></i>`;
        }
    }

    handleTabProductsVisibility();

    const categoryTabButtons = document.querySelectorAll('#categoryMenu button[data-bs-toggle="pill"]');
    categoryTabButtons.forEach(tabBtn => {
        tabBtn.addEventListener('shown.bs.tab', function () {
            handleTabProductsVisibility();
        });
    });

    if (loadMoreTabsBtn) {
        loadMoreTabsBtn.addEventListener("click", function () {
            const activeTabPane = document.querySelector(".tab-content .tab-pane.active");
            if (activeTabPane) {
                const currentTabId = activeTabPane.id;
                tabStates[currentTabId] = !tabStates[currentTabId];
                handleTabProductsVisibility();
            }
        });
    }
});
