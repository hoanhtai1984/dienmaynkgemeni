/*==================================================
    DIEN MAY NK - CART PAGE LOGIC
    ---------------------------------------------
    Render TOÀN BỘ giỏ hàng từ dữ liệu trong
    CartManager (localStorage) - không còn phụ thuộc
    vào 1 sản phẩm mẫu viết cứng trong HTML nữa.
==================================================*/

document.addEventListener("DOMContentLoaded", function () {
    const itemsContainer = document.getElementById("cart-items-container");
    const emptyState = document.getElementById("cart-empty-state");
    const tableHead = document.getElementById("cart-table-head");
    const continueLink = document.getElementById("continue-shopping-link");
    const totalItemsEl = document.getElementById("cart-total-items");
    const summarySubtotal = document.getElementById("summary-subtotal");
    const summaryTotal = document.getElementById("summary-total");
    const checkoutForm = document.getElementById("checkout-form");
    const checkoutBtn = document.getElementById("checkout-submit-btn");

    function render() {
        const cart = CartManager.getCart();

        totalItemsEl.textContent = CartManager.getTotalCount();

        if (cart.length === 0) {
            itemsContainer.innerHTML = "";
            emptyState.classList.remove("d-none");
            tableHead.classList.add("d-none");
            continueLink.classList.add("d-none");
            summarySubtotal.textContent = "0đ";
            summaryTotal.textContent = "0đ";
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        emptyState.classList.add("d-none");
        tableHead.classList.remove("d-none");
        continueLink.classList.remove("d-none");
        if (checkoutBtn) checkoutBtn.disabled = false;

        itemsContainer.innerHTML = cart.map(item => `
            <div class="row align-items-center py-3 border-bottom cart-item" data-cart-row="${item.id}">
                <div class="col-md-6 col-12 mb-3 mb-md-0">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${item.image}" alt="${item.name}" class="img-fluid border rounded" style="width: 80px; height: 80px; object-fit: contain;" onerror="${PRODUCT_IMG_ONERROR}">
                        <div>
                            <h6 class="fw-bold mb-1"><a href="product-detail.html?id=${item.id}" class="text-dark text-decoration-none">${item.name}</a></h6>
                            <span class="text-muted small">Thương hiệu: ${item.brand}</span>
                            <button class="btn btn-link btn-sm text-danger p-0 d-block mt-1 text-decoration-none remove-item-btn" data-id="${item.id}">
                                <i class="bi bi-trash3"></i> Xóa khỏi giỏ
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-2 col-4 text-start text-md-center">
                    <span class="d-md-none text-muted small">Giá: </span>
                    <span class="fw-bold item-price">${formatMoney(item.price)}</span>
                </div>
                <div class="col-md-2 col-4 text-center">
                    <div class="input-group input-group-sm justify-content-center">
                        <button class="btn btn-outline-secondary px-2 minus-btn" type="button" data-id="${item.id}">-</button>
                        <input type="text" class="form-control text-center quantity-input" value="${item.qty}" style="max-width: 40px;" readonly>
                        <button class="btn btn-outline-secondary px-2 plus-btn" type="button" data-id="${item.id}">+</button>
                    </div>
                </div>
                <div class="col-md-2 col-4 text-end">
                    <span class="d-md-none text-muted small">Tổng: </span>
                    <span class="fw-bold text-danger subtotal-price">${formatMoney(item.price * item.qty)}</span>
                </div>
            </div>
        `).join("");

        summarySubtotal.textContent = formatMoney(CartManager.getTotalPrice());
        summaryTotal.textContent = formatMoney(CartManager.getTotalPrice());

        bindRowEvents();
    }

    function bindRowEvents() {
        itemsContainer.querySelectorAll(".plus-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const id = this.dataset.id;
                const cart = CartManager.getCart();
                const item = cart.find(i => String(i.id) === String(id));
                if (item) CartManager.updateQty(id, item.qty + 1);
                render();
            });
        });

        itemsContainer.querySelectorAll(".minus-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const id = this.dataset.id;
                const cart = CartManager.getCart();
                const item = cart.find(i => String(i.id) === String(id));
                if (item && item.qty > 1) CartManager.updateQty(id, item.qty - 1);
                render();
            });
        });

        itemsContainer.querySelectorAll(".remove-item-btn").forEach(btn => {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                const id = this.dataset.id;
                if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?")) {
                    CartManager.removeItem(id);
                    render();
                }
            });
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const cart = CartManager.getCart();
            if (cart.length === 0) return;

            const paymentInput = document.querySelector('input[name="payment-method"]:checked');
            const itemsText = cart.map(item => `${item.name} x${item.qty} (${item.price.toLocaleString("vi-VN")}đ)`).join("; ");

            sendToSheet({
                type: "order",
                name: document.getElementById("checkout-name").value.trim(),
                phone: document.getElementById("checkout-phone").value.trim(),
                address: document.getElementById("checkout-address").value.trim(),
                payment: paymentInput && paymentInput.id === "pay-bank" ? "Chuyển khoản ngân hàng" : "Thanh toán khi nhận hàng (COD)",
                items: itemsText,
                total: CartManager.getTotalPrice().toLocaleString("vi-VN") + "đ"
            });

            CartManager.showToast("🎉 Đơn hàng của bạn đã được ghi nhận thành công!");
            CartManager.clearCart();
            checkoutForm.reset();
            render();
        });
    }

    render();
});
