# T-029: Xóa hoàn toàn thanh thông báo trên cùng (`.system-bar`) khỏi Website Công khai

## Mục tiêu
Gỡ bỏ hoàn toàn dải `.system-bar` ở đỉnh Website Công khai (`EVM REGISTRY CONFIGURED · Anvil Local EVM (31337) · Registry: 0x5fbdb231...180aa3 · Chuẩn giao thức: JCS RFC 8785 · SHA-256 Merkle`) khỏi `project/apps/web` để trang chủ mở trực tiếp bằng thanh Header kính mờ trắng (`.site-header`) + logo SVG mới, đồng bộ CSS, tài liệu và validator.

## Yêu cầu đã chốt (GRILL)
1. **Xóa khối `.system-bar`**: Loại bỏ hoàn toàn `<div className="system-bar">...</div>` khỏi `src/App.tsx`, giữ nguyên thông số mạng EVM ở Footer cột 4, trang *Chuẩn Kỹ thuật* và *Console Sidebar*.
2. **Dọn CSS & giữ selector dùng chung**: Xóa `.system-bar*`, `.mono-meta*`, `.system-reset-btn*` trong `src/styles.css`, đồng thời giữ lại `.live-indicator`, `.live-dot` (Console Sidebar) và `.system-divider` (Breadcrumb bar).
3. **Đồng bộ tài liệu & kiểm tra**: Cập nhật `DESIGN.md`, `README.md`, `scripts/validate-web.mjs` (cấm sót `system-bar` trong `src/App.tsx` và `src/styles.css`) và `harness/context/current-state.md`.

## Phạm vi cho phép
- `project/apps/web/`
- `harness/context/current-state.md`

## Tiêu chí hoàn thành
- `AC-1`: Không còn `<div className="system-bar">` hay CSS `.system-bar*` trong `project/apps/web/src/`.
- `AC-2`: Giữ nguyên `.live-indicator`, `.live-dot` cho Console Sidebar và `.system-divider` cho Breadcrumb bar.
- `AC-3`: `DESIGN.md`, `README.md`, `scripts/validate-web.mjs` và `harness/context/current-state.md` được đồng bộ đầy đủ.
- `AC-4`: `npm.cmd run build`, `node --check scripts/validate-web.mjs`, `node scripts/validate-web.mjs`, `git diff --check` và `harness doctor` đều PASS; kiểm tra trình duyệt trực tiếp xác nhận `.site-header` áp sát mép trên cùng.
