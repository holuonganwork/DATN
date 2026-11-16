# Công việc triển khai

Mỗi task có hai lớp:

- Markdown trong `inbox/` để người đọc hiểu bối cảnh, checklist và mục tiêu.
- JSON trong `ready/`, `active/`, `blocked/` hoặc `done/` để runner đọc và kiểm tra.

JSON là nguồn trạng thái máy đọc được. Markdown không được dùng để điều khiển lifecycle vì trạng thái viết tay có thể lệch khỏi run log.

## Trạng thái task

`draft → ready → active → done`

Nhánh lỗi là `active → failed` hoặc `active → blocked`. `needs_review` là trạng thái của run, dùng khi command đã đạt nhưng acceptance criteria vẫn cần người xác nhận.

## Lệnh thường dùng

```text
node harness/runner/harness.mjs doctor
node harness/runner/harness.mjs list-tasks --json
node harness/runner/harness.mjs run T-001
node harness/runner/harness.mjs status --all --json
node harness/runner/harness.mjs resume <run-id>
```

Mọi thay đổi trạng thái phải có run log và evidence tương ứng trong `harness/evidence/`.
