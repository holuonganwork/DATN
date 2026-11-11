# Codex Agent Operating Instructions

## 1. Mục đích

Workspace này dùng để phát triển đồ án tốt nghiệp:

> Hệ thống phát hành và xác thực chứng chỉ đào tạo tích hợp blockchain.

`harness/` là môi trường nội bộ giúp Codex Agent làm việc chính xác, có kiểm soát và có thể khôi phục. `harness/` không phải là chức năng của sản phẩm và không thuộc phạm vi đồ án cần nộp.

`project/` là mã nguồn thật của đồ án. Khi người dùng yêu cầu xây dựng sản phẩm, mặc định chỉ được sửa trong `project/`, trừ khi người dùng nói rõ cần sửa harness.

## 2. Thứ tự ưu tiên thông tin

Khi có mâu thuẫn, ưu tiên theo thứ tự:

1. Yêu cầu mới nhất, rõ ràng của người dùng.
2. File `AGENTS.md` đang áp dụng.
3. File task đang thực hiện trong `harness/tasks/`.
4. Tài liệu trong `harness/context/`.
5. Suy luận của Agent.

Không tự ý giải quyết mâu thuẫn bằng cách mở rộng phạm vi. Hãy ghi nhận vấn đề và chuyển task sang trạng thái `blocked` nếu không thể tiếp tục an toàn.

## 3. Quy trình bắt buộc cho mỗi prompt có yêu cầu thay đổi

### Bước 1: Xác định task

- Nếu prompt có mã task, đọc file task tương ứng trong `harness/tasks/`.
- Nếu prompt chưa có mã task, chuyển yêu cầu thành một task nháp trong `harness/tasks/inbox/` trước khi triển khai.
- Nếu mục tiêu, phạm vi hoặc tiêu chí hoàn thành chưa đủ rõ, không tự đoán phần nghiệp vụ quan trọng; ghi rõ điểm bị chặn.

### Bước 2: Đọc ngữ cảnh cần thiết

Tối thiểu phải đọc:

```text
harness/context/project-brief.md
harness/context/scope.md
```

Đọc thêm `architecture.md`, `conventions.md`, decision log hoặc tài liệu trong `project/docs/` khi task liên quan.

Nếu `project/AGENTS.md` đã được tạo, phải đọc file đó trước khi sửa mã nguồn trong `project/`. Nếu file chưa tồn tại, áp dụng các quy tắc trong file này và tài liệu task.

### Bước 3: Kiểm tra trạng thái hiện tại

- Đọc `harness/context/current-state.md` nếu file tồn tại.
- Kiểm tra `harness/state/` nếu đã được khởi tạo.
- Kiểm tra `git status` của `project/` trước khi sửa.
- Không ghi đè thay đổi đang tồn tại mà chưa được người dùng yêu cầu xử lý.

### Bước 4: Lập kế hoạch ngắn

Trước khi sửa code, phải xác định:

- mục tiêu của task;
- các file dự kiến thay đổi;
- tiêu chí chấp nhận;
- lệnh kiểm tra sẽ chạy;
- rủi ro hoặc giả định chính.

### Bước 5: Triển khai có giới hạn

- Chỉ sửa các đường dẫn nằm trong `allowed_paths` của task.
- Không mở rộng sang tính năng khác chỉ vì thấy cần thiết.
- Không thay đổi công nghệ, kiến trúc hoặc schema lớn nếu chưa ghi decision phù hợp.
- Không dùng dữ liệu thật, secret thật, private key thật hoặc thông tin cá nhân thật.
- Không triển khai lên production, push code hoặc gửi thông tin ra bên ngoài nếu người dùng chưa yêu cầu.

### Bước 6: Tự kiểm tra

Chạy các lệnh được khai báo trong task. Nếu task không khai báo, chọn các kiểm tra phù hợp với phần code đã sửa, tối thiểu gồm lint/typecheck/test hoặc build tương ứng.

Không tuyên bố task hoàn thành chỉ dựa trên việc code đã được viết. Phải có kết quả kiểm tra.

### Bước 7: Sửa lỗi có giới hạn

Nếu kiểm tra thất bại:

