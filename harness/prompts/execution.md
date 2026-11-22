# Mẫu thực hiện task

1. Chọn task JSON trong `harness/tasks/ready/`, đọc `context_files` và `project/docs/quality-gates.md` (nếu sửa `project/`).
2. Hoàn tất các pha `GRILL → PLAN → GOAL`, sau đó khởi tạo run bằng `node harness/runner/harness.mjs start <task-id>` (hoặc `run <task-id>`).
3. Kiểm tra scope (`allowed_paths`), precondition, dependency và `git status` trước khi sửa.
4. Triển khai từng lát cắt nhỏ tuân thủ `project/docs/quality-gates.md`; chạy quality loop (tối đa 2 vòng sửa lỗi) theo `harness/context/quality-gates.md`.
5. Ghi các event quan trọng bằng `node harness/runner/harness.mjs event <run-id> <phase> <event-type>`, bắt buộc có `quality_reviewed` trước `validate`.
6. Lưu task report và validation evidence vào `harness/evidence/`; chỉ `finalize --mark-done` khi execution, validation, quality review và evidence đều đạt (giữ `needs_review` nếu còn bước xác nhận thủ công).
