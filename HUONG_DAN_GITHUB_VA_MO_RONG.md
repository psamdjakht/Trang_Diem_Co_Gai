# HƯỚNG DẪN ĐĂNG GAME LÊN GITHUB PAGES

## 1. Đăng game lên GitHub
1. Giải nén toàn bộ thư mục dự án.
2. Tạo repository GitHub mới, không cần chọn thêm README hoặc mẫu khác.
3. Đưa toàn bộ tệp và thư mục của dự án lên nhánh `main`. Tệp `index.html` phải nằm ngay ở thư mục gốc.
4. Mở **Settings → Pages**.
5. Tại **Build and deployment**, chọn **Deploy from a branch**.
6. Chọn nhánh **main**, thư mục **/(root)** rồi bấm **Save**.
7. Đợi GitHub tạo đường dẫn Pages, sau đó mở đường dẫn này trên điện thoại để chơi. Game không có tài khoản và không cần đăng nhập.

## 2. Cách chơi trên điện thoại
- Kéo tóc, quần áo hoặc giày vào vùng nhân vật; món đồ sẽ tự nhảy đúng tọa độ.
- Có thể chạm một lần vào món đồ để mặc nhanh.
- Trong lúc kéo, trang bị khóa cuộn để không bị trượt hoặc giật màn hình.
- Kéo món đang mặc ra ngoài vùng nhân vật để trả về danh sách.
- Nút **Reset dollmaker** đưa toàn bộ game về trạng thái ban đầu.

## 3. Cấu trúc mở rộng quần áo và phụ kiện
- Tóc: `images/1Hair`
- Áo: `images/2Tops`
- Quần/váy: `images/3Bottoms`
- Đồ toàn thân: `images/4Full-body`
- Giày: `images/5Footwear`
- Phụ kiện mới: `images/6Accessories`
- Đồ khác: `images/7Misc`

Mỗi hình PNG nên được cắt sát món đồ và có nền trong suốt. Không đổi kích thước hoặc vị trí nhân vật gốc nếu muốn dùng lại các tọa độ hiện tại.

## 4. Khai báo món đồ mới trong trang
Thêm một thẻ ảnh vào tab tương ứng trong `index.html`. Ví dụ phụ kiện:

```html
<img alt="Tên phụ kiện" src="images/6Accessories/ten-phu-kien.png" title="Tên phụ kiện"
     data-snap-x="110" data-snap-y="80">
```

- `data-snap-x`: vị trí ngang tính từ mép trái khung nhân vật 249 × 400.
- `data-snap-y`: vị trí dọc tính từ mép trên khung nhân vật 249 × 400.
- Khi đã khai báo hai giá trị này, món đồ sẽ tự nhảy đúng vị trí.

Nếu có nhiều biến thể cùng hình dáng, nên thêm một quy tắc chung trong `scripts/dollmaker-config.js` thay vì nhập tọa độ cho từng ảnh.

## 5. Thêm quy tắc tự động cho cả nhóm ảnh
Mở `scripts/dollmaker-config.js`, thêm quy tắc trước dòng đóng của `snapRules`:

```javascript
Object.freeze({
  name: "Hat 001",
  match: /\/6Accessories\/Hat 001/i,
  x: 105,
  y: 42
})
```

Các ảnh có đường dẫn khớp với quy tắc sẽ dùng chung tọa độ. Quy tắc đứng trước được ưu tiên trước.

## 6. Lưu ý vận hành
- GitHub Pages chạy `index.html`; không cần PHP, cơ sở dữ liệu hoặc máy chủ riêng.
- Không đổi tên các thư mục `base`, `images`, `scripts`, `styles` nếu chưa sửa lại đường dẫn trong mã nguồn.
- Sau khi bổ sung ảnh hoặc sửa mã, commit và push lại lên nhánh `main`; GitHub Pages sẽ tự cập nhật.
- Chức năng xuất PNG sử dụng thư viện tải từ CDN, vì vậy thiết bị cần Internet khi bấm nút tải ảnh.
