/*==================================================
    DIEN MAY NK - CATEGORY PAGE LOGIC
    ---------------------------------------------
    Đọc danh mục hiện tại từ URL (?cat=...), tải sản
    phẩm qua ProductAPI, render bộ lọc thương hiệu động,
    xử lý lọc theo thương hiệu/giá và sắp xếp - toàn bộ
    không cần tải lại trang.
==================================================*/

const CATEGORY_NAMES = {
    "dien-tu": "Điện Tử",
    "dien-lanh": "Điện Lạnh",
    "dien-gia-dung": "Điện Gia Dụng",
    "thiet-bi-lam-dep-cham-soc": "Thiết Bị Làm Đẹp Và Chăm Sóc Cá Nhân",
    "gia-dung": "Gia Dụng",
    "phu-kien": "Phụ Kiện",
    "hang-thanh-ly": "Hàng Thanh Lý",
    "all": "Tất cả sản phẩm"
};

const SUBCATEGORY_NAMES = {
    "tivi": "Tivi",
    "loa-thanh": "Loa Thanh",
    "may-lanh": "Máy Lạnh",
    "tu-lanh": "Tủ Lạnh, Tủ Đông, Tủ Mát",
    "may-giat": "Máy Giặt",
    "may-say": "Máy Sấy",
    "may-tam-nuoc-nong": "Máy Tắm Nước Nóng",
    "quat-lam-mat": "Quạt, Thiết Bị Làm Mát",
    "may-loc-khong-khi": "Máy Lọc Không Khí, Tạo Ẩm, Hút Ẩm",
    "may-rua-chen": "Máy Rửa Chén",
    "may-loc-nuoc": "Máy Lọc Nước, Cây Nước Nóng Lạnh, Làm Đá",
    "do-gia-dung-nha-bep": "Đồ Gia Dụng Nhà Bếp",
    "may-hut-bui": "Máy Hút Bụi",
    "ban-ui": "Bàn Ủi",
    "thiet-bi-lam-dep": "Thiết Bị Làm Đẹp",
    "thiet-bi-cham-soc-ca-nhan": "Thiết Bị Chăm Sóc Cá Nhân",
    "noi-chao": "Nồi/Chảo, Bộ Nồi/Bộ Nồi Chảo",
    "dao-thot-dung-cu-bep": "Dao/Thớt/Dụng Cụ Bếp",
    "binh-giu-nhiet": "Bình Giữ Nhiệt",
    "san-pham-khac": "Sản Phẩm Khác",
    "chuot-ban-phim": "Chuột, Bàn Phím",
    "camera-the-nho": "Camera, Thẻ Nhớ",
    "gia-treo": "Giá Treo Màn Hình, Giá Treo Tivi",
    "man-hinh": "Màn Hình",
    "den-ban": "Đèn Bàn",
    "phu-kien-khac": "Phụ Kiện Khác",
    "hang-can-mop": "Hàng Chưa Qua Sử Dụng: Cấn Móp",
    "hang-da-qua-su-dung": "Hàng Đã Qua Sử Dụng"
};

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const currentCategory = params.get("cat") || "all";
    const currentSub = params.get("sub") || "";
    const searchKeyword = params.get("q") || "";

    const grid = document.getElementById("product-grid");
    const emptyState = document.getElementById("empty-state");
    const productCountEl = document.getElementById("product-count");
    const categoryTitleEl = document.getElementById("category-title");
    const breadcrumbCurrentEl = document.getElementById("breadcrumb-current");
    const brandListEl = document.getElementById("brand-filter-list");
    const subFilterBlock = document.getElementById("sub-filter-block");
    const subFilterListEl = document.getElementById("sub-filter-list");
    const sortSelect = document.getElementById("sort-select");
    const applyBtn = document.getElementById("apply-filter-btn");
    const resetBtn = document.getElementById("reset-filter-btn");

    // Tiêu đề trang theo danh mục (+ danh mục con nếu có) hoặc theo từ khóa tìm kiếm
    const baseTitle = CATEGORY_NAMES[currentCategory] || "Sản phẩm";
    const displayTitle = searchKeyword
        ? `Kết quả cho "${searchKeyword}"`
        : (currentSub && SUBCATEGORY_NAMES[currentSub] ? SUBCATEGORY_NAMES[currentSub] : baseTitle);

    categoryTitleEl.textContent = displayTitle;
    breadcrumbCurrentEl.textContent = displayTitle;
    document.title = displayTitle + " - Điện Máy NK";

    // Render danh mục con (nếu danh mục hiện tại có sub-category trong dữ liệu sản phẩm)
    function renderSubFilters() {
        if (!subFilterBlock || !subFilterListEl || searchKeyword || currentCategory === "all") {
            if (subFilterBlock) subFilterBlock.classList.add("d-none");
            return;
        }
        const subsInCategory = [...new Set(
            PRODUCTS.filter(p => p.category === currentCategory).map(p => p.subCategory)
        )].filter(Boolean);

        if (subsInCategory.length === 0) {
            subFilterBlock.classList.add("d-none");
            return;
        }

        subFilterBlock.classList.remove("d-none");
        const allActive = !currentSub ? "active" : "";
        subFilterListEl.innerHTML = `
            <a href="category.html?cat=${currentCategory}" class="sub-filter-link ${allActive}">Tất cả</a>
        ` + subsInCategory.map(sub => {
            const active = currentSub === sub ? "active" : "";
            const label = SUBCATEGORY_NAMES[sub] || sub;
            return `<a href="category.html?cat=${currentCategory}&sub=${sub}" class="sub-filter-link ${active}">${label}</a>`;
        }).join("");
    }
    renderSubFilters();

    function getSelectedBrands() {
        return [...document.querySelectorAll(".brand-checkbox:checked")].map(cb => cb.value);
    }

    function getSelectedPriceRange() {
        const checked = document.querySelector(".price-filter-radio:checked");
        return checked ? checked.value : "all";
    }

    function renderBrandFilters(brands) {
        brandListEl.innerHTML = brands.map(brand => `
            <div class="form-check mb-2">
                <input class="form-check-input brand-checkbox" type="checkbox" value="${brand}" id="brand-${brand}">
                <label class="form-check-label" for="brand-${brand}">${brand}</label>
            </div>
        `).join("");
    }

    function renderProducts(products) {
        productCountEl.textContent = products.length;

        if (products.length === 0) {
            grid.innerHTML = "";
            emptyState.classList.remove("d-none");
            return;
        }
        emptyState.classList.add("d-none");

        grid.innerHTML = products.map(p => `
            <div class="col-xl-4 col-sm-6">
                <div class="product-card bg-white border rounded-3 p-0" data-product-wrapper>
                    ${p.discount > 0 ? `<span class="badge-discount">-${p.discount}%</span>` : ""}
                    <div class="product-img">
                        <a href="product-detail.html?id=${p.id}">
                            <img src="${p.image}" alt="${p.name}" onerror="${PRODUCT_IMG_ONERROR}">
                        </a>
                    </div>
                    <div class="product-info p-3">
                        <span class="product-brand text-muted small">${p.brand}</span>
                        <h5 class="product-title text-truncate-2 fs-6">
                            <a href="product-detail.html?id=${p.id}">${p.name}</a>
                        </h5>
                        <div class="product-price mb-3">
                            <span class="current-price text-danger fw-bold">${formatMoney(p.price)}</span>
                            ${p.discount > 0 ? `<span class="old-price">${formatMoney(p.oldPrice)}</span>` : ""}
                        </div>
                        <button class="btn btn-outline-primary w-100 fw-bold add-to-cart-btn btn-sm" data-id="${p.id}">
                            <i class="bi bi-cart-plus"></i> Thêm vào giỏ
                        </button>
                    </div>
                </div>
            </div>
        `).join("");

        bindAddToCartButtons(grid);
    }

    function loadAndRender() {
        const options = {
            subSlug: currentSub,
            brands: getSelectedBrands(),
            priceRange: getSelectedPriceRange(),
            sortBy: sortSelect.value
        };

        const dataPromise = searchKeyword
            ? ProductAPI.search(searchKeyword)
            : ProductAPI.filterAndSort(currentCategory, options);

        dataPromise.then(products => {
            // Nếu đang ở chế độ tìm kiếm theo từ khóa, vẫn áp dụng lọc brand/giá/sắp xếp thủ công
            if (searchKeyword) {
                if (options.brands.length > 0) {
                    products = products.filter(p => options.brands.includes(p.brand));
                }
                if (options.priceRange !== "all") {
                    const [min, max] = options.priceRange.split("-").map(Number);
                    products = products.filter(p => p.price >= min && p.price <= max);
                }
            }
            renderProducts(products);
        });
    }

    // Khởi tạo: lấy danh sách thương hiệu tương ứng danh mục rồi render bộ lọc + sản phẩm
    ProductAPI.getBrands(searchKeyword ? "all" : currentCategory, currentSub).then(brands => {
        renderBrandFilters(brands);
        loadAndRender();
    });

    applyBtn.addEventListener("click", loadAndRender);
    resetBtn.addEventListener("click", function () {
        document.querySelectorAll(".brand-checkbox").forEach(cb => cb.checked = false);
        document.getElementById("price-all").checked = true;
        sortSelect.value = "newest";
        loadAndRender();
    });
    sortSelect.addEventListener("change", loadAndRender);
});
