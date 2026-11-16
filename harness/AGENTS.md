# Quy tắc harness

- `context/` là kiến thức nền và quyết định dùng chung; phải đọc trước khi thực hiện task.
- 11 task sản phẩm nằm trong `tasks/inbox/` và bản JSON tương ứng nằm trong `tasks/ready/`.
- `T-012` là task vận hành harness trong `tasks/done/`; task này không được sửa mã nguồn trong `project/`.
- Mọi lần Agent chạy phải có `run_id` và log append-only trong `runtime/runs/<run-id>/events.jsonl`.
- Lifecycle chuẩn là `start → execute → validate → finalize`; dùng `resume` khi run chưa kết thúc.
- Mọi thay đổi trạng thái task phải đi kèm summary và evidence trong `evidence/`.
- `runtime/` chỉ chứa dữ liệu tạm thời local và không được đưa vào sản phẩm.
- Không đặt mã nguồn ứng dụng hoặc dữ liệu nghiệp vụ chứng chỉ trong `harness/`.
- Không ghi secret, private key, token hoặc dữ liệu cá nhân thật vào log.
- Khi task có `quality_profile`, đọc `context/quality-gates.md` trước khi sửa.
- Task `code` hoặc `harness` phải có validation command; Agent phải ghi `quality_reviewed` trước validate.
- Không dùng `--mark-done` nếu thiếu execution/validation đạt, task report hoặc validation evidence.
