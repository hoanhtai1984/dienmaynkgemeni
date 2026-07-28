/*==================================================
    DIEN MAY NK - PRODUCT DATA LAYER
    ---------------------------------------------
    File này đóng vai trò "lớp dữ liệu" (data layer).
    Toàn bộ trang (trang chủ, category, product-detail,
    search...) chỉ gọi qua đối tượng `ProductAPI` bên
    dưới, KHÔNG bao giờ đọc thẳng mảng PRODUCTS.

    ẢNH SẢN PHẨM:
    Mỗi sản phẩm trỏ tới assets/images/products/<id>.jpg
    (vd sản phẩm id=15 -> assets/images/products/15.jpg).
    Các file này CHƯA tồn tại - khi bạn có ảnh chụp thật,
    chỉ cần đặt đúng tên file và bỏ vào đúng thư mục là
    ảnh sẽ tự động hiển thị, không cần sửa code gì thêm.
    Trong lúc chưa có ảnh, toàn bộ <img> trên site có gắn
    sẵn onerror để tự hiện ảnh placeholder cục bộ (không
    phụ thuộc mạng ngoài) thay vì hiện icon ảnh vỡ.
    Xem chi tiết hướng dẫn tại file HUONG-DAN-ANH-SAN-PHAM.md

    Toàn bộ 83 sản phẩm của website nằm chung trong 1
    nguồn dữ liệu DUY NHẤT. Discount (%) luôn được tính
    tự động từ price/oldPrice - không gõ tay nên không
    bao giờ bị sai lệch. Lượt bán/đánh giá được tính theo
    bậc giá tiền (sản phẩm rẻ bán chạy hơn) để số liệu
    trông hợp lý, nhất quán giống một website thật.

    ➜ KHI CÓ BACKEND RIÊNG:
    Bạn chỉ cần sửa nội dung bên trong các hàm của
    ProductAPI để gọi `fetch('/api/products')...`
    thay vì lọc mảng cục bộ. Vì mọi hàm đều trả về
    Promise (giống hệt gọi API thật), toàn bộ code ở
    các trang khác sẽ KHÔNG cần sửa gì cả.
==================================================*/

const PRODUCT_IMAGE_FALLBACK = "assets/images/no-image.svg";

