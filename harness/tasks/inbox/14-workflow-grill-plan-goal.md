# Quy trình grill, plan và goal cho workspace DATN

**Mục tiêu:** Bắt buộc mọi task Codex trong workspace DATN đi qua ba phase theo thứ tự `grill → plan → goal` trước khi sửa file.

## Mô tả

- Cập nhật `F:/DATN/AGENTS.md` với workflow kickoff áp dụng cho mọi phiên làm việc trong workspace.
- Dùng `/grill-me` khi runtime đăng ký command; khi command không khả dụng, thực hiện cùng phase bằng câu hỏi phản biện có cấu trúc.
- Ghi plan trước khi chỉnh sửa và khởi tạo goal native hoặc `/goal` trước execution.
- Kết thúc task bằng finalize harness và cập nhật goal.

## Tiêu chí hoàn thành

1. `AGENTS.md` mô tả thứ tự bắt buộc `grill → plan → goal → execute`.
2. `AGENTS.md` nêu rõ fallback khi `/grill-me`, `/plan` hoặc `/goal` chưa được đăng ký.
3. Quy trình không yêu cầu sửa cấu hình global dưới `C:/Users/anho2`.
4. Doctor, test harness và diff check đạt.

## Lệnh kiểm tra

- `node harness/runner/harness.mjs doctor`
- `node --test harness/tests/*.test.mjs`
- `git diff --check`

## Rủi ro

- Slash command là capability của runtime; AGENTS.md chỉ định nghĩa quy trình và không tự đăng ký command.
