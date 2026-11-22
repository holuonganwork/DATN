# Cơ chế vận hành quality gates trong harness

Tài liệu này quy định quy trình kiểm soát chất lượng cho task có `quality_profile` là `code` hoặc `harness`. Quy tắc clean code, boundary và test của mã nguồn sản phẩm tham chiếu nguồn chuẩn duy nhất tại `project/docs/quality-gates.md`; danh sách command cụ thể lấy từ task JSON.

## Quality loop

1. Lập kế hoạch ngắn, sửa từng lát cắt nhỏ và chạy các gate khai báo trong task.
2. Nếu gate thất bại, đọc toàn bộ lỗi, sửa nguyên nhân trong `allowed_paths` và lặp lại tối đa **2 vòng tự động** trước khi báo `FAILED` hoặc `BLOCKED`.
3. Trước `validate`, ghi event `quality_reviewed` nêu rõ file đã xem, finding, quyết định xử lý và command đã chạy.

## Static scan tự động

`harness/validators/quality.mjs` quét các file code thay đổi thuộc `project/` và chặn các pattern rõ ràng: `debugger`, `console.log`, `@ts-ignore`/`@ts-nocheck`, `as any` và `catch` rỗng. Static scan chỉ là lớp bổ trợ, không thay thế lint, typecheck, test, build và review kiến trúc.

## Bằng chứng và điều kiện mark-done

Task chỉ được `finalize --mark-done` khi đã có đủ:

- `harness/evidence/task-reports/<task-id>-<run-id>.md`
- `harness/evidence/validation/<task-id>-<run-id>.json`
- Không còn hạng mục `manual_validation_required` chưa xác nhận.
