# Hai demo HTML tham khảo

Mở trực tiếp bằng Chrome hoặc Edge, không cần cài thư viện hay chạy server:

- [Đề tài 1 — LLM Audit](de_tai_1.html): đổi snapshot, chọn A0/A1/A2, xem finding/bằng chứng/khuyến nghị, nhận xét và tải Markdown. Có thể mở file `.sol` trên máy; mã ngoài mẫu không được phân tích tự động.
- [Đề tài 2 — Agent Lab](de_tai_2.html): chạy tự động hoặc từng bước, tạm dừng, đổi ngân sách, xem PoC/log/verifier và tải JSON phiên mẫu.

Giữ thư mục `assets/` bên cạnh hai file HTML. Toàn bộ tài nguyên nằm trong thư mục này; demo không gọi CDN, API, model, Slither hoặc Foundry, không cần khóa API và không gửi code ra ngoài. Nhận xét/phiên chạy được giữ trong bộ nhớ đến khi tải lại trang; muốn lưu thì dùng nút tải báo cáo.

## Các tình huống nên thử

1. Đề tài 1, bản lỗi + A1: xem phép tính `floor(1 × 100 / 200) = 0` và nhận xét finding.
2. Chuyển A2 rồi chạy lại: xem ba thẻ tri thức tự soạn, không phải kết quả RAG thực.
3. Chọn bản sửa: đối chiếu đốt 1 cổ phần; không suy ra contract an toàn toàn bộ.
4. Chỉnh code hoặc mở `.sol`: demo báo chưa phân tích mã tùy ý, không đưa kết quả giả.
5. Đề tài 2, bản lỗi + 4 lượt: theo dõi lỗi thiếu approve, sửa PoC và verifier chấp nhận kịch bản mẫu.
6. Bản sửa + 4 lượt: ứng viên không chứng minh được lỗi mục tiêu.
7. Chọn ngân sách 2 lượt: phiên dừng trước bước sửa, trạng thái chưa xác nhận.

## Giới hạn kỹ thuật

Code Solidity và Foundry hiển thị là trích đoạn mô hình số nguyên, token 0 decimals, không phí và không chiến lược. Interface, triển khai token, constructor, setup và harness được lược bỏ; không thể lấy riêng đoạn code hiển thị để biên dịch cả dự án. Các kết quả là kịch bản soạn trước, không phải số liệu thực nghiệm hoặc bằng chứng audit.

JavaScript chỉ điều khiển giao diện. Để thành sản phẩm thực cần backend xử lý snapshot, gọi LLM, truy xuất dữ liệu và runner/verifier tương ứng; phạm vi nghiên cứu đã nêu trong các file đề tài ở thư mục gốc.
