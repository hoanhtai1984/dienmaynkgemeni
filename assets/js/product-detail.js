/*==================================================
    DIEN MAY NK - PRODUCT DETAIL PAGE LOGIC
    ---------------------------------------------
    Đọc id sản phẩm từ URL (?id=...), tải dữ liệu qua
    ProductAPI và render toàn bộ nội dung trang: gallery
    ảnh, giá, thông số kỹ thuật, bộ chọn số lượng.
==================================================*/

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get("id")) || 1; // Mặc định sản phẩm #1 nếu không có id trên URL

    const container = document.getElementById("product-detail-container");
    const breadcrumb = document.getElementById("product-breadcrumb");

    ProductAPI.getById(productId).then(product => {
        if (!product) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-emoji-frown text-muted" style="font-size:3rem;"></i>
                    <p class="text-muted mt-3">Không tìm thấy sản phẩm bạn yêu cầu.</p>
                    <a href="index.html" class="btn btn-warning fw-bold rounded-pill px-4">Về trang chủ</a>
                </div>`;
            return;
        }

        document.title = product.name + " - Điện Máy NK";

        breadcrumb.innerHTML = `
            <li class="breadcrumb-item"><a href="index.html">Trang chủ</a></li>
            <li class="breadcrumb-item"><a href="category.html?cat=${product.category}">${product.categoryName}</a></li>
            <li class="breadcrumb-item active" aria-current="page">${product.name}</li>
        `;

        const stars = renderStars(product.rating);
        const specsRows = Object.entries(product.specs)
            .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
            .join("");

        const thumbnails = product.images.map((img, index) => `
            <div class="thumbnail-item ${index === 0 ? "active" : ""}" data-img="${img}">
                <img src="${img}" alt="Ảnh ${index + 1}" onerror="${PRODUCT_IMG_ONERROR}">
            </div>
        `).join("");

        container.innerHTML = `
            <div class="bg-white p-4 rounded-3 border mb-4">
                <div class="row g-4">
                    <div class="col-md-5">
                        <div class="product-gallery border rounded-3 p-3 text-center bg-white">
                            <img src="${product.image}" id="main-product-img" class="img-fluid rounded" alt="${product.name}" onerror="${PRODUCT_IMG_ONERROR}">
                        </div>
                        ${product.images.length > 1 ? `<div class="thumbnail-list">${thumbnails}</div>` : ""}
                    </div>

                    <div class="col-md-7" data-product-wrapper>
                        ${product.badge ? `<span class="badge bg-danger mb-2">${product.badge}</span>` : ""}
                        <h2 class="fw-bold text-dark fs-3 mb-2">${product.name}</h2>

                        <div class="d-flex align-items-center gap-3 mb-3 flex-wrap">
                            <div class="text-warning small">
                                ${stars}
                                <span class="text-muted ms-1">(${product.reviewCount} đánh giá)</span>
                            </div>
                            <div class="text-muted small">| Thương hiệu: <strong class="text-dark">${product.brand}</strong></div>
                            <div class="text-muted small">| Đã bán: <strong class="text-dark">${product.sold}</strong></div>
                        </div>

                        <div class="price-box p-3 bg-light rounded-3 mb-4">
                            <div class="d-flex align-items-baseline gap-3 flex-wrap">
                                <span class="fs-2 fw-bold text-danger">${formatMoney(product.price)}</span>
                                ${product.discount > 0 ? `
                                    <span class="text-muted text-decoration-line-through">${formatMoney(product.oldPrice)}</span>
                                    <span class="badge bg-danger-subtle text-danger fw-bold rounded">-${product.discount}%</span>
                                ` : ""}
                            </div>
                            <small class="text-success d-block mt-2"><i class="bi bi-check-circle-fill"></i> Giá đã bao gồm thuế VAT và miễn phí vận chuyển nội thành</small>
                        </div>

                        <div class="mb-4">
                            <label class="fw-bold small d-block mb-2">Số lượng</label>
                            <div class="qty-selector">
                                <button type="button" id="qty-minus">-</button>
                                <input type="text" class="qty-selector-input" id="qty-input" value="1" readonly>
                                <button type="button" id="qty-plus">+</button>
                            </div>
                        </div>

                        <div class="row g-3">
                            <div class="col-sm-6">
                                <button class="btn btn-danger w-100 py-3 fw-bold fs-5 add-to-cart-btn" data-id="${product.id}">
                                    <i class="bi bi-cart-plus-fill"></i> THÊM VÀO GIỎ
                                </button>
                            </div>
                            <div class="col-sm-6">
                                <button class="btn btn-warning w-100 py-3 fw-bold fs-5 text-dark" id="buy-now-btn">MUA NGAY</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="bg-white p-4 rounded-3 border">
                        <h4 class="fw-bold mb-3 border-bottom pb-2">Đặc điểm nổi bật</h4>
                        <p>${product.description}</p>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="bg-white p-4 rounded-3 border specs-table">
                        <h4 class="fw-bold mb-3 border-bottom pb-2">Thông số kỹ thuật</h4>
                        <table class="table table-striped m-0 small">
                            <tbody>${specsRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        setupGallery();
        setupQuantitySelector();
        bindAddToCartButtons(container);
        setupBuyNow(product);
    });

    function renderStars(rating) {
        let html = "";
        for (let i = 1; i <= 5; i++) {
            if (rating >= i) html += `<i class="bi bi-star-fill"></i>`;
            else if (rating >= i - 0.5) html += `<i class="bi bi-star-half"></i>`;
            else html += `<i class="bi bi-star"></i>`;
        }
        return html;
    }

    function setupGallery() {
        const mainImg = document.getElementById("main-product-img");
        document.querySelectorAll(".thumbnail-item").forEach(thumb => {
            thumb.addEventListener("click", function () {
                mainImg.src = this.dataset.img;
                document.querySelectorAll(".thumbnail-item").forEach(t => t.classList.remove("active"));
                this.classList.add("active");
            });
        });
    }

    function setupQuantitySelector() {
        const input = document.getElementById("qty-input");
        document.getElementById("qty-minus").addEventListener("click", () => {
            input.value = Math.max(1, parseInt(input.value) - 1);
            syncQtyToButton();
        });
        document.getElementById("qty-plus").addEventListener("click", () => {
            input.value = Math.min(99, parseInt(input.value) + 1);
            syncQtyToButton();
        });
        syncQtyToButton();

        function syncQtyToButton() {
            const addBtn = document.querySelector(".add-to-cart-btn[data-id]");
            if (addBtn) addBtn.dataset.qty = input.value;
        }
    }

    function setupBuyNow(product) {
        const buyNowBtn = document.getElementById("buy-now-btn");
        if (!buyNowBtn) return;
        buyNowBtn.addEventListener("click", function () {
            const qty = parseInt(document.getElementById("qty-input").value) || 1;
            CartManager.addItem(product, qty);
            window.location.href = "cart.html";
        });
    }
});
