# Lồng cầu gọi tên học sinh

Ứng dụng gọi tên ngẫu nhiên dành cho lớp học, có các chế độ lồng cầu, vòng quay, hộp bí mật, bóng bay và bảng số.

## Chạy trên Windows

1. Cài Node.js 22 LTS phiên bản 22.12 trở lên từ https://nodejs.org/.
2. Trên GitHub, chọn **Code → Download ZIP**, sau đó giải nén.
3. Nhấp đúp **Chay-Long-Cau.bat**. Lần đầu cần Internet để cài thư viện.
4. Trình duyệt tự mở ứng dụng. Giữ cửa sổ chạy mở khi dùng; nhấn **Ctrl+C** để dừng.

## Sử dụng

- Mở phần quản lý học sinh để nhập danh sách của lớp.
- Chọn chế độ quay và bắt đầu gọi tên.
- Có tùy chọn không lặp lại, âm thanh, đọc tên và lịch sử gọi.
- Danh sách và thiết lập được lưu trong trình duyệt trên từng máy. Đồng nghiệp cần nhập danh sách riêng; dữ liệu không tự đồng bộ qua GitHub.
- Danh sách ban đầu trong mã nguồn là danh sách mẫu đi kèm ứng dụng.

## Chạy bằng dòng lệnh

```sh
npm ci
npm run dev -- --host 127.0.0.1 --open
```

Tạo bản build bằng `npm run build`; kết quả nằm trong thư mục `dist`.
Ứng dụng hiện chạy phía trình duyệt và không cần cấu hình khóa Gemini để gọi tên học sinh.