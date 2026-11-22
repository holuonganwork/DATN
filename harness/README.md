# Harness cục bộ cho Coding Agent

`harness/` là bộ điều phối cục bộ cho quá trình xây dựng đồ án trong `project/`. Runtime log không được gửi ra ngoài và chỉ cần tồn tại trong workspace local.

## Cấu trúc

- `context/`: brief, scope, kiến trúc, quy ước và decision log.
- `tasks/inbox/`: task mới hoặc task đang chờ chuẩn hóa.
- `tasks/ready/`: task JSON đã hợp lệ, có thể chạy.
- `tasks/active/`, `tasks/done/`, `tasks/blocked/`: trạng thái vận hành.
- `runner/harness.mjs`: runner Node.js không có dependency ngoài.
- `validators/`: kiểm tra task schema, scope, secret và quality.
- `schemas/`: schema JSON của task và event log.
- `runtime/runs/`: run manifest, event JSONL, output command và summary; đây là dữ liệu local tạm thời.
- `state/`: con trỏ task hiện tại và trạng thái dự án.
- `evidence/`: bằng chứng được chọn để lưu cho từng task.

## Lifecycle

Mỗi lần Agent làm việc phải có một run:

```text
start → execute → validate → finalize
             ↘ resume (khi tiến trình bị dừng hoặc command thất bại)
```

Entrypoint trên Windows:

```text
harness\runner\run-task.cmd T-001
harness\runner\status.cmd --all
harness\runner\resume.cmd <run-id>
```

Entrypoint portable:

```text
node harness/runner/harness.mjs run T-001
node harness/runner/harness.mjs status --all --json
node harness/runner/harness.mjs resume <run-id>
```

Runner ghi event vào `runtime/runs/<run-id>/events.jsonl`. Mỗi dòng có `run_id`, `sequence`, timestamp, phase, event type, task id và payload đã redact. File event chỉ được append; `run.json` và `summary.json` là dữ liệu dẫn xuất được cập nhật atomic.

## Task machine-readable

Markdown trong `tasks/inbox/` là tài liệu giải thích. Bản thực thi nằm trong `tasks/ready/*.json` theo [task schema](schemas/task.schema.json). Mỗi task phải có ID dạng `T-001`, dependency, allowed paths, acceptance criteria, command, retry policy và completion report contract.

Chuyển Markdown thành JSON sau khi cập nhật nội dung:

```text
node harness/tools/convert-tasks.mjs
node harness/runner/harness.mjs doctor
```

## Validator và bằng chứng

`doctor` kiểm tra Node.js, thư mục runtime, task JSON và duplicate ID. Khi run được validate, runner kiểm tra:

- task schema;
- file thay đổi có nằm trong scope hay không;
- secret/private key trong file thay đổi;
- command và lifecycle event;
- evidence tối thiểu trước khi mark task done.

Không dùng `--mark-done` nếu acceptance criteria vẫn cần xác nhận thủ công. Run ở trạng thái `needs_review` vẫn giữ toàn bộ log để Agent hoặc người dùng tiếp tục.

## Chính sách log local

- Không ghi private key, token hoặc giá trị secret nguyên văn; stdout/stderr được redact.
- Log command dài được lưu theo file trong thư mục run và payload event bị giới hạn kích thước.
- `runtime/` có thể xóa khi đã lưu summary/evidence cần thiết.
- Nếu Agent không được khởi chạy qua `run-task` thì phải gọi `start`, dùng `event` cho thao tác quan trọng và gọi `finalize`; Markdown đơn thuần không thể tự bắt mọi tool call.

## Bản đồ task sản phẩm

| Giai đoạn | Nội dung | Task |
| --- | --- | --- |
| 01 | Khởi động, phạm vi và tiêu chí chấp nhận | T-001 |
| 02 | Kiến trúc, dữ liệu và trạng thái nghiệp vụ | T-002 |
| 03 | Credential core, hash và Merkle | T-003 |
| 04 | Smart contract và mạng EVM | T-004 |
| 05 | Backend và quy trình phát hành | T-005 |
| 06 | Frontend và kết nối ví | T-006 |
| 07 | Verifier độc lập | T-007 |
| 08 | Worker, indexer và phục hồi lỗi | T-008 |
| 09 | PDF, cổng học viên và chia sẻ | T-009 |
| 10 | Kiểm thử, benchmark và quan sát | T-010 |
| 11 | Demo, báo cáo và bàn giao | T-011 |

`T-012` là task bảo trì harness hiện tại và không thuộc mã nguồn sản phẩm.