const PRODUCTS = [
    {
        "id": 1,
        "name": "Nồi chiên không dầu Panasonic PALV-600 6 Lít",
        "brand": "Panasonic",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 1990000,
        "oldPrice": 2990000,
        "discount": 33,
        "rating": 4.6,
        "reviewCount": 47,
        "sold": 133,
        "badge": "Bán chạy nhất",
        "image": "assets/images/products/1.jpg",
        "images": [
            "assets/images/products/1.jpg"
        ],
        "description": "Nồi chiên không dầu Panasonic PALV-600 sở hữu dung tích lớn lên đến 6 Lít, phù hợp cho gia đình từ 4-6 thành viên. Sử dụng công nghệ đốt nóng chân không Rapid Air tiên tiến giúp thực hiện các món chiên nướng giòn rụm mà không cần sử dụng dầu mỡ, bảo vệ sức khỏe tim mạch cho cả gia đình.",
        "specs": {
            "Dung tích": "6.0 Lít",
            "Công suất": "1800W",
            "Công nghệ": "Rapid Air chân không",
            "Chất liệu lòng nồi": "Hợp kim chống dính cao cấp",
            "Bảo hành": "12 tháng chính hãng"
        },
        "subSubCategory": "noi-chien-khong-dau"
    },
    {
        "id": 2,
        "name": "Nồi cơm điện cao tần Panasonic 1.8 Lít",
        "brand": "Panasonic",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 3450000,
        "oldPrice": 3450000,
        "discount": 0,
        "rating": 4.2,
        "reviewCount": 24,
        "sold": 75,
        "badge": "",
        "image": "assets/images/products/2.jpg",
        "images": [
            "assets/images/products/2.jpg"
        ],
        "description": "Nồi cơm điện tử cao tần Panasonic với công nghệ IH giúp cơm chín đều, dẻo thơm tự nhiên. Có nhiều chế độ nấu cho các loại gạo và món ăn khác nhau.",
        "specs": {
            "Dung tích": "1.8 Lít",
            "Công nghệ": "IH cao tần",
            "Bảo hành": "12 tháng"
        },
        "subSubCategory": "noi-com-dien"
    },
    {
        "id": 3,
        "name": "Nồi Chiên Không Dầu Điện Tử Philips HD9252/90 4.1L",
        "brand": "Philips",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 2390000,
        "oldPrice": 3410000,
        "discount": 30,
        "rating": 4.6,
        "reviewCount": 40,
        "sold": 138,
        "badge": "Sắp cháy hàng",
        "image": "assets/images/products/3.jpg",
        "images": [
            "assets/images/products/3.jpg"
        ],
        "description": "Nồi chiên không dầu Philips HD9252/90 dung tích 4.1L với công nghệ Rapid Air độc quyền, thiết kế nhỏ gọn phù hợp gia đình 2-3 người.",
        "specs": {
            "Dung tích": "4.1 Lít",
            "Công suất": "1400W",
            "Bảo hành": "24 tháng"
        },
        "subSubCategory": "noi-chien-khong-dau"
    },
    {
        "id": 4,
        "name": "Máy Xay Sinh Tố Sharp EM-ICE2V-WH Công Suất 600W",
        "brand": "Sharp",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 890000,
        "oldPrice": 1190000,
        "discount": 25,
        "rating": 4.3,
        "reviewCount": 69,
        "sold": 191,
        "badge": "",
        "image": "assets/images/products/4.jpg",
        "images": [
            "assets/images/products/4.jpg"
        ],
        "description": "Máy xay sinh tố Sharp công suất 600W, cối xay dung tích lớn, lưỡi dao 4 cạnh sắc bén xay nhuyễn mọi loại thực phẩm.",
        "specs": {
            "Công suất": "600W",
            "Dung tích cối": "1.5 Lít",
            "Bảo hành": "12 tháng"
        },
        "subSubCategory": "may-xay-sinh-to"
    },
    {
        "id": 5,
        "name": "Tủ Lạnh Toshiba Inverter 180 Lít GR-RT234WE-PMV(01)",
        "brand": "Toshiba",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "tu-lanh",
        "subCategoryName": "Tủ Lạnh, Tủ Đông, Tủ Mát",
        "price": 4850000,
        "oldPrice": 5700000,
        "discount": 15,
        "rating": 4.6,
        "reviewCount": 30,
        "sold": 92,
        "badge": "Vừa mở bán",
        "image": "assets/images/products/5.jpg",
        "images": [
            "assets/images/products/5.jpg"
        ],
        "description": "Tủ lạnh Toshiba Inverter 180 Lít tiết kiệm điện, ngăn đông mềm mại, thiết kế nhỏ gọn phù hợp căn hộ, phòng trọ.",
        "specs": {
            "Dung tích": "180 Lít",
            "Công nghệ": "Inverter",
            "Bảo hành": "24 tháng"
        }
    },
    {
        "id": 6,
        "name": "Máy Lọc Nước RO Kangaroo KG109A 9 Lõi Thế Hệ Mới",
        "brand": "Kangaroo",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "may-loc-nuoc",
        "subCategoryName": "Máy Lọc Nước, Cây Nước Nóng Lạnh, Làm Đá",
        "price": 3990000,
        "oldPrice": 4900000,
        "discount": 19,
        "rating": 4.3,
        "reviewCount": 22,
        "sold": 74,
        "badge": "",
        "image": "assets/images/products/6.jpg",
        "images": [
            "assets/images/products/6.jpg"
        ],
        "description": "Máy lọc nước RO Kangaroo 9 lõi lọc, loại bỏ hoàn toàn tạp chất, kim loại nặng, vi khuẩn, mang lại nguồn nước tinh khiết cho cả gia đình.",
        "specs": {
            "Số lõi lọc": "9 lõi",
            "Công nghệ": "RO",
            "Bảo hành": "24 tháng"
        }
    },
    {
        "id": 7,
        "name": "Tủ lạnh Samsung Inverter 400 Lít",
        "brand": "Samsung",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "tu-lanh",
        "subCategoryName": "Tủ Lạnh, Tủ Đông, Tủ Mát",
        "price": 12890000,
        "oldPrice": 14500000,
        "discount": 11,
        "rating": 4.7,
        "reviewCount": 5,
        "sold": 13,
        "badge": "Bán chạy nhất",
        "image": "assets/images/products/7.jpg",
        "images": [
            "assets/images/products/7.jpg"
        ],
        "description": "Tủ lạnh Samsung Inverter 400 Lít với ngăn đông mềm linh hoạt, tiết kiệm điện vượt trội, phù hợp cho gia đình đông thành viên.",
        "specs": {
            "Dung tích": "400 Lít",
            "Công nghệ": "Inverter",
            "Bảo hành": "24 tháng"
        }
    },
    {
        "id": 8,
        "name": "Smart Tivi Sony 4K 55 inch",
        "brand": "Sony",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "tivi",
        "subCategoryName": "Tivi",
        "price": 14200000,
        "oldPrice": 16900000,
        "discount": 16,
        "rating": 4.3,
        "reviewCount": 7,
        "sold": 20,
        "badge": "",
        "image": "assets/images/products/8.jpg",
        "images": [
            "assets/images/products/8.jpg"
        ],
        "description": "Smart Tivi Sony 4K 55 inch cho hình ảnh sắc nét, màu sắc chân thực với công nghệ xử lý hình ảnh độc quyền của Sony.",
        "specs": {
            "Kích thước": "55 inch",
            "Độ phân giải": "4K UHD",
            "Bảo hành": "24 tháng"
        }
    },
    {
        "id": 9,
        "name": "Máy giặt LG Lồng ngang 9kg",
        "brand": "LG",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-giat",
        "subCategoryName": "Máy Giặt",
        "price": 8150000,
        "oldPrice": 9500000,
        "discount": 14,
        "rating": 4.7,
        "reviewCount": 11,
        "sold": 37,
        "badge": "",
        "image": "assets/images/products/9.jpg",
        "images": [
            "assets/images/products/9.jpg"
        ],
        "description": "Máy giặt LG lồng ngang 9kg với công nghệ giặt hơi nước diệt khuẩn, tiết kiệm nước và điện năng vượt trội.",
        "specs": {
            "Khối lượng giặt": "9 kg",
            "Loại lồng": "Lồng ngang",
            "Bảo hành": "24 tháng"
        }
    },
    {
        "id": 10,
        "name": "Quạt cây lửng Mitsubishi có điều khiển",
        "brand": "Mitsubishi",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "quat-lam-mat",
        "subCategoryName": "Quạt, Thiết Bị Làm Mát",
        "price": 1650000,
        "oldPrice": 1650000,
        "discount": 0,
        "rating": 4.4,
        "reviewCount": 29,
        "sold": 105,
        "badge": "",
        "image": "assets/images/products/10.jpg",
        "images": [
            "assets/images/products/10.jpg"
        ],
        "description": "Quạt cây lửng Mitsubishi vận hành êm ái, có điều khiển từ xa tiện lợi, nhiều chế độ gió phù hợp mọi nhu cầu sử dụng.",
        "specs": {
            "Loại quạt": "Quạt cây lửng",
            "Điều khiển": "Remote",
            "Bảo hành": "12 tháng"
        }
    },
    {
        "id": 11,
        "name": "Máy pha cà phê Espresso tự động De'Longhi",
        "brand": "De'Longhi",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 6990000,
        "oldPrice": 8500000,
        "discount": 18,
        "rating": 4.7,
        "reviewCount": 18,
        "sold": 51,
        "badge": "",
        "image": "assets/images/products/11.jpg",
        "images": [
            "assets/images/products/11.jpg"
        ],
        "description": "Máy pha cà phê Espresso tự động, tích hợp xay hạt tươi ngay trong máy, cho ra tách cà phê đậm đà chuẩn vị Ý.",
        "specs": {
            "Loại": "Espresso tự động",
            "Áp suất": "15 Bar",
            "Bảo hành": "12 tháng"
        },
        "subSubCategory": "may-pha-ca-phe"
    },
    {
        "id": 12,
        "name": "Máy đo huyết áp bắp tay Omron",
        "brand": "Omron",
        "category": "thiet-bi-lam-dep-cham-soc",
        "categoryName": "Thiết Bị Làm Đẹp Và Chăm Sóc Cá Nhân",
        "subCategory": "thiet-bi-cham-soc-ca-nhan",
        "subCategoryName": "Thiết Bị Chăm Sóc Cá Nhân",
        "price": 750000,
        "oldPrice": 890000,
        "discount": 16,
        "rating": 4.4,
        "reviewCount": 94,
        "sold": 293,
        "badge": "",
        "image": "assets/images/products/12.jpg",
        "images": [
            "assets/images/products/12.jpg"
        ],
        "description": "Máy đo huyết áp bắp tay Omron cho kết quả chính xác cao, màn hình LCD lớn dễ đọc, phù hợp theo dõi sức khỏe tại nhà.",
        "specs": {
            "Vị trí đo": "Bắp tay",
            "Bộ nhớ": "30 lần đo gần nhất",
            "Bảo hành": "60 tháng"
        }
    },
    {
        "id": 13,
        "name": "Robot hút bụi lau nhà Ecovacs",
        "brand": "Ecovacs",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "may-hut-bui",
        "subCategoryName": "Máy Hút Bụi",
        "price": 5490000,
        "oldPrice": 6990000,
        "discount": 21,
        "rating": 4.8,
        "reviewCount": 26,
        "sold": 90,
        "badge": "",
        "image": "assets/images/products/13.jpg",
        "images": [
            "assets/images/products/13.jpg"
        ],
        "description": "Robot hút bụi lau nhà thông minh, tự động lập bản đồ, điều khiển qua app điện thoại, thay bạn dọn dẹp nhà cửa mỗi ngày.",
        "specs": {
            "Chức năng": "Hút bụi + Lau nhà",
            "Điều khiển": "App / Remote",
            "Bảo hành": "12 tháng"
        }
    },
    {
        "id": 14,
        "name": "Máy sấy tóc Philips ion âm 2000W",
        "brand": "Philips",
        "category": "thiet-bi-lam-dep-cham-soc",
        "categoryName": "Thiết Bị Làm Đẹp Và Chăm Sóc Cá Nhân",
        "subCategory": "thiet-bi-cham-soc-ca-nhan",
        "subCategoryName": "Thiết Bị Chăm Sóc Cá Nhân",
        "price": 590000,
        "oldPrice": 690000,
        "discount": 14,
        "rating": 4.4,
        "reviewCount": 86,
        "sold": 238,
        "badge": "",
        "image": "assets/images/products/14.jpg",
        "images": [
            "assets/images/products/14.jpg"
        ],
        "description": "Máy sấy tóc Philips công nghệ ion âm giúp tóc nhanh khô, bóng mượt và giảm gãy rụng so với máy sấy thông thường.",
        "specs": {
            "Công suất": "2000W",
            "Công nghệ": "Ion âm",
            "Bảo hành": "12 tháng"
        }
    },
    {
        "id": 15,
        "name": "Lò Vi Sóng Có Nướng Panasonic PALV-NN-GT35HMYUE",
        "brand": "Panasonic",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 3290000,
        "oldPrice": 4990000,
        "discount": 34,
        "rating": 4.8,
        "reviewCount": 18,
        "sold": 54,
        "badge": "",
        "image": "assets/images/products/15.jpg",
        "images": [
            "assets/images/products/15.jpg"
        ],
        "description": "Lò Vi Sóng Có Nướng Panasonic PALV-NN-GT35HMYUE đến từ thương hiệu Panasonic, giúp công việc bếp núc và sinh hoạt hàng ngày trở nên tiện lợi, tiết kiệm thời gian hơn cho cả gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Panasonic",
            "Bảo hành": "12 tháng chính hãng"
        },
        "subSubCategory": "lo-vi-song"
    },
    {
        "id": 16,
        "name": "Máy Lạnh Daikin Inverter 1 HP ATKF25XVMV Mới 2026",
        "brand": "Daikin",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-lanh",
        "subCategoryName": "Máy Lạnh",
        "price": 9490000,
        "oldPrice": 11890000,
        "discount": 20,
        "rating": 4.4,
        "reviewCount": 12,
        "sold": 40,
        "badge": "",
        "image": "assets/images/products/16.jpg",
        "images": [
            "assets/images/products/16.jpg"
        ],
        "description": "Máy Lạnh Daikin Inverter 1 HP ATKF25XVMV Mới 2026 đến từ thương hiệu Daikin, vận hành bền bỉ, tiết kiệm điện vượt trội, phù hợp với nhu cầu sử dụng lâu dài của gia đình Việt. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Công suất lạnh": "1 HP",
            "Thương hiệu": "Daikin",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 17,
        "name": "Máy Lạnh Casper Inverter 1 HP TC-09IS36 Tiết Kiệm Điện",
        "brand": "Casper",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-lanh",
        "subCategoryName": "Máy Lạnh",
        "price": 5690000,
        "oldPrice": 7290000,
        "discount": 22,
        "rating": 4.8,
        "reviewCount": 33,
        "sold": 89,
        "badge": "",
        "image": "assets/images/products/17.jpg",
        "images": [
            "assets/images/products/17.jpg"
        ],
        "description": "Máy Lạnh Casper Inverter 1 HP TC-09IS36 Tiết Kiệm Điện đến từ thương hiệu Casper, vận hành bền bỉ, tiết kiệm điện vượt trội, phù hợp với nhu cầu sử dụng lâu dài của gia đình Việt. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Công suất lạnh": "1 HP",
            "Thương hiệu": "Casper",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 18,
        "name": "Máy Pha Cà Phê Delonghi ECP31.21 Bán Tự Động Cao Cấp",
        "brand": "Delonghi",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 3890000,
        "oldPrice": 6500000,
        "discount": 40,
        "rating": 4.5,
        "reviewCount": 24,
        "sold": 71,
        "badge": "",
        "image": "assets/images/products/18.jpg",
        "images": [
            "assets/images/products/18.jpg"
        ],
        "description": "Máy Pha Cà Phê Delonghi ECP31.21 Bán Tự Động Cao Cấp đến từ thương hiệu Delonghi, mang đến tách cà phê thơm ngon chuẩn vị ngay tại nhà, thao tác đơn giản chỉ với một chạm. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Delonghi",
            "Bảo hành": "12 tháng chính hãng"
        },
        "subSubCategory": "may-pha-ca-phe"
    },
    {
        "id": 19,
        "name": "Google Tivi Sony 4K 55 inch KD-55X75K thế hệ mới",
        "brand": "Sony",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "tivi",
        "subCategoryName": "Tivi",
        "price": 12490000,
        "oldPrice": 12490000,
        "discount": 0,
        "rating": 4.8,
        "reviewCount": 9,
        "sold": 28,
        "badge": "",
        "image": "assets/images/products/19.jpg",
        "images": [
            "assets/images/products/19.jpg"
        ],
        "description": "Google Tivi Sony 4K 55 inch KD-55X75K thế hệ mới đến từ thương hiệu Sony, mang đến trải nghiệm hình ảnh và âm thanh sống động, chân thực cho không gian giải trí gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Kích thước màn hình": "55 inch",
            "Thương hiệu": "Sony",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 20,
        "name": "Dàn Âm Thanh Sony MHC-M22D Bluetooth Công Suất Cao",
        "brand": "Sony",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "loa-thanh",
        "subCategoryName": "Loa Thanh",
        "price": 4290000,
        "oldPrice": 4290000,
        "discount": 0,
        "rating": 4.5,
        "reviewCount": 30,
        "sold": 106,
        "badge": "",
        "image": "assets/images/products/20.jpg",
        "images": [
            "assets/images/products/20.jpg"
        ],
        "description": "Dàn Âm Thanh Sony MHC-M22D Bluetooth Công Suất Cao đến từ thương hiệu Sony, mang đến trải nghiệm hình ảnh và âm thanh sống động, chân thực cho không gian giải trí gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Sony",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 21,
        "name": "Smart Tivi Samsung UHD 4K 65 inch UA65DU7000",
        "brand": "Samsung",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "tivi",
        "subCategoryName": "Tivi",
        "price": 14890000,
        "oldPrice": 14890000,
        "discount": 0,
        "rating": 4.9,
        "reviewCount": 7,
        "sold": 19,
        "badge": "",
        "image": "assets/images/products/21.jpg",
        "images": [
            "assets/images/products/21.jpg"
        ],
        "description": "Smart Tivi Samsung UHD 4K 65 inch UA65DU7000 đến từ thương hiệu Samsung, mang đến trải nghiệm hình ảnh và âm thanh sống động, chân thực cho không gian giải trí gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Kích thước màn hình": "65 inch",
            "Thương hiệu": "Samsung",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 22,
        "name": "Loa Bluetooth Di Động JBL PartyBox Encore 100W",
        "brand": "JBL",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "loa-thanh",
        "subCategoryName": "Loa Thanh",
        "price": 6590000,
        "oldPrice": 6590000,
        "discount": 0,
        "rating": 4.5,
        "reviewCount": 12,
        "sold": 36,
        "badge": "",
        "image": "assets/images/products/22.jpg",
        "images": [
            "assets/images/products/22.jpg"
        ],
        "description": "Loa Bluetooth Di Động JBL PartyBox Encore 100W đến từ thương hiệu JBL, mang đến trải nghiệm hình ảnh và âm thanh sống động, chân thực cho không gian giải trí gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Công suất": "100W",
            "Thương hiệu": "JBL",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 23,
        "name": "Smart Tivi LG 4K UHD 50 inch 50UT8050PSB",
        "brand": "LG",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "tivi",
        "subCategoryName": "Tivi",
        "price": 9490000,
        "oldPrice": 9490000,
        "discount": 0,
        "rating": 4.9,
        "reviewCount": 12,
        "sold": 43,
        "badge": "",
        "image": "assets/images/products/23.jpg",
        "images": [
            "assets/images/products/23.jpg"
        ],
        "description": "Smart Tivi LG 4K UHD 50 inch 50UT8050PSB đến từ thương hiệu LG, mang đến trải nghiệm hình ảnh và âm thanh sống động, chân thực cho không gian giải trí gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Kích thước màn hình": "50 inch",
            "Thương hiệu": "LG",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 24,
        "name": "Loa Thanh Soundbar LG S40Q 300W 2.1 Kênh",
        "brand": "LG",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "loa-thanh",
        "subCategoryName": "Loa Thanh",
        "price": 2190000,
        "oldPrice": 2190000,
        "discount": 0,
        "rating": 4.6,
        "reviewCount": 50,
        "sold": 140,
        "badge": "",
        "image": "assets/images/products/24.jpg",
        "images": [
            "assets/images/products/24.jpg"
        ],
        "description": "Loa Thanh Soundbar LG S40Q 300W 2.1 Kênh đến từ thương hiệu LG, mang đến trải nghiệm hình ảnh và âm thanh sống động, chân thực cho không gian giải trí gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Công suất": "300W",
            "Thương hiệu": "LG",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 25,
        "name": "Google Tivi TCL 4K UHD 43 inch 43P755 Mới",
        "brand": "TCL",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "tivi",
        "subCategoryName": "Tivi",
        "price": 5890000,
        "oldPrice": 5890000,
        "discount": 0,
        "rating": 4.2,
        "reviewCount": 29,
        "sold": 87,
        "badge": "",
        "image": "assets/images/products/25.jpg",
        "images": [
            "assets/images/products/25.jpg"
        ],
        "description": "Google Tivi TCL 4K UHD 43 inch 43P755 Mới đến từ thương hiệu TCL, mang đến trải nghiệm hình ảnh và âm thanh sống động, chân thực cho không gian giải trí gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Kích thước màn hình": "43 inch",
            "Thương hiệu": "TCL",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 26,
        "name": "Loa Kéo Karaoke Dalton TS-15G600X Bass 40cm",
        "brand": "Dalton",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "loa-thanh",
        "subCategoryName": "Loa Thanh",
        "price": 5290000,
        "oldPrice": 5290000,
        "discount": 0,
        "rating": 4.6,
        "reviewCount": 21,
        "sold": 69,
        "badge": "",
        "image": "assets/images/products/26.jpg",
        "images": [
            "assets/images/products/26.jpg"
        ],
        "description": "Loa Kéo Karaoke Dalton TS-15G600X Bass 40cm đến từ thương hiệu Dalton, mang đến trải nghiệm hình ảnh và âm thanh sống động, chân thực cho không gian giải trí gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Dalton",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 27,
        "name": "[Xem Thêm] Google Tivi Coocaa 4K 55 inch 55Y72",
        "brand": "Coocaa",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "tivi",
        "subCategoryName": "Tivi",
        "price": 6490000,
        "oldPrice": 6490000,
        "discount": 0,
        "rating": 4.2,
        "reviewCount": 9,
        "sold": 25,
        "badge": "",
        "image": "assets/images/products/27.jpg",
        "images": [
            "assets/images/products/27.jpg"
        ],
        "description": "[Xem Thêm] Google Tivi Coocaa 4K 55 inch 55Y72 đến từ thương hiệu Coocaa, mang đến trải nghiệm hình ảnh và âm thanh sống động, chân thực cho không gian giải trí gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Kích thước màn hình": "55 inch",
            "Thương hiệu": "Coocaa",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 28,
        "name": "Tủ Lạnh Panasonic Inverter 322 Lít NR-BC360QKVN",
        "brand": "Panasonic",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "tu-lanh",
        "subCategoryName": "Tủ Lạnh, Tủ Đông, Tủ Mát",
        "price": 11490000,
        "oldPrice": 11490000,
        "discount": 0,
        "rating": 4.6,
        "reviewCount": 7,
        "sold": 22,
        "badge": "",
        "image": "assets/images/products/28.jpg",
        "images": [
            "assets/images/products/28.jpg"
        ],
        "description": "Tủ Lạnh Panasonic Inverter 322 Lít NR-BC360QKVN đến từ thương hiệu Panasonic, vận hành bền bỉ, tiết kiệm điện vượt trội, phù hợp với nhu cầu sử dụng lâu dài của gia đình Việt. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Dung tích": "322 Lít",
            "Thương hiệu": "Panasonic",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 29,
        "name": "Máy Giặt LG AI DD Inverter Lồng Ngang 9 Kg FV1409S4W",
        "brand": "LG",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-giat",
        "subCategoryName": "Máy Giặt",
        "price": 8490000,
        "oldPrice": 8490000,
        "discount": 0,
        "rating": 4.3,
        "reviewCount": 12,
        "sold": 39,
        "badge": "",
        "image": "assets/images/products/29.jpg",
        "images": [
            "assets/images/products/29.jpg"
        ],
        "description": "Máy Giặt LG AI DD Inverter Lồng Ngang 9 Kg FV1409S4W đến từ thương hiệu LG, vận hành bền bỉ, tiết kiệm điện vượt trội, phù hợp với nhu cầu sử dụng lâu dài của gia đình Việt. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Khối lượng": "9 Kg",
            "Công suất": "4W",
            "Thương hiệu": "LG",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 30,
        "name": "Máy Lạnh LG Inverter 1 HP V10WIN Mới 2026",
        "brand": "LG",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-lanh",
        "subCategoryName": "Máy Lạnh",
        "price": 7290000,
        "oldPrice": 7290000,
        "discount": 0,
        "rating": 4.7,
        "reviewCount": 13,
        "sold": 46,
        "badge": "",
        "image": "assets/images/products/30.jpg",
        "images": [
            "assets/images/products/30.jpg"
        ],
        "description": "Máy Lạnh LG Inverter 1 HP V10WIN Mới 2026 đến từ thương hiệu LG, vận hành bền bỉ, tiết kiệm điện vượt trội, phù hợp với nhu cầu sử dụng lâu dài của gia đình Việt. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Công suất lạnh": "1 HP",
            "Công suất": "10W",
            "Thương hiệu": "LG",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 31,
        "name": "Tủ Lạnh Aqua Inverter MultiDoor 456 Lít AQR-IGW525AM",
        "brand": "Aqua",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "tu-lanh",
        "subCategoryName": "Tủ Lạnh, Tủ Đông, Tủ Mát",
        "price": 14390000,
        "oldPrice": 14390000,
        "discount": 0,
        "rating": 4.3,
        "reviewCount": 7,
        "sold": 20,
        "badge": "",
        "image": "assets/images/products/31.jpg",
        "images": [
            "assets/images/products/31.jpg"
        ],
        "description": "Tủ Lạnh Aqua Inverter MultiDoor 456 Lít AQR-IGW525AM đến từ thương hiệu Aqua, vận hành bền bỉ, tiết kiệm điện vượt trội, phù hợp với nhu cầu sử dụng lâu dài của gia đình Việt. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Dung tích": "456 Lít",
            "Thương hiệu": "Aqua",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 32,
        "name": "Máy Giặt Toshiba Inverter Lồng Đứng 10 Kg AW-DUK1100HV",
        "brand": "Toshiba",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-giat",
        "subCategoryName": "Máy Giặt",
        "price": 5490000,
        "oldPrice": 5490000,
        "discount": 0,
        "rating": 4.7,
        "reviewCount": 33,
        "sold": 103,
        "badge": "",
        "image": "assets/images/products/32.jpg",
        "images": [
            "assets/images/products/32.jpg"
        ],
        "description": "Máy Giặt Toshiba Inverter Lồng Đứng 10 Kg AW-DUK1100HV đến từ thương hiệu Toshiba, vận hành bền bỉ, tiết kiệm điện vượt trội, phù hợp với nhu cầu sử dụng lâu dài của gia đình Việt. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Khối lượng": "10 Kg",
            "Thương hiệu": "Toshiba",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 33,
        "name": "Tủ Đông Sanaky 280 Lít VH-3699W1 2 Ngăn Đông Mát",
        "brand": "Sanaky",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "tu-lanh",
        "subCategoryName": "Tủ Lạnh, Tủ Đông, Tủ Mát",
        "price": 6150000,
        "oldPrice": 6150000,
        "discount": 0,
        "rating": 4.3,
        "reviewCount": 6,
        "sold": 21,
        "badge": "",
        "image": "assets/images/products/33.jpg",
        "images": [
            "assets/images/products/33.jpg"
        ],
        "description": "Tủ Đông Sanaky 280 Lít VH-3699W1 2 Ngăn Đông Mát đến từ thương hiệu Sanaky, vận hành bền bỉ, tiết kiệm điện vượt trội, phù hợp với nhu cầu sử dụng lâu dài của gia đình Việt. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Dung tích": "280 Lít",
            "Công suất": "3699W",
            "Thương hiệu": "Sanaky",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 34,
        "name": "Máy Giặt Panasonic Lồng Đứng 9 Kg NA-F90S10BRV",
        "brand": "Panasonic",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-giat",
        "subCategoryName": "Máy Giặt",
        "price": 6190000,
        "oldPrice": 6190000,
        "discount": 0,
        "rating": 4.7,
        "reviewCount": 10,
        "sold": 28,
        "badge": "",
        "image": "assets/images/products/34.jpg",
        "images": [
            "assets/images/products/34.jpg"
        ],
        "description": "Máy Giặt Panasonic Lồng Đứng 9 Kg NA-F90S10BRV đến từ thương hiệu Panasonic, vận hành bền bỉ, tiết kiệm điện vượt trội, phù hợp với nhu cầu sử dụng lâu dài của gia đình Việt. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Khối lượng": "9 Kg",
            "Thương hiệu": "Panasonic",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 35,
        "name": "Nồi Cơm Điện Sharp 1.8 Lít KS-18TJV Đa Năng",
        "brand": "Sharp",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 590000,
        "oldPrice": 590000,
        "discount": 0,
        "rating": 4.4,
        "reviewCount": 74,
        "sold": 224,
        "badge": "",
        "image": "assets/images/products/35.jpg",
        "images": [
            "assets/images/products/35.jpg"
        ],
        "description": "Nồi Cơm Điện Sharp 1.8 Lít KS-18TJV Đa Năng đến từ thương hiệu Sharp, giúp công việc bếp núc và sinh hoạt hàng ngày trở nên tiện lợi, tiết kiệm thời gian hơn cho cả gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Dung tích": "1.8 Lít",
            "Thương hiệu": "Sharp",
            "Bảo hành": "12 tháng chính hãng"
        },
        "subSubCategory": "noi-com-dien"
    },
    {
        "id": 36,
        "name": "Máy Xay Sinh Tố Đa Năng Sunhouse SHD5112 Cao Cấp",
        "brand": "Sunhouse",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 390000,
        "oldPrice": 390000,
        "discount": 0,
        "rating": 4.7,
        "reviewCount": 95,
        "sold": 318,
        "badge": "",
        "image": "assets/images/products/36.jpg",
        "images": [
            "assets/images/products/36.jpg"
        ],
        "description": "Máy Xay Sinh Tố Đa Năng Sunhouse SHD5112 Cao Cấp đến từ thương hiệu Sunhouse, giúp công việc bếp núc và sinh hoạt hàng ngày trở nên tiện lợi, tiết kiệm thời gian hơn cho cả gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Sunhouse",
            "Bảo hành": "12 tháng chính hãng"
        },
        "subSubCategory": "may-xay-sinh-to"
    },
    {
        "id": 37,
        "name": "Lò Vi Sóng Điện Tử Sharp R-2235Y(S) 23 Lít",
        "brand": "Sharp",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 1750000,
        "oldPrice": 1750000,
        "discount": 0,
        "rating": 4.4,
        "reviewCount": 45,
        "sold": 122,
        "badge": "",
        "image": "assets/images/products/37.jpg",
        "images": [
            "assets/images/products/37.jpg"
        ],
        "description": "Lò Vi Sóng Điện Tử Sharp R-2235Y(S) 23 Lít đến từ thương hiệu Sharp, giúp công việc bếp núc và sinh hoạt hàng ngày trở nên tiện lợi, tiết kiệm thời gian hơn cho cả gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Dung tích": "23 Lít",
            "Thương hiệu": "Sharp",
            "Bảo hành": "12 tháng chính hãng"
        },
        "subSubCategory": "lo-vi-song"
    },
    {
        "id": 38,
        "name": "Ấm Siêu Tốc Bluestone KTB-3311 1.7 Lít 2 Lớp",
        "brand": "Bluestone",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 290000,
        "oldPrice": 290000,
        "discount": 0,
        "rating": 4.8,
        "reviewCount": 83,
        "sold": 243,
        "badge": "",
        "image": "assets/images/products/38.jpg",
        "images": [
            "assets/images/products/38.jpg"
        ],
        "description": "Ấm Siêu Tốc Bluestone KTB-3311 1.7 Lít 2 Lớp đến từ thương hiệu Bluestone, giúp công việc bếp núc và sinh hoạt hàng ngày trở nên tiện lợi, tiết kiệm thời gian hơn cho cả gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Dung tích": "1.7 Lít",
            "Thương hiệu": "Bluestone",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 39,
        "name": "Bếp Điện Từ Đơn Kangaroo KG408I Siêu Mỏng",
        "brand": "Kangaroo",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 850000,
        "oldPrice": 850000,
        "discount": 0,
        "rating": 4.4,
        "reviewCount": 85,
        "sold": 275,
        "badge": "",
        "image": "assets/images/products/39.jpg",
        "images": [
            "assets/images/products/39.jpg"
        ],
        "description": "Bếp Điện Từ Đơn Kangaroo KG408I Siêu Mỏng đến từ thương hiệu Kangaroo, giúp công việc bếp núc và sinh hoạt hàng ngày trở nên tiện lợi, tiết kiệm thời gian hơn cho cả gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Kangaroo",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 40,
        "name": "Quạt Đứng Senko DCN1806 Cánh Cam Gió Siêu Mạnh",
        "brand": "Senko",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "quat-lam-mat",
        "subCategoryName": "Quạt, Thiết Bị Làm Mát",
        "price": 450000,
        "oldPrice": 450000,
        "discount": 0,
        "rating": 4.8,
        "reviewCount": 98,
        "sold": 349,
        "badge": "",
        "image": "assets/images/products/40.jpg",
        "images": [
            "assets/images/products/40.jpg"
        ],
        "description": "Quạt Đứng Senko DCN1806 Cánh Cam Gió Siêu Mạnh đến từ thương hiệu Senko, giúp công việc bếp núc và sinh hoạt hàng ngày trở nên tiện lợi, tiết kiệm thời gian hơn cho cả gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Senko",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 41,
        "name": "Bàn Ủi Hơi Nước Cầm Tay Tefal DT3030E0 1300W",
        "brand": "Tefal",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "ban-ui",
        "subCategoryName": "Bàn Ủi",
        "price": 950000,
        "oldPrice": 950000,
        "discount": 0,
        "rating": 4.5,
        "reviewCount": 77,
        "sold": 220,
        "badge": "",
        "image": "assets/images/products/41.jpg",
        "images": [
            "assets/images/products/41.jpg"
        ],
        "description": "Bàn Ủi Hơi Nước Cầm Tay Tefal DT3030E0 1300W đến từ thương hiệu Tefal, giúp công việc bếp núc và sinh hoạt hàng ngày trở nên tiện lợi, tiết kiệm thời gian hơn cho cả gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Công suất": "1300W",
            "Thương hiệu": "Tefal",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 42,
        "name": "Apple iPhone 15 Pro Max 256GB Chính Hãng VN/A",
        "brand": "Apple",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "phu-kien-khac",
        "subCategoryName": "Phụ Kiện Khác",
        "price": 29490000,
        "oldPrice": 29490000,
        "discount": 0,
        "rating": 4.8,
        "reviewCount": 4,
        "sold": 11,
        "badge": "",
        "image": "assets/images/products/42.jpg",
        "images": [
            "assets/images/products/42.jpg"
        ],
        "description": "Apple iPhone 15 Pro Max 256GB Chính Hãng VN/A đến từ thương hiệu Apple, hỗ trợ công việc và giải trí hàng ngày, thiết kế hiện đại, hiệu năng ổn định. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Bộ nhớ": "256GB",
            "Thương hiệu": "Apple",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 43,
        "name": "Samsung Galaxy S24 Ultra 12GB/256GB - Đỉnh Cao AI",
        "brand": "Samsung",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "phu-kien-khac",
        "subCategoryName": "Phụ Kiện Khác",
        "price": 26190000,
        "oldPrice": 26190000,
        "discount": 0,
        "rating": 4.5,
        "reviewCount": 5,
        "sold": 16,
        "badge": "",
        "image": "assets/images/products/43.jpg",
        "images": [
            "assets/images/products/43.jpg"
        ],
        "description": "Samsung Galaxy S24 Ultra 12GB/256GB - Đỉnh Cao AI đến từ thương hiệu Samsung, hỗ trợ công việc và giải trí hàng ngày, thiết kế hiện đại, hiệu năng ổn định. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Bộ nhớ": "12GB",
            "Thương hiệu": "Samsung",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 44,
        "name": "Sạc Dự Phòng Anker PowerCore 20000mAh 22.5W",
        "brand": "Anker",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "phu-kien-khac",
        "subCategoryName": "Phụ Kiện Khác",
        "price": 750000,
        "oldPrice": 750000,
        "discount": 0,
        "rating": 4.9,
        "reviewCount": 78,
        "sold": 218,
        "badge": "",
        "image": "assets/images/products/44.jpg",
        "images": [
            "assets/images/products/44.jpg"
        ],
        "description": "Sạc Dự Phòng Anker PowerCore 20000mAh 22.5W đến từ thương hiệu Anker, hỗ trợ công việc và giải trí hàng ngày, thiết kế hiện đại, hiệu năng ổn định. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Công suất": "5W",
            "Dung lượng pin": "20000mAh",
            "Thương hiệu": "Anker",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 45,
        "name": "Tai Nghe Chụp Tai Không Dây Sony WH-CH720N Chống Ồn",
        "brand": "Sony",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "phu-kien-khac",
        "subCategoryName": "Phụ Kiện Khác",
        "price": 2490000,
        "oldPrice": 2490000,
        "discount": 0,
        "rating": 4.5,
        "reviewCount": 47,
        "sold": 142,
        "badge": "",
        "image": "assets/images/products/45.jpg",
        "images": [
            "assets/images/products/45.jpg"
        ],
        "description": "Tai Nghe Chụp Tai Không Dây Sony WH-CH720N Chống Ồn đến từ thương hiệu Sony, hỗ trợ công việc và giải trí hàng ngày, thiết kế hiện đại, hiệu năng ổn định. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Sony",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 46,
        "name": "Loa Di Động Sony SRS-XE200 Chống Nước IP67",
        "brand": "Sony",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "phu-kien-khac",
        "subCategoryName": "Phụ Kiện Khác",
        "price": 1990000,
        "oldPrice": 1990000,
        "discount": 0,
        "rating": 4.9,
        "reviewCount": 28,
        "sold": 94,
        "badge": "",
        "image": "assets/images/products/46.jpg",
        "images": [
            "assets/images/products/46.jpg"
        ],
        "description": "Loa Di Động Sony SRS-XE200 Chống Nước IP67 đến từ thương hiệu Sony, hỗ trợ công việc và giải trí hàng ngày, thiết kế hiện đại, hiệu năng ổn định. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Sony",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 47,
        "name": "Chuột Không Dây Gaming Logitech G304 Lightspeed",
        "brand": "Logitech",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "chuot-ban-phim",
        "subCategoryName": "Chuột, Bàn Phím",
        "price": 790000,
        "oldPrice": 790000,
        "discount": 0,
        "rating": 4.5,
        "reviewCount": 80,
        "sold": 216,
        "badge": "",
        "image": "assets/images/products/47.jpg",
        "images": [
            "assets/images/products/47.jpg"
        ],
        "description": "Chuột Không Dây Gaming Logitech G304 Lightspeed đến từ thương hiệu Logitech, hỗ trợ công việc và giải trí hàng ngày, thiết kế hiện đại, hiệu năng ổn định. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Logitech",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 48,
        "name": "Trạm Sạc Nhanh Baseus GaN5 Pro Desktop 65W Đa Năng",
        "brand": "Baseus",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "phu-kien-khac",
        "subCategoryName": "Phụ Kiện Khác",
        "price": 650000,
        "oldPrice": 650000,
        "discount": 0,
        "rating": 4.2,
        "reviewCount": 91,
        "sold": 269,
        "badge": "",
        "image": "assets/images/products/48.jpg",
        "images": [
            "assets/images/products/48.jpg"
        ],
        "description": "Trạm Sạc Nhanh Baseus GaN5 Pro Desktop 65W Đa Năng đến từ thương hiệu Baseus, hỗ trợ công việc và giải trí hàng ngày, thiết kế hiện đại, hiệu năng ổn định. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Công suất": "65W",
            "Thương hiệu": "Baseus",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 49,
        "name": "Laptop Asus Vivobook Go 14 R5-7520U/8GB/512GB",
        "brand": "Asus",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "phu-kien-khac",
        "subCategoryName": "Phụ Kiện Khác",
        "price": 11990000,
        "oldPrice": 11990000,
        "discount": 0,
        "rating": 4.6,
        "reviewCount": 10,
        "sold": 31,
        "badge": "",
        "image": "assets/images/products/49.jpg",
        "images": [
            "assets/images/products/49.jpg"
        ],
        "description": "Laptop Asus Vivobook Go 14 R5-7520U/8GB/512GB đến từ thương hiệu Asus, hỗ trợ công việc và giải trí hàng ngày, thiết kế hiện đại, hiệu năng ổn định. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Bộ nhớ": "8GB",
            "Thương hiệu": "Asus",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 50,
        "name": "Máy Pha Cà Phê Espresso Tiross TS621 Bán Tự Động",
        "brand": "Tiross",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 1150000,
        "oldPrice": 1150000,
        "discount": 0,
        "rating": 4.2,
        "reviewCount": 60,
        "sold": 214,
        "badge": "",
        "image": "assets/images/products/50.jpg",
        "images": [
            "assets/images/products/50.jpg"
        ],
        "description": "Máy Pha Cà Phê Espresso Tiross TS621 Bán Tự Động đến từ thương hiệu Tiross, mang đến tách cà phê thơm ngon chuẩn vị ngay tại nhà, thao tác đơn giản chỉ với một chạm. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Tiross",
            "Bảo hành": "12 tháng chính hãng"
        },
        "subSubCategory": "may-pha-ca-phe"
    },
    {
        "id": 51,
        "name": "Loa Thanh Sony HT-S20R 400W 5.1 Kênh Vòm",
        "brand": "Sony",
        "category": "dien-tu",
        "categoryName": "Điện Tử",
        "subCategory": "loa-thanh",
        "subCategoryName": "Loa Thanh",
        "price": 4490000,
        "oldPrice": 4490000,
        "discount": 0,
        "rating": 4.6,
        "reviewCount": 16,
        "sold": 45,
        "badge": "Mới",
        "image": "assets/images/products/51.jpg",
        "images": [
            "assets/images/products/51.jpg"
        ],
        "description": "Loa Thanh Sony HT-S20R 400W 5.1 Kênh Vòm đến từ thương hiệu Sony, mang đến trải nghiệm hình ảnh và âm thanh sống động, chân thực cho không gian giải trí gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Công suất": "400W",
            "Thương hiệu": "Sony",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 52,
        "name": "Nồi Cơm Điện Cao Tần Sunhouse Mama 1.8 Lít SHD8955",
        "brand": "Sunhouse",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 2190000,
        "oldPrice": 2190000,
        "discount": 0,
        "rating": 4.3,
        "reviewCount": 35,
        "sold": 109,
        "badge": "Mới",
        "image": "assets/images/products/52.jpg",
        "images": [
            "assets/images/products/52.jpg"
        ],
        "description": "Nồi Cơm Điện Cao Tần Sunhouse Mama 1.8 Lít SHD8955 đến từ thương hiệu Sunhouse, giúp công việc bếp núc và sinh hoạt hàng ngày trở nên tiện lợi, tiết kiệm thời gian hơn cho cả gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Dung tích": "1.8 Lít",
            "Thương hiệu": "Sunhouse",
            "Bảo hành": "12 tháng chính hãng"
        },
        "subSubCategory": "noi-com-dien"
    },
    {
        "id": 53,
        "name": "Tủ Lạnh Aqua Inverter 260 Lít AQR-B339MA(HB)",
        "brand": "Aqua",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "tu-lanh",
        "subCategoryName": "Tủ Lạnh, Tủ Đông, Tủ Mát",
        "price": 7590000,
        "oldPrice": 7590000,
        "discount": 0,
        "rating": 4.6,
        "reviewCount": 7,
        "sold": 23,
        "badge": "Mới",
        "image": "assets/images/products/53.jpg",
        "images": [
            "assets/images/products/53.jpg"
        ],
        "description": "Tủ Lạnh Aqua Inverter 260 Lít AQR-B339MA(HB) đến từ thương hiệu Aqua, vận hành bền bỉ, tiết kiệm điện vượt trội, phù hợp với nhu cầu sử dụng lâu dài của gia đình Việt. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Dung tích": "260 Lít",
            "Thương hiệu": "Aqua",
            "Bảo hành": "12 tháng chính hãng"
        }
    },
    {
        "id": 54,
        "name": "Lò Vi Sóng Điện Tử Toshiba ER-SGS23(S)VN 23L",
        "brand": "Toshiba",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 2450000,
        "oldPrice": 2450000,
        "discount": 0,
        "rating": 4.3,
        "reviewCount": 41,
        "sold": 114,
        "badge": "Mới",
        "image": "assets/images/products/54.jpg",
        "images": [
            "assets/images/products/54.jpg"
        ],
        "description": "Lò Vi Sóng Điện Tử Toshiba ER-SGS23(S)VN 23L đến từ thương hiệu Toshiba, giúp công việc bếp núc và sinh hoạt hàng ngày trở nên tiện lợi, tiết kiệm thời gian hơn cho cả gia đình. Sản phẩm chính hãng, đầy đủ phụ kiện và tem bảo hành theo quy định.",
        "specs": {
            "Thương hiệu": "Toshiba",
            "Bảo hành": "12 tháng chính hãng"
        },
        "subSubCategory": "lo-vi-song"
    },
    {
        "id": 55,
        "name": "Máy Giặt Cửa Trước Comfee 8kg Inverter",
        "brand": "Comfee",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-giat",
        "subCategoryName": "Máy Giặt",
        "price": 5490000,
        "oldPrice": 6990000,
        "discount": 21,
        "rating": 4.5,
        "reviewCount": 8,
        "sold": 24,
        "badge": null,
        "image": "assets/images/products/55.jpg",
        "images": [
            "assets/images/products/55.jpg"
        ],
        "description": "Máy Giặt Cửa Trước Comfee 8kg Inverter - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "24 tháng chính hãng",
            "Khối lượng giặt": "8 kg",
            "Công nghệ": "Inverter tiết kiệm điện"
        }
    },
    {
        "id": 56,
        "name": "Bếp Từ Đôi Teka IZC 96630 MSP",
        "brand": "Teka",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 12900000,
        "oldPrice": 15900000,
        "discount": 19,
        "rating": 4.5,
        "reviewCount": 13,
        "sold": 27,
        "badge": null,
        "image": "assets/images/products/56.jpg",
        "images": [
            "assets/images/products/56.jpg"
        ],
        "description": "Bếp Từ Đôi Teka IZC 96630 MSP - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "24 tháng chính hãng",
            "Xuất xứ": "Tây Ban Nha",
            "Công suất": "3600W"
        }
    },
    {
        "id": 57,
        "name": "Lò Nướng Âm Tủ Hafele HO-B60A",
        "brand": "Hafele",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 10490000,
        "oldPrice": 12490000,
        "discount": 16,
        "rating": 4.5,
        "reviewCount": 10,
        "sold": 21,
        "badge": null,
        "image": "assets/images/products/57.jpg",
        "images": [
            "assets/images/products/57.jpg"
        ],
        "description": "Lò Nướng Âm Tủ Hafele HO-B60A - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "24 tháng chính hãng",
            "Dung tích": "60 lít",
            "Xuất xứ": "Đức"
        }
    },
    {
        "id": 58,
        "name": "Quạt Trần KDK U48FP 48 inch",
        "brand": "KDK",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "quat-lam-mat",
        "subCategoryName": "Quạt, Thiết Bị Làm Mát",
        "price": 2290000,
        "oldPrice": 2790000,
        "discount": 18,
        "rating": 4.5,
        "reviewCount": 23,
        "sold": 7,
        "badge": null,
        "image": "assets/images/products/58.jpg",
        "images": [
            "assets/images/products/58.jpg"
        ],
        "description": "Quạt Trần KDK U48FP 48 inch - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Đường kính cánh": "48 inch",
            "Xuất xứ": "Nhật Bản"
        }
    },
    {
        "id": 59,
        "name": "Máy Triệt Lông IPL Halio Cooling Device",
        "brand": "Halio",
        "category": "thiet-bi-lam-dep-cham-soc",
        "categoryName": "Thiết Bị Làm Đẹp Và Chăm Sóc Cá Nhân",
        "subCategory": "thiet-bi-lam-dep",
        "subCategoryName": "Thiết Bị Làm Đẹp",
        "price": 3590000,
        "oldPrice": 4290000,
        "discount": 16,
        "rating": 4.5,
        "reviewCount": 25,
        "sold": 13,
        "badge": null,
        "image": "assets/images/products/59.jpg",
        "images": [
            "assets/images/products/59.jpg"
        ],
        "description": "Máy Triệt Lông IPL Halio Cooling Device - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Công nghệ": "IPL làm mát"
        }
    },
    {
        "id": 60,
        "name": "Quạt Không Cánh Paveden PBF-307S-DC",
        "brand": "Paveden",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "quat-lam-mat",
        "subCategoryName": "Quạt, Thiết Bị Làm Mát",
        "price": 3290000,
        "oldPrice": 3890000,
        "discount": 15,
        "rating": 4.5,
        "reviewCount": 26,
        "sold": 6,
        "badge": null,
        "image": "assets/images/products/60.jpg",
        "images": [
            "assets/images/products/60.jpg"
        ],
        "description": "Quạt Không Cánh Paveden PBF-307S-DC - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Số mức gió": "24 mức",
            "Hẹn giờ": "Đến 12 giờ"
        }
    },
    {
        "id": 61,
        "name": "Robot Hút Bụi Lau Nhà Roborock Q Revo",
        "brand": "Roborock",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "may-hut-bui",
        "subCategoryName": "Máy Hút Bụi",
        "price": 12990000,
        "oldPrice": 15990000,
        "discount": 19,
        "rating": 4.5,
        "reviewCount": 19,
        "sold": 7,
        "badge": null,
        "image": "assets/images/products/61.jpg",
        "images": [
            "assets/images/products/61.jpg"
        ],
        "description": "Robot Hút Bụi Lau Nhà Roborock Q Revo - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "24 tháng chính hãng",
            "Lực hút": "5500 Pa",
            "Điều khiển": "App + Giọng nói"
        }
    },
    {
        "id": 62,
        "name": "Máy Lọc Không Khí Xiaomi Smart Air Purifier 4",
        "brand": "Xiaomi",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "may-loc-khong-khi",
        "subCategoryName": "Máy Lọc Không Khí, Tạo Ẩm, Hút Ẩm",
        "price": 3990000,
        "oldPrice": 4690000,
        "discount": 15,
        "rating": 4.5,
        "reviewCount": 17,
        "sold": 39,
        "badge": null,
        "image": "assets/images/products/62.jpg",
        "images": [
            "assets/images/products/62.jpg"
        ],
        "description": "Máy Lọc Không Khí Xiaomi Smart Air Purifier 4 - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Diện tích lọc": "48 m²",
            "Kết nối": "Wifi, App Mi Home"
        }
    },
    {
        "id": 63,
        "name": "Bộ Nồi Inox WMF Astoria 4 Món",
        "brand": "WMF",
        "category": "gia-dung",
        "categoryName": "Gia Dụng",
        "subCategory": "noi-chao",
        "subCategoryName": "Nồi/Chảo, Bộ Nồi/Bộ Nồi Chảo",
        "price": 4900000,
        "oldPrice": 6200000,
        "discount": 21,
        "rating": 4.5,
        "reviewCount": 20,
        "sold": 15,
        "badge": null,
        "image": "assets/images/products/63.jpg",
        "images": [
            "assets/images/products/63.jpg"
        ],
        "description": "Bộ Nồi Inox WMF Astoria 4 Món - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Chất liệu": "Inox cao cấp",
            "Xuất xứ": "Đức"
        }
    },
    {
        "id": 64,
        "name": "Màn Hình Viewsonic VA2732-H 27 inch",
        "brand": "Viewsonic",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "man-hinh",
        "subCategoryName": "Màn Hình",
        "price": 2890000,
        "oldPrice": 3390000,
        "discount": 15,
        "rating": 4.5,
        "reviewCount": 31,
        "sold": 44,
        "badge": null,
        "image": "assets/images/products/64.jpg",
        "images": [
            "assets/images/products/64.jpg"
        ],
        "description": "Màn Hình Viewsonic VA2732-H 27 inch - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "24 tháng chính hãng",
            "Kích thước": "27 inch",
            "Độ phân giải": "Full HD"
        }
    },
    {
        "id": 65,
        "name": "Giá Đỡ Màn Hình Hyperwork T9 Pro",
        "brand": "Hyperwork",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "gia-treo",
        "subCategoryName": "Giá Treo Màn Hình, Giá Treo Tivi",
        "price": 890000,
        "oldPrice": 1190000,
        "discount": 25,
        "rating": 4.5,
        "reviewCount": 15,
        "sold": 11,
        "badge": null,
        "image": "assets/images/products/65.jpg",
        "images": [
            "assets/images/products/65.jpg"
        ],
        "description": "Giá Đỡ Màn Hình Hyperwork T9 Pro - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Kiểu treo": "Gắn bàn xoay 360°"
        }
    },
    {
        "id": 66,
        "name": "Giá Đỡ Màn Hình HumanMotion T9 Pro II",
        "brand": "Humanmotion",
        "category": "phu-kien",
        "categoryName": "Phụ Kiện",
        "subCategory": "gia-treo",
        "subCategoryName": "Giá Treo Màn Hình, Giá Treo Tivi",
        "price": 1290000,
        "oldPrice": 1590000,
        "discount": 19,
        "rating": 4.5,
        "reviewCount": 30,
        "sold": 7,
        "badge": null,
        "image": "assets/images/products/66.jpg",
        "images": [
            "assets/images/products/66.jpg"
        ],
        "description": "Giá Đỡ Màn Hình HumanMotion T9 Pro II - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Số màn hình": "Dual (2 màn hình)"
        }
    },
    {
        "id": 67,
        "name": "Bàn Ủi Hơi Nước AC Steam Pro",
        "brand": "AC",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "ban-ui",
        "subCategoryName": "Bàn Ủi",
        "price": 590000,
        "oldPrice": 790000,
        "discount": 25,
        "rating": 4.5,
        "reviewCount": 23,
        "sold": 29,
        "badge": null,
        "image": "assets/images/products/67.jpg",
        "images": [
            "assets/images/products/67.jpg"
        ],
        "description": "Bàn Ủi Hơi Nước AC Steam Pro - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng",
            "Công suất": "2000W"
        }
    },
    {
        "id": 68,
        "name": "Nồi Nấu Chậm Bear DDG-2098",
        "brand": "Bear",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 890000,
        "oldPrice": 1090000,
        "discount": 18,
        "rating": 4.5,
        "reviewCount": 18,
        "sold": 27,
        "badge": null,
        "image": "assets/images/products/68.jpg",
        "images": [
            "assets/images/products/68.jpg"
        ],
        "description": "Nồi Nấu Chậm Bear DDG-2098 - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Dung tích": "2 lít",
            "Xuất xứ": "Trung Quốc"
        }
    },
    {
        "id": 69,
        "name": "Máy Giặt Bosch Serie 6 9kg Inverter",
        "brand": "Bosch",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-giat",
        "subCategoryName": "Máy Giặt",
        "price": 13900000,
        "oldPrice": 16900000,
        "discount": 18,
        "rating": 4.5,
        "reviewCount": 15,
        "sold": 20,
        "badge": null,
        "image": "assets/images/products/69.jpg",
        "images": [
            "assets/images/products/69.jpg"
        ],
        "description": "Máy Giặt Bosch Serie 6 9kg Inverter - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "24 tháng chính hãng",
            "Khối lượng giặt": "9 kg",
            "Xuất xứ": "Đức"
        }
    },
    {
        "id": 70,
        "name": "Bếp Từ Đơn Boss BS-2000",
        "brand": "Boss",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 1290000,
        "oldPrice": 1590000,
        "discount": 19,
        "rating": 4.5,
        "reviewCount": 6,
        "sold": 19,
        "badge": null,
        "image": "assets/images/products/70.jpg",
        "images": [
            "assets/images/products/70.jpg"
        ],
        "description": "Bếp Từ Đơn Boss BS-2000 - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng",
            "Công suất": "2000W"
        }
    },
    {
        "id": 71,
        "name": "Nồi Cơm Điện Tử Cuckoo CR-0632F 1.8L",
        "brand": "Cuckoo",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 2490000,
        "oldPrice": 2990000,
        "discount": 17,
        "rating": 4.5,
        "reviewCount": 8,
        "sold": 14,
        "badge": null,
        "image": "assets/images/products/71.jpg",
        "images": [
            "assets/images/products/71.jpg"
        ],
        "description": "Nồi Cơm Điện Tử Cuckoo CR-0632F 1.8L - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "24 tháng chính hãng",
            "Dung tích": "1.8 lít",
            "Xuất xứ": "Hàn Quốc"
        },
        "subSubCategory": "noi-com-dien"
    },
    {
        "id": 72,
        "name": "Máy Hút Bụi Cầm Tay Deerma DX118C",
        "brand": "Deerma",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "may-hut-bui",
        "subCategoryName": "Máy Hút Bụi",
        "price": 890000,
        "oldPrice": 1190000,
        "discount": 25,
        "rating": 4.5,
        "reviewCount": 8,
        "sold": 39,
        "badge": null,
        "image": "assets/images/products/72.jpg",
        "images": [
            "assets/images/products/72.jpg"
        ],
        "description": "Máy Hút Bụi Cầm Tay Deerma DX118C - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Xuất xứ": "Trung Quốc"
        }
    },
    {
        "id": 73,
        "name": "Quạt Đứng E-Pro Remote 3 Cánh",
        "brand": "E-pro",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "quat-lam-mat",
        "subCategoryName": "Quạt, Thiết Bị Làm Mát",
        "price": 690000,
        "oldPrice": 890000,
        "discount": 22,
        "rating": 4.5,
        "reviewCount": 28,
        "sold": 24,
        "badge": null,
        "image": "assets/images/products/73.jpg",
        "images": [
            "assets/images/products/73.jpg"
        ],
        "description": "Quạt Đứng E-Pro Remote 3 Cánh - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng",
            "Điều khiển": "Remote"
        }
    },
    {
        "id": 74,
        "name": "Tủ Lạnh Electrolux Inverter 340 Lít",
        "brand": "Electrolux",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "tu-lanh",
        "subCategoryName": "Tủ Lạnh, Tủ Đông, Tủ Mát",
        "price": 9490000,
        "oldPrice": 11900000,
        "discount": 20,
        "rating": 4.5,
        "reviewCount": 13,
        "sold": 32,
        "badge": null,
        "image": "assets/images/products/74.jpg",
        "images": [
            "assets/images/products/74.jpg"
        ],
        "description": "Tủ Lạnh Electrolux Inverter 340 Lít - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "24 tháng chính hãng",
            "Dung tích": "340 lít",
            "Xuất xứ": "Thụy Điển"
        }
    },
    {
        "id": 75,
        "name": "Bộ Nồi Chảo Elmich Inox 5 Món",
        "brand": "Elmich",
        "category": "gia-dung",
        "categoryName": "Gia Dụng",
        "subCategory": "noi-chao",
        "subCategoryName": "Nồi/Chảo, Bộ Nồi/Bộ Nồi Chảo",
        "price": 1590000,
        "oldPrice": 1990000,
        "discount": 20,
        "rating": 4.5,
        "reviewCount": 19,
        "sold": 21,
        "badge": null,
        "image": "assets/images/products/75.jpg",
        "images": [
            "assets/images/products/75.jpg"
        ],
        "description": "Bộ Nồi Chảo Elmich Inox 5 Món - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Chất liệu": "Inox 304"
        }
    },
    {
        "id": 76,
        "name": "Dao Bếp Đa Năng Eonwon Bộ 3 Món",
        "brand": "Eonwon",
        "category": "gia-dung",
        "categoryName": "Gia Dụng",
        "subCategory": "dao-thot-dung-cu-bep",
        "subCategoryName": "Dao/Thớt/Dụng Cụ Bếp",
        "price": 390000,
        "oldPrice": 490000,
        "discount": 20,
        "rating": 4.5,
        "reviewCount": 9,
        "sold": 43,
        "badge": null,
        "image": "assets/images/products/76.jpg",
        "images": [
            "assets/images/products/76.jpg"
        ],
        "description": "Dao Bếp Đa Năng Eonwon Bộ 3 Món - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "6 tháng",
            "Chất liệu": "Thép không gỉ"
        }
    },
    {
        "id": 77,
        "name": "Viên Rửa Chén Finish Power Ball Hộp 54 Viên",
        "brand": "Finish",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "may-rua-chen",
        "subCategoryName": "Máy Rửa Chén",
        "price": 250000,
        "oldPrice": 320000,
        "discount": 22,
        "rating": 4.5,
        "reviewCount": 32,
        "sold": 39,
        "badge": null,
        "image": "assets/images/products/77.jpg",
        "images": [
            "assets/images/products/77.jpg"
        ],
        "description": "Viên Rửa Chén Finish Power Ball Hộp 54 Viên - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Xuất xứ": "Đức",
            "Quy cách": "Hộp 54 viên"
        }
    },
    {
        "id": 78,
        "name": "Máy Nước Nóng Fujie WH-868S",
        "brand": "Fujie",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-tam-nuoc-nong",
        "subCategoryName": "Máy Tắm Nước Nóng",
        "price": 1690000,
        "oldPrice": 1990000,
        "discount": 15,
        "rating": 4.5,
        "reviewCount": 28,
        "sold": 18,
        "badge": null,
        "image": "assets/images/products/78.jpg",
        "images": [
            "assets/images/products/78.jpg"
        ],
        "description": "Máy Nước Nóng Fujie WH-868S - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "24 tháng chính hãng",
            "Công suất": "4500W"
        }
    },
    {
        "id": 79,
        "name": "Máy Lọc Nước Fujihome RO 9 Lõi",
        "brand": "Fujihome",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "may-loc-nuoc",
        "subCategoryName": "Máy Lọc Nước, Cây Nước Nóng Lạnh, Làm Đá",
        "price": 3990000,
        "oldPrice": 4790000,
        "discount": 17,
        "rating": 4.5,
        "reviewCount": 28,
        "sold": 34,
        "badge": null,
        "image": "assets/images/products/79.jpg",
        "images": [
            "assets/images/products/79.jpg"
        ],
        "description": "Máy Lọc Nước Fujihome RO 9 Lõi - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Số lõi lọc": "9 lõi"
        }
    },
    {
        "id": 80,
        "name": "Bộ Nồi Chảo Happycook Inox 3 Món",
        "brand": "Happycook",
        "category": "gia-dung",
        "categoryName": "Gia Dụng",
        "subCategory": "noi-chao",
        "subCategoryName": "Nồi/Chảo, Bộ Nồi/Bộ Nồi Chảo",
        "price": 990000,
        "oldPrice": 1290000,
        "discount": 23,
        "rating": 4.5,
        "reviewCount": 7,
        "sold": 13,
        "badge": null,
        "image": "assets/images/products/80.jpg",
        "images": [
            "assets/images/products/80.jpg"
        ],
        "description": "Bộ Nồi Chảo Happycook Inox 3 Món - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Xuất xứ": "Việt Nam"
        }
    },
    {
        "id": 81,
        "name": "Máy Lạnh Hyundai Inverter 1.5 HP",
        "brand": "Hyundai",
        "category": "dien-lanh",
        "categoryName": "Điện Lạnh",
        "subCategory": "may-lanh",
        "subCategoryName": "Máy Lạnh",
        "price": 7490000,
        "oldPrice": 8990000,
        "discount": 17,
        "rating": 4.5,
        "reviewCount": 19,
        "sold": 43,
        "badge": null,
        "image": "assets/images/products/81.jpg",
        "images": [
            "assets/images/products/81.jpg"
        ],
        "description": "Máy Lạnh Hyundai Inverter 1.5 HP - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "24 tháng chính hãng",
            "Công suất lạnh": "1.5 HP",
            "Công nghệ": "Inverter"
        }
    },
    {
        "id": 82,
        "name": "Ấm Siêu Tốc Kadeka KDK-188 1.8L",
        "brand": "Kadeka",
        "category": "dien-gia-dung",
        "categoryName": "Điện Gia Dụng",
        "subCategory": "do-gia-dung-nha-bep",
        "subCategoryName": "Đồ Gia Dụng Nhà Bếp",
        "price": 290000,
        "oldPrice": 390000,
        "discount": 26,
        "rating": 4.5,
        "reviewCount": 10,
        "sold": 17,
        "badge": null,
        "image": "assets/images/products/82.jpg",
        "images": [
            "assets/images/products/82.jpg"
        ],
        "description": "Ấm Siêu Tốc Kadeka KDK-188 1.8L - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng",
            "Dung tích": "1.8 lít"
        }
    },
    {
        "id": 83,
        "name": "Bình Giữ Nhiệt Tiger MCZ-A501 500ml",
        "brand": "Tiger",
        "category": "gia-dung",
        "categoryName": "Gia Dụng",
        "subCategory": "binh-giu-nhiet",
        "subCategoryName": "Bình Giữ Nhiệt",
        "price": 690000,
        "oldPrice": 890000,
        "discount": 22,
        "rating": 4.5,
        "reviewCount": 24,
        "sold": 13,
        "badge": null,
        "image": "assets/images/products/83.jpg",
        "images": [
            "assets/images/products/83.jpg"
        ],
        "description": "Bình Giữ Nhiệt Tiger MCZ-A501 500ml - hàng chính hãng, phân phối bởi Điện Máy NK.",
        "specs": {
            "Bảo hành": "12 tháng chính hãng",
            "Dung tích": "500ml",
            "Xuất xứ": "Nhật Bản"
        }
    }
];



