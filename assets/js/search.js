/*==================================================
        DIEN MAY NK - AUTOCOMPLETE SEARCH LOGIC
    (Dữ liệu lấy qua ProductAPI thay vì mảng cứng,
    nên khi nối backend thật chỉ cần sửa products-data.js)
==================================================*/
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");
    const suggestionsBox = document.getElementById("search-suggestions");
    let debounceTimer;

    if (!searchInput || !suggestionsBox) return;

    searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        const keyword = searchInput.value.trim();

        if (keyword.length === 0) {
            hideSuggestions();
            return;
        }

        debounceTimer = setTimeout(() => {
            ProductAPI.search(keyword).then(renderSuggestions);
        }, 300);
    });

    function renderSuggestions(products) {
        if (products.length === 0) {
            suggestionsBox.innerHTML = `<div class="p-3 text-muted text-center small"><i class="bi bi-exclamation-circle"></i> Không tìm thấy sản phẩm phù hợp</div>`;
            suggestionsBox.classList.remove("d-none");
            return;
        }

        let htmlContent = "";
        products.slice(0, 6).forEach(prod => {
            htmlContent += `
                <a href="product-detail.html?id=${prod.id}" class="suggestion-item">
                    <img src="${prod.image}" alt="${prod.name}" class="suggestion-img" onerror="${PRODUCT_IMG_ONERROR}">
                    <div class="flex-grow-1 min-width-0">
                        <h6 class="suggestion-title text-dark text-truncate">${prod.name}</h6>
                        <span class="suggestion-price">${formatMoney(prod.price)}</span>
                    </div>
                </a>
            `;
        });

        suggestionsBox.innerHTML = htmlContent;
        suggestionsBox.classList.remove("d-none");
    }

    function hideSuggestions() {
        suggestionsBox.classList.add("d-none");
        suggestionsBox.innerHTML = "";
    }

    document.addEventListener("click", function (event) {
        if (!searchInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
            hideSuggestions();
        }
    });

    searchInput.addEventListener("focus", function () {
        if (searchInput.value.trim().length > 0) {
            suggestionsBox.classList.remove("d-none");
        }
    });
});
