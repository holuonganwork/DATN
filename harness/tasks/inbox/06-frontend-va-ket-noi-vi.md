# Giai đoạn 06 — Frontend và kết nối ví

**Thời lượng:** Tuần 5–6  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Cung cấp giao diện thao tác cho quản trị viên và đơn vị phát hành.

## Mô tả

Xây Next.js, React, TypeScript và Tailwind. Giao diện hiển thị rõ trạng thái nghiệp vụ và trạng thái transaction, không che giấu lỗi blockchain.

## Màn hình MVP

- Đăng nhập và phân quyền.
- Danh sách tổ chức và ví được ủy quyền.
- Quản lý khóa học.
- Nhập và kiểm tra danh sách học viên.
- Xem, duyệt và đóng băng batch.
- Kết nối ví và ký publish.
- Theo dõi receipt/event.
- Xem danh sách credential và thao tác thu hồi.

## Checklist

- [ ] Tạo layout và navigation theo vai trò.
- [ ] Hiển thị lỗi validation theo từng dòng dữ liệu.
- [ ] Hiển thị preview trước khi freeze.
- [ ] Vô hiệu hóa chỉnh sửa sau khi freeze.
- [ ] Kết nối ví EVM.
- [ ] Kiểm tra chain ID trước khi ký.
- [ ] Hiển thị rõ chờ ký, đang xác nhận, thành công và thất bại.
- [ ] Liên kết tới explorer cho transaction đã xác nhận.
- [ ] Không hiển thị private key hoặc seed phrase.
- [ ] Kiểm thử luồng người dùng bằng Playwright.

## Đầu ra

- Web app cho admin và issuer.
- Các trạng thái UI tương ứng với state machine backend.
- Luồng kết nối ví và ký transaction.
- Bộ e2e test chính.

## Tiêu chí hoàn thành

Issuer có thể tự nhập dữ liệu, xem lỗi, freeze batch, kết nối ví, ký transaction và thấy kết quả receipt mà không cần thao tác trực tiếp trong database.
