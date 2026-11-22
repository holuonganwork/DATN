# T-030: Gọn hóa rule trùng lặp và dọn file dư (giữ nguyên GRILL → PLAN → GOAL)

## Mục tiêu
Giữ nguyên 100% quy trình bắt buộc `GRILL → PLAN → GOAL → EXECUTE → VALIDATE → FINALIZE → GOAL COMPLETE` và toàn bộ ràng buộc an toàn/harness hiện có, đồng thời loại bỏ phần trùng lặp trên 7 file rule/prompt, chốt `project/docs/quality-gates.md` làm nguồn chuẩn duy nhất (Single Source of Truth) cho quy tắc clean code của `project/`, xóa `clean-code-typescript.md` ở root và cấu hình `.gitignore` cho bộ skill `ponytail`.

## Yêu cầu đã chốt (GRILL)
1. **Gọn hóa toàn bộ 7 file rule/prompt (không mất ràng buộc)**:
   - Hợp nhất Mục 3 (8 bước), Mục 7 (harness log) và Mục 8 (workflow 5 pha) trong `AGENTS.md` thành 1 dòng chảy thống nhất.
   - Chốt `project/docs/quality-gates.md` làm Single Source of Truth cho quy tắc clean code & quality gates của `project/` (tích hợp danh sách static scan pattern và yêu cầu interface nhỏ/hàm thuần/diff gọn).
   - Rút gọn phần lặp trong `project/AGENTS.md`, `harness/AGENTS.md`, `harness/context/quality-gates.md` và `harness/prompts/{execution,review,repair}.md`, tham chiếu về nguồn chuẩn.
2. **Xóa `clean-code-typescript.md`**: Gỡ bỏ file 71.6 KB không có tham chiếu tại root workspace.
3. **Tích hợp bộ skill `ponytail`**: Giữ đủ 6 skill trong `.agents/skills/`, thêm quy ước phối hợp với `GRILL → PLAN → GOAL` trong `AGENTS.md`, và thêm `.agents/` cùng `skills-lock.json` vào `.gitignore` gốc.

## Phạm vi cho phép
- `AGENTS.md`
- `project/AGENTS.md`
- `harness/AGENTS.md`
- `project/docs/quality-gates.md`
- `harness/context/quality-gates.md`
- `harness/context/current-state.md`
- `harness/prompts/execution.md`
- `harness/prompts/review.md`
- `harness/prompts/repair.md`
- `.gitignore`
- `clean-code-typescript.md`

## Tiêu chí hoàn thành
- `AC-1`: `AGENTS.md` giữ nguyên thứ tự bắt buộc `GRILL → PLAN → GOAL → EXECUTE → VALIDATE → FINALIZE → GOAL COMPLETE`, giữ đầy đủ quy tắc phạm vi, Git/bảo mật, báo cáo cuối task, có quy ước phối hợp skill `.agents/skills/` và không lặp giữa Mục 3, 7, 8.
- `AC-2`: `project/docs/quality-gates.md` là Single Source of Truth đầy đủ cho clean code & quality gates của `project/`; `project/AGENTS.md`, `harness/AGENTS.md`, `harness/context/quality-gates.md` và 3 prompt trong `harness/prompts/` được rút gọn không trùng lặp.
- `AC-3`: `clean-code-typescript.md` đã bị xóa và `.gitignore` loại trừ `.agents/` cùng `skills-lock.json`.
- `AC-4`: `harness/context/current-state.md` cập nhật trạng thái hoàn thành `T-030`.
- `AC-5`: `node harness/runner/harness.mjs doctor`, `node --test harness/tests/*.test.mjs`, `git diff --check` và full lifecycle harness đều PASS.
