# Quality gates và clean code cho Agent

**Mục tiêu:** Tăng khả năng kiểm soát chất lượng code do Agent viết bằng quy tắc rõ ràng, quality gate máy kiểm tra được và điều kiện hoàn thành bắt buộc.

## Mô tả

- Bổ sung coding contract cho `project/` theo kiến trúc chứng chỉ hiện tại.
- Ghi rõ quality profile và review checklist trong task machine-readable.
- Siết runner để task chỉ được đánh dấu hoàn thành khi execution, validation và evidence đạt yêu cầu.
- Bổ sung validator cho quality profile, diff hygiene và các tín hiệu clean code dễ kiểm tra.
- Cập nhật prompt để Agent lập kế hoạch, sửa trong vòng lặp đỏ-xanh và lưu evidence.

## Checklist

- [ ] Bổ sung quy tắc clean code và boundary cho project.
- [ ] Bổ sung quality profile vào schema và task template.
- [ ] Kiểm tra validation command bắt buộc đối với task code.
- [ ] Kiểm tra diff hygiene và các pattern debug/unsafe.
- [ ] Chặn mark-done khi thiếu validation hoặc evidence.
- [ ] Cập nhật prompt execution, review và repair.
- [ ] Viết test regression cho các quality gate.

## Tiêu chí hoàn thành

1. Task code có quality profile và validation command bắt buộc; task tài liệu có thể khai báo manual review rõ ràng.
2. Runner không đánh dấu task done nếu execution/validation chưa đạt hoặc thiếu task report và validation evidence.
3. Validator phát hiện được các tín hiệu code cần review như debug statement, `@ts-ignore`, `as any` và catch rỗng trong file code thay đổi.
4. Agent có hướng dẫn làm việc theo kế hoạch, quality loop, self-review và evidence.
5. Test harness, doctor và lifecycle của chính task đều đạt.

## Đầu ra

- Coding contract của project.
- Quality profile và clean-code validator.
- Runner gate cho validation/evidence.
- Prompt execution/review/repair cập nhật.
- Test regression và evidence task.

## Rủi ro

- Chưa cài tooling TypeScript/ESLint/Prettier vì package.json của project đang rỗng và stack chưa được chốt.
- Static scan chỉ là tín hiệu review; quality gate chính vẫn là lint, typecheck, test và build được khai báo theo từng task sau khi stack được chốt.

## Thời lượng

Một phiên triển khai harness.
