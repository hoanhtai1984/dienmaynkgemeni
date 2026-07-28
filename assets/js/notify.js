/*==================================================
    DIEN MAY NK - GỬI ĐƠN HÀNG / LIÊN HỆ VỀ GOOGLE SHEET
    ---------------------------------------------
    Dùng chung cho cart.js (đặt hàng) và lien-he.html
    (liên hệ). Cần nạp SAU assets/js/order-config.js.
==================================================*/
function sendToSheet(payload) {
    const url = window.GOOGLE_SHEET_WEB_APP_URL;
    if (!url || url.indexOf("PASTE_") !== -1) {
        console.warn("Chưa cấu hình GOOGLE_SHEET_WEB_APP_URL trong assets/js/order-config.js — dữ liệu chưa được gửi đi đâu cả.");
        return Promise.resolve();
    }

    const formData = new FormData();
    Object.keys(payload).forEach(key => formData.append(key, payload[key]));

    // mode: "no-cors" vì Google Apps Script không trả CORS header;
    // ta không đọc được response nhưng dữ liệu vẫn được ghi vào Sheet.
    return fetch(url, { method: "POST", mode: "no-cors", body: formData })
        .catch(err => console.error("Lỗi gửi dữ liệu về Google Sheet:", err));
}
