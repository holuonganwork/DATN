# T-028: Nâng cấp Logo CertChain sang Phương án 1 (`Azure 3-Layer Isometric Monolith SVG`)

## Mục tiêu
Thay thế logo raster đen–trắng nền xám `project/apps/web/public/logo.png` (`600×400`) bằng bản vector chuẩn tỷ lệ `1:1` nền trong suốt `project/apps/web/public/logo.svg` theo **Phương án 1 — Azure 3-Layer Isometric Monolith**, gỡ khung hộp xám cứng `.brand-logo-frame` và đồng bộ toàn bộ nhận diện trên `project/apps/web`.

## Yêu cầu đã chốt (GRILL)
1. **Logo mới (`public/logo.svg`)**: Giữ nguyên cấu trúc 3 vòm đồng tâm isometric gắn với *Kiến trúc bảo chứng 3 lớp L1–L2–L3*, tô phân tầng bảng màu **Academic Azure** (`#075985` Deep Ocean → `#0284C7` Bright Marine → `#38BDF8` Sky Azure + mặt đỉnh trắng băng `#FFFFFF`/`#E0F2FE`), tỷ lệ vuông `viewBox="0 0 128 128"`, nền trong suốt.
2. **Gỡ hộp xám & đồng bộ vị trí hiển thị**:
   - Xóa `public/logo.png`.
   - Cập nhật favicon trong `index.html` sang `type="image/svg+xml"` trỏ `/logo.svg`.
   - Cập nhật `BrandLogo` trong `src/App.tsx` trỏ `/logo.svg`.
   - Gỡ nền xám, viền cứng và bóng khung của `.brand-logo-frame` trong `src/styles.css`, bổ sung `object-fit: contain` và `drop-shadow` nhẹ cho `.brand-logo-img`.
   - Đồng bộ `DESIGN.md`, `README.md`, `scripts/validate-web.mjs` và `harness/context/current-state.md`.

## Phạm vi cho phép
- `project/apps/web/`
- `harness/context/current-state.md`

## Tiêu chí hoàn thành
- `AC-1`: File `project/apps/web/public/logo.svg` tồn tại chuẩn vector `128×128` nền trong suốt đủ 3 sắc xanh `#075985`, `#0284C7`, `#38BDF8` và không còn `public/logo.png`.
- `AC-2`: `BrandLogo`, `.brand-logo-frame` / `.brand-logo-img`, `index.html` dùng `/logo.svg` không khung hộp xám cứng.
- `AC-3`: `DESIGN.md`, `README.md`, `scripts/validate-web.mjs` và `harness/context/current-state.md` được đồng bộ đầy đủ.
- `AC-4`: `npm.cmd run build`, `node --check scripts/validate-web.mjs`, `node scripts/validate-web.mjs`, `git diff --check` và `harness doctor` đều PASS; kiểm chứng trực quan trên trình duyệt hiển thị sắc nét ở Header, Hero, Footer, Auth Gate và Console Sidebar.
