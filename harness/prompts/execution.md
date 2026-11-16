# Mẫu thực hiện task

1. Chọn task JSON trong `harness/tasks/ready/` và đọc các file trong `context_files`.
2. Khởi tạo run bằng `node harness/runner/harness.mjs start <task-id>` hoặc dùng lệnh `run` để chạy trọn lifecycle.
3. Viết kế hoạch ngắn gồm mục tiêu, file dự kiến sửa, acceptance criteria, quality gates và rủi ro.
4. Kiểm tra scope, precondition, dependency và trạng thái Git trước khi sửa.
5. Thực hiện thay đổi nhỏ, giữ boundary rõ ràng, dùng tên mô tả và giữ domain logic độc lập với I/O.
6. Sau mỗi thay đổi logic, chạy quality loop: kiểm tra format, lint, typecheck, test và build theo task.
7. Ghi các thao tác quan trọng bằng `node harness/runner/harness.mjs event <run-id> <phase> <event-type>`; trước validate phải ghi `quality_reviewed` với các finding đã xử lý hoặc được chấp nhận.
8. Đọc toàn bộ lỗi và sửa trong scope; giới hạn tối đa hai vòng sửa tự động trước khi báo `FAILED` hoặc `BLOCKED`.
9. Lưu task report và validation evidence vào `harness/evidence/`.
10. Chỉ `finalize --mark-done` khi execution, validation, quality review và evidence đều đạt; nếu còn cần người xác nhận, giữ trạng thái `needs_review`.
