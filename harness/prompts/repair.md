# Mẫu sửa lỗi

1. Mở run đang lỗi bằng `status` và đọc event cuối cùng; dùng `resume` nếu lỗi tạm thời hoặc tiến trình bị dừng.
2. Nếu cần sửa tiếp, tiếp tục run hiện tại hoặc tạo run mới với event ghi rõ nguyên nhân.
3. Tái hiện lỗi bằng bước kiểm tra cụ thể, sau đó sửa với phạm vi nhỏ nhất trong `allowed_paths`, giữ interface ổn định và tuân thủ `project/docs/quality-gates.md`.
4. Chạy lại quality gates (tối đa 2 vòng theo `harness/context/quality-gates.md`), tự review diff trước khi ghi `quality_reviewed`.
5. Cập nhật evidence trong `harness/evidence/`, trạng thái task và nêu rõ rủi ro còn lại.
