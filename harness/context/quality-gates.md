# Quality gates và clean code

Đây là reference dùng khi task có `quality_profile` là `code` hoặc `harness`. Task JSON là nguồn truth cho command; tài liệu này định nghĩa điều Agent phải quan sát trước khi chạy command.

## Quality loop

Agent lập kế hoạch, sửa một lát cắt nhỏ, chạy các gate đã khai báo, đọc toàn bộ lỗi, sửa nguyên nhân và lặp lại tối đa hai vòng. Trước `validate`, Agent ghi event `quality_reviewed` với file đã xem, finding, quyết định xử lý và command đã chạy.

## Clean code contract

- Giữ một trách nhiệm cho mỗi module và hàm; tách domain logic khỏi database, RPC, filesystem và HTTP.
- Đặt tên theo domain và hành vi; đưa giá trị nghiệp vụ vào constant hoặc type có tên.
- Kiểm tra input ở boundary; dùng kiểu dữ liệu rõ ràng và schema validation.
- Propagate hoặc chuyển lỗi thành lỗi domain có ngữ nghĩa; không nuốt lỗi.
- Ưu tiên interface nhỏ, dependency rõ và hàm thuần cho logic hash, chuẩn hóa, Merkle và trạng thái.
- Viết test cho hành vi đúng, quyền, lỗi, retry và idempotency; không chỉ kiểm tra implementation detail.
- Giữ diff nhỏ; không thêm abstraction, comment hoặc dependency khi chưa có lý do trong acceptance criteria.

## Finding chặn

Static quality scan chặn các pattern rõ ràng trong code project: `debugger`, `console.log`, `@ts-ignore`/`@ts-nocheck`, `as any` và catch rỗng. Lint, typecheck, test, build và review kiến trúc vẫn là gate chính khi stack đã được chốt.

## Bằng chứng

Task report nằm tại `harness/evidence/task-reports/<task-id>-<run-id>.md`; validation machine-readable nằm tại `harness/evidence/validation/<task-id>-<run-id>.json`. Không dùng `--mark-done` khi thiếu một trong hai file hoặc còn manual review.
