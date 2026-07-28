/*==================================================
    DIEN MAY NK - CART MANAGER (localStorage)
    ---------------------------------------------
    Giỏ hàng dùng chung cho MỌI trang (index, category,
    product-detail, cart). Dữ liệu được lưu ở localStorage
    nên thêm sản phẩm ở trang này, qua trang khác vẫn còn.

    ➜ KHI CÓ BACKEND RIÊNG (giỏ hàng theo tài khoản):
    Đổi các hàm getCart()/saveCart() bên dưới để gọi
    fetch('/api/cart', ...) thay vì đọc/ghi localStorage.
    Vì mọi hàm gọi ra ngoài (addToCart, removeItem,...)
    đều đã tách riêng, các trang khác không cần sửa.
==================================================*/

const CartManager = (function () {
    const STORAGE_KEY = "dmnk_cart_v1";

    function getCart() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Lỗi đọc giỏ hàng:", e);
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        updateBadge();
    }

    /** Thêm sản phẩm vào giỏ. Nếu đã có thì cộng dồn số lượng. */
    function addItem(product, qty = 1) {
        const cart = getCart();
        const existing = cart.find(item => String(item.id) === String(product.id));

        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                brand: product.brand,
                price: product.price,
                image: product.image,
                qty: qty
            });
        }
        saveCart(cart);
        return cart;
    }

    function removeItem(id) {
        const cart = getCart().filter(item => String(item.id) !== String(id));
        saveCart(cart);
        return cart;
    }

    function updateQty(id, qty) {
        const cart = getCart();
        const item = cart.find(item => String(item.id) === String(id));
        if (item) {
            item.qty = Math.max(1, Math.min(99, qty));
        }
        saveCart(cart);
        return cart;
    }

    function clearCart() {
        saveCart([]);
    }

    function getTotalCount() {
        return getCart().reduce((sum, item) => sum + item.qty, 0);
    }

    function getTotalPrice() {
        return getCart().reduce((sum, item) => sum + item.qty * item.price, 0);
    }

    /** Cập nhật số hiển thị trên icon giỏ hàng ở header (mọi trang). */
    function updateBadge() {
        const badge = document.querySelector(".cart-count");
        if (badge) badge.textContent = getTotalCount();
    }

    /** Toast thông báo nhỏ gọn thay cho alert(), không chặn thao tác người dùng. */
    function showToast(message, type = "success") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = "app-toast " + type;
        toast.innerHTML = `<i class="bi bi-check-circle-fill"></i><span>${message}</span>`;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add("show"));

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 350);
        }, 2500);
    }

    return {
        getCart,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        getTotalCount,
        getTotalPrice,
        updateBadge,
        showToast
    };
})();

/*==================================================
    Gắn sự kiện "Thêm vào giỏ" cho mọi nút có class
    .add-to-cart-btn trên bất kỳ trang nào, miễn là
    nút có thuộc tính data-id trỏ đúng ID sản phẩm.
==================================================*/
function bindAddToCartButtons(container = document) {
    const buttons = container.querySelectorAll(".add-to-cart-btn[data-id]");
    buttons.forEach(button => {
        // Tránh gắn trùng sự kiện nếu hàm được gọi lại nhiều lần
        if (button.dataset.bound === "1") return;
        button.dataset.bound = "1";

        button.addEventListener("click", function (e) {
            e.preventDefault();
            const id = Number(button.dataset.id);
            const qty = Number(button.dataset.qty) || 1;

            ProductAPI.getById(id).then(product => {
                if (!product) return;
                CartManager.addItem(product, qty);
                CartManager.showToast(`Đã thêm "${product.name}" vào giỏ hàng`);

                // Hiệu ứng nhấp nháy icon giỏ hàng
                const cartBtn = document.querySelector(".cart-btn");
                if (cartBtn) {
                    cartBtn.style.backgroundColor = "#0d6efd";
                    setTimeout(() => { cartBtn.style.backgroundColor = ""; }, 300);
                }
            });
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    CartManager.updateBadge();
    bindAddToCartButtons();
});
