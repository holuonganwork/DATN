# Mẫu review task

- Đọc `summary.json` và `events.jsonl` của run; kiểm tra lifecycle không thiếu pha và đúng thứ tự.
- Đối chiếu file thay đổi với `target.allowed_paths`, `harness_write_paths` và `forbidden_paths`.
- Review code/tài liệu thay đổi theo nguồn chuẩn `project/docs/quality-gates.md` (logic, quyền, dữ liệu nhạy cảm, retry/idempotency, boundary, duplication, pattern cấm và test coverage).
- Xác nhận các `validation_commands` khai báo (kèm `git diff --check`) đều đạt và có output trong run log.
- Kiểm tra event `quality_reviewed` có ghi finding, quyết định xử lý và command evidence.
- Kiểm tra trạng thái JSON task và đủ 2 file evidence trong `harness/evidence/` trước khi dùng `--mark-done`.
