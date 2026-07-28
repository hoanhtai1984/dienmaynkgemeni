# Hướng Dẫn Nối Đơn Hàng & Liên Hệ Vào Google Sheet - Điện Máy NK

Sau khi làm xong các bước dưới, mỗi khi khách bấm **"XÁC NHẬN ĐẶT HÀNG"** ở giỏ hàng hoặc **"Gửi Yêu Cầu"** ở trang Liên hệ, thông tin sẽ **tự động ghi vào 1 file Google Sheet** để bạn theo dõi — không cần cài đặt gì thêm, không tốn phí.

## Bước 1 — Tạo Google Sheet

1. Vào [sheets.google.com](https://sheets.google.com) → tạo file mới, đặt tên ví dụ **"Đơn hàng Điện Máy NK"**.

## Bước 2 — Tạo Apps Script

1. Trong file Sheet vừa tạo, vào menu **Tiện ích mở rộng (Extensions) → Apps Script**.
2. Xoá hết code mẫu đang có sẵn (`function myFunction() {...}`), dán đoạn code dưới đây vào:

```javascript
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var type = e.parameter.type;
  var sheetName = type === "contact" ? "LienHe" : "DonHang";
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (type === "contact") {
      sheet.appendRow(["Thời gian", "Họ tên", "SĐT", "Email", "Chủ đề", "Nội dung"]);
    } else {
      sheet.appendRow(["Thời gian", "Họ tên", "SĐT", "Địa chỉ", "Thanh toán", "Sản phẩm", "Tổng tiền"]);
    }
  }

  if (type === "contact") {
    sheet.appendRow([
      new Date(), e.parameter.name, e.parameter.phone,
      e.parameter.email, e.parameter.subject, e.parameter.message
    ]);
  } else {
    sheet.appendRow([
      new Date(), e.parameter.name, e.parameter.phone,
      e.parameter.address, e.parameter.payment, e.parameter.items, e.parameter.total
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Bấm biểu tượng **Lưu (đĩa mềm)**.

## Bước 3 — Deploy thành Web App

1. Bấm nút **Triển khai (Deploy) → Triển khai mới (New deployment)** ở góc trên bên phải.
2. Bấm biểu tượng bánh răng cạnh "Select type" → chọn **Web app**.
3. Điền:
   - **Execute as**: `Me (email của bạn)`
   - **Who has access**: `Anyone` *(bắt buộc chọn Anyone thì website mới gửi được, dữ liệu vẫn chỉ mình bạn xem được trong Sheet)*
4. Bấm **Deploy**. Google sẽ hỏi xác nhận quyền (Authorize access) — chọn tài khoản Google của bạn, bấm **Advanced → Go to (tên project) → Allow**.
5. Sau khi deploy xong, Google hiện ra một **Web app URL** dạng:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   Copy URL này lại.

## Bước 4 — Dán URL vào website

Mở file [assets/js/order-config.js](assets/js/order-config.js), thay dòng:

```javascript
window.GOOGLE_SHEET_WEB_APP_URL = "PASTE_YOUR_WEB_APP_URL_HERE";
```

thành:

```javascript
window.GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

(dán đúng URL bạn vừa copy ở Bước 3). Lưu file lại — xong!

## Kiểm tra thử

1. Mở `cart.html`, thêm 1 sản phẩm vào giỏ, điền thông tin và bấm "XÁC NHẬN ĐẶT HÀNG".
2. Mở lại Google Sheet — sẽ thấy 1 sheet con tên **"DonHang"** tự động được tạo với dòng dữ liệu vừa gửi.
3. Tương tự, thử gửi form ở `lien-he.html` — dữ liệu sẽ nằm ở sheet **"LienHe"**.

## Lưu ý

- Nếu sau này bạn sửa lại code trong Apps Script, phải **Deploy → Manage deployments → chỉnh sửa (bút chì) → Version: New version → Deploy** thì thay đổi mới có hiệu lực (Save thôi chưa đủ).
- Muốn nhận thông báo tức thời qua điện thoại (không phải mở Sheet ra xem) thì có thể làm thêm bước gửi qua Telegram/Zalo — báo tôi khi cần, tôi sẽ bổ sung tiếp.
