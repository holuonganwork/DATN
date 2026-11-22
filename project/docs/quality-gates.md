# Quality gates và clean code của mã nguồn project

Đây là nguồn chuẩn duy nhất (Single Source of Truth) cho quy tắc clean code, boundary và test gates của mã nguồn trong `project/`. Task JSON là nguồn truth về danh sách command cụ thể cho từng task.

## Quy tắc code

- Bật TypeScript strict khi package và stack được khởi tạo; kiểu dữ liệu và schema validation ở module boundary phải rõ ràng.
- Giữ một trách nhiệm cho mỗi module và hàm; tách domain logic độc lập với HTTP, database, filesystem và blockchain/RPC adapter.
- Validate input và quyền ở boundary; propagate hoặc chuyển lỗi thành lỗi domain có ngữ nghĩa và context truy vết, không nuốt lỗi.
- Đặt tên theo domain/nghiệp vụ và hành vi; gom magic value và rule lặp vào constant, type hoặc policy có tên.
- Giữ hàm ngắn theo trách nhiệm; tách nhánh phức tạp thành policy hoặc helper có interface rõ; ưu tiên interface nhỏ, dependency rõ và hàm thuần cho logic hash, chuẩn hóa, Merkle và trạng thái.
- Giữ diff nhỏ; không thêm abstraction, comment hoặc dependency khi chưa có lý do trong acceptance criteria hoặc chỉ để che một đoạn code ngắn.
- Tránh các pattern bị chặn bởi static quality scan (`harness/validators/quality.mjs`): `debugger`, `console.log`, `@ts-ignore`/`@ts-nocheck`, `as any` và `catch` rỗng.

## Gate bắt buộc theo task

- Task code phải khai báo và chạy các gate phù hợp với phần thay đổi: format, lint, typecheck, unit/integration test, build và `git diff --check`.
- Test phải kiểm tra hành vi đúng và các nhánh lỗi quan trọng (không chỉ kiểm tra implementation detail): thay đổi blockchain cần test quyền, receipt/event, chain/contract, proof và trạng thái; thay đổi worker cần test retry, idempotency và phục hồi.
- Mỗi gate phải có output trong run log và validation evidence; bắt buộc self-review về readability, duplication, error handling, security, boundary và test coverage trước khi `finalize`.
