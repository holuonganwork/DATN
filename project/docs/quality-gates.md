# Quality gates của mã nguồn project

Tài liệu này là reference cho mọi task sửa mã trong `project/`. Task JSON vẫn là nguồn truth về command cụ thể.

## Quy tắc code

- Bật TypeScript strict khi package và stack được khởi tạo; kiểu ở module boundary phải rõ.
- Giữ domain logic độc lập với HTTP, database, filesystem và blockchain adapter.
- Validate input và quyền ở boundary; giữ lỗi có ngữ nghĩa và có context truy vết.
- Dùng tên theo nghiệp vụ; gom magic value và rule lặp vào constant, type hoặc policy có tên.
- Giữ hàm ngắn theo trách nhiệm; tách nhánh phức tạp thành policy hoặc helper có interface rõ.
- Không để debug statement, unsafe type escape hoặc catch rỗng trong code sản phẩm.
- Không thêm abstraction chỉ để che một đoạn code ngắn; ưu tiên interface sâu và module có contract rõ.

## Gate bắt buộc theo task

Task code phải khai báo và chạy các gate phù hợp với phần thay đổi: format, lint, typecheck, unit/integration test, build và `git diff --check`. Thay đổi blockchain phải có test quyền, receipt/event, chain/contract, proof và trạng thái. Thay đổi worker phải có test retry, idempotency và phục hồi.

Mỗi gate phải có output trong run log và validation evidence. Mỗi task phải có self-review về readability, duplication, error handling, security, boundary và test coverage trước khi finalize.
