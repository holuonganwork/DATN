# Codex Agent Operating Instructions

## 1. Mục đích và ranh giới

Workspace này dùng để phát triển đồ án tốt nghiệp:

> Hệ thống phát hành và xác thực chứng chỉ đào tạo tích hợp blockchain.

- `harness/` là môi trường nội bộ giúp Agent làm việc chính xác, có kiểm soát và có thể khôi phục; không phải chức năng sản phẩm và không thuộc phạm vi đồ án cần nộp.
- `project/` là mã nguồn thật của đồ án. Khi người dùng yêu cầu xây dựng sản phẩm, mặc định chỉ được sửa trong `project/`, trừ khi người dùng nói rõ cần sửa harness.

## 2. Thứ tự ưu tiên và skill bổ trợ

Khi có mâu thuẫn, ưu tiên theo thứ tự:

1. Yêu cầu mới nhất, rõ ràng của người dùng.
2. File `AGENTS.md` đang áp dụng.
3. File task đang thực hiện trong `harness/tasks/`.
4. Tài liệu trong `harness/context/`.
5. Suy luận của Agent.

Không tự ý giải quyết mâu thuẫn bằng cách mở rộng phạm vi; chuyển task sang trạng thái `blocked` nếu không thể tiếp tục an toàn.

Skill bổ trợ trong `.agents/skills/` (như `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`) dùng để tối giản diff, tránh abstraction thừa và review sắc hơn trong quá trình thực hiện, nhưng **không được** bỏ qua thứ tự pha, `allowed_paths`, quality gates hoặc evidence bắt buộc trong file này.

## 3. Quy trình bắt buộc cho mọi task

Mọi task (code, tài liệu, review, repair và thay đổi harness) phải đi qua đúng thứ tự:

```text
GRILL → PLAN → GOAL → EXECUTE → VALIDATE → FINALIZE → GOAL COMPLETE
```

Slash command là capability của runtime; nếu chưa được đăng ký, thực hiện phase fallback tương đương và **không** giả nhận slash command đã chạy.

1. **GRILL:** Gọi `$grill-me` nếu runtime đã đăng ký. Nếu chưa, kiểm tra các fact có thể tra cứu, đọc ngữ cảnh tối thiểu (`harness/context/project-brief.md`, `harness/context/scope.md`, `harness/context/current-state.md`, file task nếu có mã task, cộng `project/AGENTS.md` hoặc `harness/AGENTS.md`, `architecture.md`, `conventions.md`, decision log, `project/docs/` khi liên quan), kiểm tra `harness/state/` và `git status`. Lập design tree, hỏi toàn bộ câu hỏi ở frontier hiện tại và chờ quyết định; nếu mục tiêu/phạm vi chưa đủ rõ, không tự đoán phần nghiệp vụ quan trọng mà ghi rõ điểm bị chặn.
2. **PLAN:** Gọi `/plan` nếu runtime đã đăng ký. Nếu chưa, ghi plan trực tiếp trong phiên làm việc gồm: mục tiêu, các file dự kiến sửa (`allowed_paths`), tiêu chí chấp nhận, quality gates, lệnh kiểm tra sẽ chạy và rủi ro/giả định chính. Nếu prompt chưa có mã task, tạo task nháp trong `harness/tasks/inbox/` (và task JSON trong `harness/tasks/ready/` khi chạy qua harness). Chưa chỉnh sửa mã nguồn hoặc tài liệu triển khai trước khi plan hoàn tất.
3. **GOAL:** Gọi `/goal` nếu runtime đã đăng ký; nếu chưa, dùng native goal tool `create_goal` với objective trùng task; nếu runtime không hỗ trợ cả hai, ghi nhận mục tiêu minh bạch qua kế hoạch và event trong harness run. Goal phải có trước khi execution và được cập nhật thành `complete`, `blocked` hoặc `paused` ở cuối phiên.
4. **EXECUTE:** Khởi tạo `run_id` trong `harness/runtime/runs/` bằng `node harness/runner/harness.mjs start <task-id>` (hoặc chạy trọn lifecycle bằng `node harness/runner/harness.mjs run <task-id>`). Khi bị gián đoạn, dùng `resume` thay vì dựng lại trạng thái từ trí nhớ. Chỉ sửa trong `allowed_paths`, không ghi đè thay đổi đang tồn tại của người dùng, không mở rộng tính năng ngoài scope, và không đổi công nghệ, kiến trúc hoặc schema lớn khi chưa ghi decision phù hợp. Chạy kiểm tra theo task (tối thiểu lint/typecheck/test/build tương ứng nếu task không khai báo); khi lỗi, đọc toàn bộ lỗi, sửa nguyên nhân trong scope và chạy lại tối đa **2 vòng tự động** trước khi báo `FAILED` hoặc `BLOCKED`. Ghi các event quan trọng, gồm `quality_reviewed` trước `validate`.
5. **VALIDATE & FINALIZE:** Không tuyên bố task hoàn thành chỉ vì đã viết code; phải có kết quả validation đạt. Lưu báo cáo và bằng chứng vào `harness/state/`, `harness/evidence/task-reports/`, `harness/evidence/validation/`, chạy `finalize` và cập nhật goal hoàn tất (`GOAL COMPLETE`). Không đánh dấu task hoàn thành nếu thiếu goal, run log, validation hoặc evidence.

## 4. Phạm vi sản phẩm

Sản phẩm tập trung vào phát hành, xác thực, thu hồi và tra cứu trạng thái chứng chỉ đào tạo. Dữ liệu cá nhân và file chứng chỉ phải được lưu ngoài blockchain; blockchain chỉ lưu dữ liệu cần cho tính toàn vẹn, định danh và trạng thái xác thực.

Không tự ý bổ sung multi-chain, mainnet, mobile wallet, AI, OCR, thanh toán, W3C Verifiable Credentials đầy đủ hoặc các tính năng SaaS lớn nếu task không yêu cầu.

## 5. Quy tắc Git, bảo mật và file tạm

- Không commit, push, tạo release, triển khai lên production hoặc gửi thông tin ra bên ngoài nếu người dùng chưa yêu cầu.
- Không xóa thay đổi của người dùng; có thể dùng worktree hoặc branch tạm để cô lập task.
- Không dùng hoặc đưa dữ liệu thật, secret thật, private key thật, thông tin cá nhân thật, token, file `.env` hoặc log nhạy cảm vào code hoặc Git.

## 6. Báo cáo cuối task

Báo cáo trong chat phải có mẫu tối thiểu:

```text
Task: <mã task>
Status: PASSED | FAILED | BLOCKED

Đã thực hiện:
- ...

Files changed:
- ...

Đã kiểm tra:
- <command>: PASS | FAIL

Giả định hoặc rủi ro còn lại:
- ...
```