const ProductAPI = {
    /**
     * Lấy toàn bộ sản phẩm.
     * ➜ Khi có backend: return fetch('/api/products').then(r => r.json());
     */
    getAll() {
        return Promise.resolve([...PRODUCTS]);
    },

    /** Lấy 1 sản phẩm theo id. */
    getById(id) {
        const product = PRODUCTS.find(p => p.id === Number(id));
        return Promise.resolve(product || null);
    },

    /** Lấy danh sách sản phẩm theo danh mục (category slug) và tùy chọn danh mục con (subCategory slug). */
    getByCategory(categorySlug, subSlug) {
        if (!categorySlug || categorySlug === "all") return this.getAll();
        return Promise.resolve(PRODUCTS.filter(p => {
            if (p.category !== categorySlug) return false;
            if (subSlug && p.subCategory !== subSlug) return false;
            return true;
        }));
    },

    /** Lấy danh sách thương hiệu duy nhất (dùng để render bộ lọc). */
    getBrands(categorySlug, subSlug) {
        return this.getByCategory(categorySlug, subSlug).then(list => {
            const brands = [...new Set(list.map(p => p.brand))];
            return brands.sort();
        });
    },

    /** Tìm kiếm theo từ khóa (dùng cho ô tìm kiếm autocomplete). */
    search(keyword) {
        const kw = (keyword || "").trim().toLowerCase();
        if (!kw) return Promise.resolve([]);
        return Promise.resolve(
            PRODUCTS.filter(p => p.name.toLowerCase().includes(kw) || p.brand.toLowerCase().includes(kw))
        );
    },

    /** Lọc + sắp xếp - dùng riêng cho trang category.html. */
    filterAndSort(categorySlug, { subSlug = "", brands = [], priceRange = "all", sortBy = "newest" } = {}) {
        return this.getByCategory(categorySlug, subSlug).then(list => {
            let result = [...list];

            if (brands.length > 0) {
                result = result.filter(p => brands.includes(p.brand));
            }

            if (priceRange && priceRange !== "all") {
                const [min, max] = priceRange.split("-").map(Number);
                result = result.filter(p => p.price >= min && p.price <= max);
            }

            switch (sortBy) {
                case "price-asc":
                    result.sort((a, b) => a.price - b.price);
                    break;
                case "price-desc":
                    result.sort((a, b) => b.price - a.price);
                    break;
                case "bestseller":
                    result.sort((a, b) => b.sold - a.sold);
                    break;
                default: // newest
                    result.sort((a, b) => b.id - a.id);
            }

            return result;
        });
    }
};

/** Định dạng số tiền theo chuẩn VNĐ - dùng chung toàn site. */
function formatMoney(amount) {
    return Number(amount).toLocaleString("vi-VN") + "đ";
}

/** Thuộc tính onerror dùng chung, chèn vào MỌI thẻ <img> hiển thị ảnh sản phẩm.
 *  Khi file ảnh thật (assets/images/products/<id>.jpg) chưa tồn tại, trình duyệt
 *  tự động chuyển sang ảnh placeholder cục bộ thay vì hiện icon ảnh vỡ. */
const PRODUCT_IMG_ONERROR = `this.onerror=null;this.src='${PRODUCT_IMAGE_FALLBACK}';`;

