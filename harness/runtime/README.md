# Runtime local

Mỗi run được lưu tại `runs/<run-id>/`:

- `run.json`: manifest và trạng thái dẫn xuất.
- `events.jsonl`: event append-only, mỗi dòng là một event độc lập.
- `commands/*.stdout.log`, `commands/*.stderr.log`: output đã redact.
- `summary.json`: kết quả finalize.

Runtime có thể xóa khi đã lưu evidence cần thiết. Không sao chép runtime log vào `project/`.
