# Mẫu sửa lỗi

1. Mở run đang lỗi bằng `status` và đọc event cuối cùng.
2. Dùng `resume` nếu lỗi là command tạm thời hoặc tiến trình bị dừng.
3. Nếu cần sửa code, tạo run mới hoặc tiếp tục run hiện tại với event nguyên nhân rõ ràng.
4. Tái hiện lỗi bằng một bước kiểm tra hoặc kịch bản cụ thể.
5. Sửa với phạm vi nhỏ nhất phù hợp; giữ interface ổn định và tránh thêm abstraction chưa cần thiết.
6. Chạy lại quality gates và kiểm tra các nhánh lỗi liên quan.
7. Tự review diff cho readability, duplication, error handling, security và test coverage trước khi ghi `quality_reviewed`.
8. Ghi evidence sửa lỗi, cập nhật trạng thái task và nêu rủi ro còn lại.
