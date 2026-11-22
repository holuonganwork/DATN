# T-022: Nâng cấp chiều sâu thị giác (Depth & Polish) cho giao diện Frontend

## Mục tiêu
Nâng cấp độ tinh xảo và chiều sâu thị giác cho `project/apps/web` trong khi giữ nguyên bản sắc Architectural Monochrome:
1. **Frosted Glass Header**: Áp dụng nền bán trong suốt + `backdrop-filter: blur(12px)` cho cả `.site-header` (Public Website) và `.workspace-topbar` (Internal Console).
2. **Stacked Shadow kiểu Vercel**: Nâng cấp bóng đổ nhiều lớp mỏng + viền hairline mềm (`--shadow-card`, `--shadow-card-elevated`, `--shadow-card-hover`) cho các card nổi bật.
3. **Architectural Micro-grid cho Hero**: Bổ sung lớp lưới ô vuông kiến trúc siêu mờ (`28px × 28px`) làm mờ dần ra rìa bằng `radial-gradient` mask bên trong `.hero-banner`.
4. **Polarity-flipped Band**: Chuyển khối *Quy trình Xác thực Độc lập (3 bước)* trên `PublicHomeView` thành dải đảo cực (`#09090b` ở Light Mode; nổi khối `#18181b` + viền sáng `#3f3f46` ở Dark Mode).
5. **Đồng bộ tài liệu thiết kế**: Cập nhật `project/apps/web/DESIGN.md`, `scripts/validate-web.mjs` và `harness/context/current-state.md`.

## Phạm vi cho phép
- `project/apps/web/`
- `harness/context/current-state.md`

## Tiêu chí hoàn thành
- `AC-1`: `.site-header` và `.workspace-topbar` có hiệu ứng Frosted Glass (`backdrop-filter: blur(12px)`) với biến `--bg-header-glass` và fallback nền đặc an toàn ở cả Light/Dark Mode.
- `AC-2`: Hệ thống Stacked Shadow và lớp lưới Architectural Micro-grid có radial mask bên trong `.hero-banner` hoạt động sắc nét, không che tương tác người dùng.
- `AC-3`: Khối *Quy trình Xác thực Độc lập (3 bước)* dùng `.polarity-band` hiển thị đúng `#09090b` ở Light Mode và `#18181b` + viền `#3f3f46` ở Dark Mode; các pill trạng thái, inline code và nút bấm giữ độ tương phản tốt trên cả hai theme.
- `AC-4`: `project/apps/web/DESIGN.md` được cập nhật đồng bộ; `npm.cmd run build`, `node --check scripts/validate-web.mjs`, `node scripts/validate-web.mjs` và `git diff --check` đều PASS.
