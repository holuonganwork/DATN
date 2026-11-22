# T-026: Bo tròn hệ thống nút dạng Pill (`9999px`) cho `project/apps/web`

## Mục tiêu
Chuyển đổi hình khối toàn bộ hệ nút hành động, nút tiện ích, điều hướng/tab và 3 cụm thanh tìm kiếm gắn liền trong `project/apps/web` sang kiểu **bo tròn viên thuốc (Pill — `9999px`)**, hài hòa với chủ đề **Academic Azure · Bright Marine (1D)** (`T-025`) và nhãn trạng thái `.status-pill` hiện có.

## Yêu cầu đã chốt (GRILL)
1. **Mức độ bo tròn**: Pill (`9999px`) qua CSS token `--radius-pill: 9999px;` và `--radius-btn: var(--radius-pill);`, kèm cân chỉnh padding ngang tỷ lệ với từng kích thước nút để chữ thoáng và không sát mép cong.
2. **Phạm vi nút & điều hướng**:
   - Nút hành động chính/phụ: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-danger-outline`, `.btn-ghost` (gồm `.btn-sm`, `.btn-xs`, `.hero-submit-btn`, `.header-portal-cta`).
   - Nút tiện ích: `.theme-toggle-btn`, `.file-upload-btn`, `.session-switch-btn`, `.notice-dismiss`, `.footer-inline-btn`, `.system-reset-btn`, `.sample-code-chip`.
   - Điều hướng & chuyển tab: `.nav-item`, `.sidebar-link`, `.segmented-tabs`, `.seg-btn`.
   - Giữ nguyên bo card (`8px`–`10px`) cho các thẻ chọn nhiều dòng (`.role-select-card`, `.batch-item`, `.cred-chip`), card/panel/modal/phôi chứng chỉ và các badge kỹ thuật tĩnh (`4px`).
3. **Thanh tìm kiếm đứng liền nút Pill**:
   - Đồng bộ Pill (`9999px`) cho `.header-search-form` (cùng `.header-search-btn`), `.hero-input-wrap` và `.search-bar input`.
   - Giữ nguyên bo `6px`–`8px` cho các ô form nhập liệu thông thường (`.form-field`, `.filter-bar`, `.inline-create-form`, `.json-editor`, `.sidebar-org-field select`).
4. **Hoàn thiện tương tác & đồng bộ hệ thống thiết kế**:
   - Bổ sung `:focus-visible` bo tròn (`outline: 2px solid var(--border-strong); outline-offset: 2px;`) và trạng thái `:hover` rõ ràng cho `.btn-danger`, `.btn-danger-outline`, `.file-upload-btn`, `.footer-inline-btn`.
   - Đồng bộ `project/apps/web/DESIGN.md` và bổ sung kiểm tra token bo tròn trong `project/apps/web/scripts/validate-web.mjs`.
   - Giữ nguyên bố cục `.site-header` 1 hàng tại độ rộng `1440px` cho cả Light Mode và Dark Mode.

## Phạm vi cho phép
- `project/apps/web/`
- `harness/context/current-state.md`

## Tiêu chí hoàn thành
- `AC-1`: Token `--radius-pill` và `--radius-btn` được khai báo và áp dụng nhất quán cho toàn bộ hệ nút hành động, tiện ích, điều hướng/tab và 3 cụm thanh tìm kiếm đã chốt; thẻ chọn nhiều dòng và form input thông thường giữ nguyên bo card/input.
- `AC-2`: `:focus-visible` bo tròn và `:hover` cho `.btn-danger`, `.btn-danger-outline`, `.file-upload-btn`, `.footer-inline-btn` hoạt động tốt ở cả Light Mode và Dark Mode; 3 màu trạng thái mật mã không thay đổi.
- `AC-3`: `.site-header` giữ nguyên bố cục 1 hàng tại độ rộng `1440px` ở cả Light Mode và Dark Mode, kiểm chứng trực quan trên trình duyệt.
- `AC-4`: `project/apps/web/DESIGN.md`, `project/apps/web/scripts/validate-web.mjs` và `harness/context/current-state.md` được cập nhật đồng bộ.
- `AC-5`: `npm.cmd run build`, `node --check scripts/validate-web.mjs`, `node scripts/validate-web.mjs`, `git diff --check` và `node harness/runner/harness.mjs doctor --json` đều PASS.
