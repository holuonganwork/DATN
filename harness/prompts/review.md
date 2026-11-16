# Mẫu review task

- Đọc `summary.json` và `events.jsonl` của run; kiểm tra lifecycle không bị thiếu phase.
- Đối chiếu file thay đổi với `target.allowed_paths`, `harness_write_paths` và `forbidden_paths`.
- Kiểm tra lỗi chức năng, quyền truy cập, dữ liệu nhạy cảm, khả năng retry/idempotency và boundary giữa domain với I/O.
- Chạy quality gates đã khai báo: format, lint, typecheck, test, build và `git diff --check` khi có.
- Tìm duplication, magic value, hàm nhiều trách nhiệm, lỗi bị nuốt, debug statement, unsafe type escape và test chỉ kiểm tra implementation.
- Kiểm tra `quality_reviewed` event có ghi finding, quyết định xử lý và command evidence.
- Kiểm tra tài liệu, trạng thái JSON task và bằng chứng trong `harness/evidence/`.
- Ghi rõ kết luận, phát hiện và điều kiện còn thiếu trước khi dùng `--mark-done`.
