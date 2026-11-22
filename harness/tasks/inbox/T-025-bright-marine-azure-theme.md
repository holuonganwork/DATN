# T-025: Áp dụng chủ đề 1D — Bright Marine Azure cho `project/apps/web`

## Mục tiêu
Chuyển đổi bảng màu giao diện `project/apps/web` từ phong cách đơn sắc đen-trắng sang chủ đề **Academic Azure · Bright Marine (1D)** phù hợp với mục đích giáo dục, đồng thời giữ nguyên 3 màu trạng thái xác thực mật mã (`VALID` xanh lá, `PENDING` vàng hổ phách, `REVOKED` đỏ).

## Yêu cầu đã chốt (GRILL)
1. **Bảng màu chủ đạo 1D — Bright Marine Azure**:
   - **Light Mode**: Canvas `#f8fafc`, Surface `#ffffff`, Subtle `#f1f5f9`, Primary `#0284c7`, Hover `#0369a1`, Deep (`.system-bar`, `.kpi-value`, `.cert-learner-name`) `#075985`, Tint `#e0f2fe`, Tint Border `#7dd3fc`, Hairline Border `#e2e8f0`.
   - **Sidebar Console (`.app-sidebar`)**: Nền xanh biển thẫm `#082f49` (Light) / `#081c2e` (Dark), mục đang chọn `#0284c7` viền `#38bdf8`, chữ sáng dễ đọc.
   - **Dark Mode (`[data-theme="dark"]`)**: Nền xanh biển đêm `#06131f`, bề mặt card `#0c2236`, khối phụ `#12304b`, nổi `#163a5a`, viền `#164266`, nút chính `#0284c7` / hover `#0ea5e9`, điểm nhấn mạnh `#38bdf8`, KPI `#7dd3fc`.
   - **Trạng thái mật mã**: Giữ nguyên `--status-valid-*`, `--status-warn-*`, `--status-danger-*`.
2. **Logo & Phôi chứng chỉ**: Giữ nguyên `public/logo.png`; cập nhật khung `.certificate-sheet` với viền xanh biển `#0284c7` kết hợp viền kép mảnh `--brand-tint-border` và tên học viên theo sắc xanh sâu học thuật ở Light Mode.
3. **Header 1440px & Nhãn thiết kế**: Tinh chỉnh khoảng cách `.site-header-inner` để thanh điều hướng + tìm kiếm + nút chuyển theme nằm gọn trên 1 hàng ở `1440px` cho cả Light và Dark Mode; cập nhật pill Hero thành `ACADEMIC AZURE DESIGN · CERTCHAIN` và ghi chú Footer sang `Academic Azure · Bright Marine`.

## Phạm vi cho phép
- `project/apps/web/`
- `harness/context/current-state.md`

## Tiêu chí hoàn thành
- `AC-1`: `src/styles.css` cập nhật đầy đủ CSS tokens Light/Dark cho **1D Bright Marine Azure**, `.system-bar` xanh biển sâu, `.site-header`/`.workspace-topbar` frosted glass, `.hero-banner` micro-grid xanh trời dịu, `.app-sidebar` xanh biển thẫm và `.certificate-sheet` viền xanh biển.
- `AC-2`: Giữ nguyên bộ màu semantic `--status-valid-*`, `--status-warn-*`, `--status-danger-*`.
- `AC-3`: `.site-header` hiển thị gọn trên 1 hàng tại `1440px` ở cả Light/Dark Mode; `src/App.tsx` cập nhật nhãn `ACADEMIC AZURE DESIGN · CERTCHAIN` và dòng ghi chú Footer.
- `AC-4`: `DESIGN.md` đồng bộ bảng màu và quy tắc 1D Bright Marine Azure; `scripts/validate-web.mjs` bổ sung kiểm tra marker chủ đề mới.
- `AC-5`: `npm.cmd run build`, `node --check scripts/validate-web.mjs`, `node scripts/validate-web.mjs`, `git diff --check` và `node harness/runner/harness.mjs doctor --json` đều PASS.
