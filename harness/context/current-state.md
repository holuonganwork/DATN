# Trạng thái hiện tại

## Tổ chức tài liệu

- Các task triển khai sản phẩm còn lại nằm trong `harness/tasks/inbox/` và bản JSON máy đọc được nằm trong `harness/tasks/ready/`; `T-001` và `T-002` đã hoàn tất trong `harness/tasks/done/`.
- `T-012` quản lý việc vận hành harness và đã hoàn tất trong `harness/tasks/done/`.
- `T-013` bổ sung quality profile, clean-code scan, validation/evidence gate và prompt quality loop; đã hoàn tất trong `harness/tasks/ready/` với evidence tại `harness/evidence/`.
- `T-014` cập nhật workflow bắt buộc `GRILL → PLAN → GOAL → EXECUTE → VALIDATE → FINALIZE` trong `AGENTS.md`; đã hoàn tất với evidence tại `harness/evidence/`.
- `T-001` đã chốt use case MVP và các quyết định ranh giới: chia sẻ link có hạn để sau MVP, một ví issuer hoạt động cho mỗi tổ chức.
- `T-002` đã chốt modular monolith, BlockchainGateway/mock, ERD logic, state machine, API contract, idempotency và phân tách on-chain/off-chain trong `project/docs/`.
- `T-015` đã tạo ứng dụng React/TypeScript tại `project/apps/web/` (đổi tên theo T-016); run T-015 còn `needs_review` cho walkthrough UI. T-017 đã xác minh build và dev/CSS sau khi dependency được cài.
- `T-016` chuyển ứng dụng sang `project/apps/web/`, cập nhật tên package và hướng dẫn/lệnh kiểm tra; giữ nguyên giao diện và logic hiện tại.
- `T-017` sửa `project/package.json` trống thành manifest hợp lệ để Vite/PostCSS tìm cấu hình qua thư mục cha; TypeScript, production build và dev HTTP/CSS đã đạt.
- `T-018` nâng cấp `project/apps/web/` từ màn hình prototype thành giao diện sản phẩm hoàn chỉnh theo MVP (3 phân khu: Public Verifier có Payload/File Inspector, Issuer Portal quản lý batch/credential/khóa học/học viên/thu hồi/cấp lại, System Admin quản lý tổ chức/ví ủy quyền, cùng Audit trail và lưu trữ bền vững qua `localStorage`).
- `T-019` thiết lập `project/apps/web/DESIGN.md` theo chuẩn `VoltAgent/awesome-design-md` (Vercel / Geist Architectural), tích hợp logo thương hiệu tại `public/logo.png` và tổ chức lại giao diện thành 2 phân hệ rõ ràng: (1) Website Công khai tiêu chuẩn có Header, 4 trang Navigation Bar (`Trang chủ`, `Xác thực Chứng chỉ`, `Danh bạ Đơn vị Đào tạo`, `Chuẩn Kỹ thuật & Mật mã`), Footer 4 cột và (2) Cổng Quản lý Nội bộ có màn hình Đăng nhập chọn vai trò (`Role Switcher Gate`) và Bảng điều khiển App Shell có Sidebar cố định bên trái, hỗ trợ Light/Dark mode.
- `T-020` cập nhật đồng bộ `.gitignore` gốc, `project/.gitignore` và `project/apps/web/.gitignore` để loại bỏ `node_modules/`, build artifacts (`dist/`, `cache/`, `artifacts/`), môi trường `.venv`, công cụ ngoài ở thư mục gốc (`/package.json`, `/package-lock.json`, `/harness`) và bảo vệ các file `.env`/khóa bí mật.
- `T-021` dọn dẹp toàn bộ dữ liệu khởi tạo mẫu (`organizations`, `wallets`, `courses`, `learners`, `batches`, `credentials`, `events`), các nút bấm giả lập kịch bản, các trường thừa `syncLegacyMirrors` (`issuer`, `batch`), giá trị điền sẵn trong state của form và các fallback số liệu ảo trong `project/apps/web` để số liệu khởi tạo bằng `0` và sẵn sàng kết nối Backend.
- `T-022` nâng cấp chiều sâu thị giác (Depth & Polish) cho `project/apps/web` trong khi giữ bản sắc Architectural Monochrome: Frosted Glass (`backdrop-filter: blur(12px)`) cho `.site-header` và `.workspace-topbar`, Stacked Shadow nhiều lớp (`--shadow-card`, `--shadow-card-elevated`, `--shadow-card-hover`), lớp lưới vuông Architectural Micro-grid (`28px × 28px`, mờ dần ra viền) trong `.hero-banner`, Polarity-flipped Band (`.polarity-band`) cho khối *Quy trình Xác thực Độc lập (3 bước)* (`#09090b` ở Light Mode, `#18181b` + viền `#3f3f46` ở Dark Mode), và đồng bộ `project/apps/web/DESIGN.md`.
- `T-023` xây dựng Backend nghiệp vụ off-chain thực tại `project/apps/api` (NestJS, Prisma, PostgreSQL 16 via `project/infra/docker-compose.yml` port `5433`, migration `20261114102932_init`, Swagger `/docs`), hoàn thiện `credential-core` (Unicode NFC + JCS RFC 8785 + `keccak256` + `@openzeppelin/merkle-tree`), tách lớp phát hành qua `IssuancePort` (`OffChainIssuanceAdapter`) và xác thực tự động bằng unit tests + Supertest E2E trên `certchain_test`. Chế độ blockchain/EVM RPC sẽ tích hợp tiếp qua adapter ở `T-005`; tài liệu quyết định nằm tại `project/docs/decisions/0004-offchain-first-backend.md`.
- `T-024` chuyển thông báo trạng thái `.notice-banner` trong `project/apps/web` từ hiển thị inline gây xô đẩy bố cục thành Floating Toast Pop-up dùng chung ở góc trên bên phải (`.toast-popup-viewport`, `.toast-popup-card`, `z-index: 120`), tự động đóng sau 4 giây với thanh tiến trình đếm ngược, tạm dừng timer và animation khi hover chuột, và giữ nguyên nút `Đóng ✕`.
- Yêu cầu sản phẩm nằm trong `project/docs/requirements.md`.
- Kiến thức nền và quyết định dùng chung nằm trong `harness/context/`.

## Tiến độ triển khai

- Backend off-chain (`T-023`) đã hoàn thành, build và vượt qua toàn bộ quality gate (`format:check`, `lint`, `typecheck`, unit tests, E2E tests với PostgreSQL `certchain_test`, `build`).
- Các task tích hợp blockchain/on-chain (`T-003`, `T-004`, `T-005`...) và kết nối Frontend `project/apps/web` với `project/apps/api` vẫn ở trạng thái tiếp theo, chưa triển khai smart contract hoặc EVM RPC.
- Harness runtime đã có runner, event schema, task validator và test tự động; T-012, T-013, T-014 và T-023 đã được triển khai kiểm soát.
- Backend `project/apps/api` đã cài đặt Prettier/ESLint/TypeScript strict và Prisma migrations; `project/apps/web` đã sạch dữ liệu mẫu (`T-021`), sẵn sàng kết nối API ở task tiếp theo.
- `project/apps/web` hiện chạy độc lập và chưa nối HTTP tới `project/apps/api`; kết nối tích hợp hai đầu và walkthrough UI đầy đủ sẽ thực hiện ở task kết nối Frontend-Backend.
- Cập nhật file này khi thay đổi trạng thái task hoặc khi có bằng chứng mới.
