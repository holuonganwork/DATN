# Quy tắc harness

- Quy trình bắt buộc (`GRILL → PLAN → GOAL → EXECUTE → VALIDATE → FINALIZE → GOAL COMPLETE`), `run_id`, `resume` và bảo mật tuân theo `AGENTS.md` ở gốc workspace.
- `context/` là kiến thức nền và quyết định dùng chung; phải đọc trước khi thực hiện task.
- Bố cục task: mô tả nháp ở `tasks/inbox/`, task JSON đang chờ ở `tasks/ready/` và task đã hoàn tất ở `tasks/done/`.
- `runtime/` chỉ chứa log append-only (`events.jsonl`) và dữ liệu tạm local; không đưa vào sản phẩm và không ghi secret, private key, token hoặc dữ liệu cá nhân thật vào log.
- Không đặt mã nguồn ứng dụng hoặc dữ liệu nghiệp vụ chứng chỉ trong `harness/`.
- Mọi thay đổi trạng thái task phải đi kèm summary và bằng chứng trong `evidence/`.
- Khi task có `quality_profile`, đọc `context/quality-gates.md` trước khi sửa, ghi event `quality_reviewed` trước `validate`, và không dùng `--mark-done` nếu thiếu execution/validation đạt, task report hoặc validation evidence.