1. Đọc toàn bộ lỗi.
2. Sửa nguyên nhân trong phạm vi task.
3. Chạy lại kiểm tra.

Không lặp vô hạn. Sau tối đa hai vòng sửa tự động, báo `FAILED` hoặc `BLOCKED` cùng nguyên nhân cụ thể.

### Bước 8: Ghi nhận kết quả

Sau mỗi task, cập nhật nếu các thư mục đã tồn tại:

```text
harness/state/
harness/evidence/task-reports/
harness/evidence/validation/
```

Báo cáo phải nêu file đã thay đổi, lệnh đã chạy, kết quả kiểm tra, giả định và vấn đề còn lại.

## 4. Quy tắc về phạm vi sản phẩm

Sản phẩm tập trung vào phát hành, xác thực, thu hồi và tra cứu trạng thái chứng chỉ đào tạo. Dữ liệu cá nhân và file chứng chỉ phải được lưu ngoài blockchain; blockchain chỉ lưu dữ liệu cần cho tính toàn vẹn, định danh và trạng thái xác thực.

Không tự ý bổ sung multi-chain, mainnet, mobile wallet, AI, OCR, thanh toán, W3C Verifiable Credentials đầy đủ hoặc các tính năng SaaS lớn nếu task không yêu cầu.

## 5. Quy tắc Git và file tạm

- Không commit, push, tạo release hoặc triển khai nếu người dùng chưa yêu cầu.
- Không xóa thay đổi của người dùng.
- Có thể dùng worktree hoặc branch tạm để cô lập task.
- Không đưa token, secret, file `.env`, log nhạy cảm hoặc private key vào Git.

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

## 7. Bắt buộc ghi log harness

- Mỗi lần Agent thực hiện thay đổi phải có một `run_id` trong `harness/runtime/runs/`.
- Khởi tạo run bằng `node harness/runner/harness.mjs start <task-id>` hoặc chạy trọn lifecycle bằng `node harness/runner/harness.mjs run <task-id>`.
- Khi tiến trình bị dừng, dùng `resume` thay vì tạo lại trạng thái từ trí nhớ.
- Không đánh dấu task hoàn thành nếu run log, validation và evidence tương ứng chưa có.

## 8. Workflow bắt buộc cho mọi task Codex trong workspace

Mọi task Agent thực hiện trong workspace này phải đi qua đúng thứ tự sau trước khi triển khai:

1. **GRILL** — gọi `$grill-me` nếu runtime đã đăng ký command. Nếu command chưa khả dụng, thực hiện phase tương đương bằng cách kiểm tra các fact có thể tra cứu, lập design tree, hỏi toàn bộ câu hỏi ở frontier hiện tại và chờ quyết định cần thiết. Không giả nhận rằng slash command đã chạy.
2. **PLAN** — gọi `/plan` nếu runtime đã đăng ký command. Nếu chưa có, ghi plan trực tiếp trong phiên làm việc với mục tiêu, file dự kiến sửa, acceptance criteria, quality gates, lệnh kiểm tra và rủi ro. Chưa chỉnh sửa mã nguồn hoặc tài liệu triển khai trước khi plan hoàn tất.
3. **GOAL** — gọi `/goal` nếu runtime đã đăng ký command; nếu chưa có, dùng native goal tool `create_goal` với objective trùng task. Goal phải tồn tại trước khi bắt đầu execution và được cập nhật thành `complete`, `blocked` hoặc `paused` ở cuối phiên theo trạng thái thực tế.
4. **EXECUTE** — sau ba phase trên, khởi tạo hoặc tiếp tục harness run, triển khai trong `allowed_paths`, chạy quality gates và ghi event quan trọng.
5. **FINALIZE** — chạy validation, lưu evidence, finalize harness run và cập nhật goal. Không báo hoàn thành khi goal, run log, validation hoặc evidence còn thiếu.

Thứ tự chuẩn là:

```text
GRILL → PLAN → GOAL → EXECUTE → VALIDATE → FINALIZE → GOAL COMPLETE
```

Quy tắc này áp dụng cho task code, tài liệu, review, repair và thay đổi harness. Slash command là capability của runtime; phần fallback ở trên giữ nguyên mục đích và thứ tự khi capability đó chưa được đăng ký.
