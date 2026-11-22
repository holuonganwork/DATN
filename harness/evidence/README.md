# Bằng chứng thực hiện

Runtime log nằm trong `harness/runtime/runs/`. Evidence là phần được chọn lọc để chứng minh acceptance criteria và có thể giữ lại sau khi dọn runtime.

Quy ước:

- `task-reports/T-001-<run-id>.md`: báo cáo kết quả task.
- `validation/T-001-<run-id>.json`: kết quả validator hoặc test machine-readable.
- `screenshots/` và `benchmarks/`: ảnh chụp, số đo hoặc fixture khi task yêu cầu.

Mỗi báo cáo phải có task id, run id, files changed, commands run, validation results, remaining risks và tham chiếu tới summary/event log local.
