# T-031: Refactor cấu trúc mã nguồn `project/apps/web/src` sang kiến trúc modular

## Mục tiêu
Tái cấu trúc mã nguồn Frontend tại `project/apps/web/src/` từ 5 file monolith (`App.tsx`, `domain.ts`, `storage.ts`, `styles.css`, `main.tsx`) sang cấu trúc thư mục rõ ràng gồm `domain/`, `services/`, `components/`, `pages/`, `features/`, `styles/`, giữ nguyên 100% hành vi nghiệp vụ, giao diện Academic Azure Light-Only và dữ liệu `localStorage`.

## Yêu cầu đã chốt (GRILL)
1. **Phạm vi Pure Refactor**: Giữ nguyên 100% hành vi, UI và khóa lưu trữ `certchain.product.state.v2`; không cài thêm dependency mới vào `package.json`, không cài router hay nối HTTP API trong task này.
2. **Chiến lược CSS**: Tách `src/styles.css` (2.734 dòng) thành các file CSS thuần theo phân hệ trong `src/styles/` và import đúng thứ tự cascade gốc tại `src/styles/index.css`.
3. **Mức độ chia nhỏ**: Tách sâu vừa đủ — chia `domain/` theo từng nhóm nghiệp vụ (DAG 1 chiều), chia `services/`, chia `IssuerPortal` thành shell + 3 tab con (`Batches`, `Credentials`, `Catalog`), tách 4 modal dùng chung, tách layout và các page.
4. **Dọn file monolith cũ & đồng bộ kiểm tra**: Xóa `src/domain.ts`, `src/storage.ts`, `src/styles.css`; cập nhật `scripts/validate-web.mjs` quét đệ quy `src/`, cập nhật `README.md` và `harness/context/current-state.md`.

## Phạm vi cho phép
- `project/apps/web/`
- `harness/context/current-state.md`

## Tiêu chí hoàn thành
- `AC-1`: Toàn bộ mã nguồn trong `project/apps/web/src/` được tổ chức rõ ràng vào 6 thư mục (`domain/`, `services/`, `components/`, `pages/`, `features/`, `styles/`) kèm `src/main.tsx` và `src/App.tsx` gọn nhẹ; 3 file monolith cũ (`src/domain.ts`, `src/storage.ts`, `src/styles.css`) đã được xóa sạch.
- `AC-2`: Giữ nguyên 100% logic nghiệp vụ (UC-01..UC-09, JCS/Merkle/Verifier, `STORAGE_KEY = "certchain.product.state.v2"`), tên các View/Portal chính, thứ tự cascade CSS và không thêm dependency mới vào `package.json`.
- `AC-3`: `project/apps/web/scripts/validate-web.mjs` được nâng cấp quét đệ quy toàn bộ `src/` (TS/TSX và CSS), kiểm tra đầy đủ cấu trúc thư mục mới và mọi marker/forbidden rule; `project/apps/web/README.md` và `harness/context/current-state.md` được đồng bộ.
- `AC-4`: `npm.cmd run build`, `node --check scripts/validate-web.mjs`, `node scripts/validate-web.mjs`, `git diff --check` và `node harness/runner/harness.mjs doctor` đều PASS, không có static quality finding.
