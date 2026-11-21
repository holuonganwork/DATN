# T-027: Làm sáng Sidebar Console (`#F0F9FF`) & Xóa hoàn toàn Dark Mode

## Mục tiêu
Làm sáng thanh Sidebar Console (`.app-sidebar`) sang tông xanh băng dịu **Soft Ice-Azure (`#F0F9FF`)** để giảm cảm giác tối/đậm, đồng thời xóa hoàn toàn chế độ Tối (Dark Mode) và toàn bộ nút/trạng thái chuyển đổi giao diện khỏi `project/apps/web`.

## Yêu cầu đã chốt (GRILL)
1. **Console Sidebar (`.app-sidebar`)**: Dùng nền `#F0F9FF`, viền `#BAE6FD`, chữ và biểu ngữ `#075985`, thẻ phiên và hộp mạng nền `#FFFFFF`, mục đang chọn `#0284C7` chữ `#FFFFFF` (giữ nguyên bo tròn Pill `--radius-btn: 9999px`).
2. **Xóa hoàn toàn Dark Mode**:
   - Xóa `ThemeMode`, `THEME_STORAGE_KEY`, `loadInitialTheme`, `theme`, `toggleTheme`, `useEffect` gắn `data-theme`, nút `.theme-toggle-btn` ở Header/Auth Gate/Console Topbar và mục `.footer-inline-btn` trong Footer ở `src/App.tsx`.
   - Xóa toàn bộ `[data-theme="dark"]` (block token và tất cả selector override), `.theme-toggle-btn`, `.footer-inline-btn` khỏi `src/styles.css`.
   - Cập nhật `<meta name="theme-color" content="#075985" />` trong `index.html`.
   - Đồng bộ `DESIGN.md` và bổ sung kiểm tra loại bỏ Dark Mode trong `scripts/validate-web.mjs`.

## Phạm vi cho phép
- `project/apps/web/`
- `harness/context/current-state.md`

## Tiêu chí hoàn thành
- `AC-1`: Thanh `.app-sidebar` dùng nền `#F0F9FF`, viền `#BAE6FD`, chữ `#075985`, mục active `#0284C7` chữ trắng, giữ bo tròn Pill.
- `AC-2`: Không còn nút chuyển Sáng/Tối hay mã `[data-theme="dark"]` / `toggleTheme` trong `project/apps/web/src/`.
- `AC-3`: `DESIGN.md`, `index.html`, `scripts/validate-web.mjs` và `harness/context/current-state.md` được đồng bộ đầy đủ.
- `AC-4`: `npm.cmd run build`, `node --check scripts/validate-web.mjs`, `node scripts/validate-web.mjs`, `git diff --check` và `harness doctor` đều PASS.
