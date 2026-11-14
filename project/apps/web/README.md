# CertChain Web Application (`project/apps/web`)

Ứng dụng web sản phẩm hoàn chỉnh cho đồ án: **Hệ thống phát hành và xác thực chứng chỉ đào tạo tích hợp Blockchain**.

## 1. Hệ thống thiết kế (`DESIGN.md`) & Nhận diện Thương hiệu
- **Logo thương hiệu**: Đặt tại `public/logo.png` (khối hình học isometric 3 cổng vòm Đen-Trắng), được tích hợp làm favicon, thanh Header, Sidebar, màn hình Đăng nhập và con dấu trên phôi chứng chỉ.
- **Chuẩn thiết kế**: Tuân thủ `DESIGN.md` theo phong cách **Vercel / Geist Architectural Monochrome** từ `VoltAgent/awesome-design-md`, hỗ trợ chuyển đổi **Light / Dark Mode**.

## 2. Kiến trúc Giao diện 3 Chế độ (Dual-Surface + Role Gate)
1. **Website Công khai (`Public Website`)**:
   - **Top System Bar**: Trạng thái kết nối EVM RPC (`Chain ID 31337`), địa chỉ hợp đồng `CertificateRegistry`.
   - **Sticky Header & Navigation Bar tiêu chuẩn**:
     - `Trang chủ` (`PublicHomeView`): Hero tra cứu chứng chỉ tức thì, 4 thẻ chỉ số mạng lưới, quy trình xác thực 3 bước và bảng chứng chỉ mới phát hành.
     - `Xác thực Chứng chỉ` (`PublicVerifierView` — `UC-09`): Tra cứu theo mã, tải gói `.json`, kiểm định file `.pdf` bằng SHA-256, `Payload & File Inspector` và báo cáo mật mã 7 bước.
     - `Danh bạ Đơn vị Đào tạo` (`PublicDirectoryView`): Tra cứu các tổ chức đào tạo, trạng thái cấp phép và địa chỉ ví EVM đang hoạt động.
     - `Chuẩn Kỹ thuật & Mật mã` (`PublicStandardsView`): Tài liệu kiến trúc 3 lớp (`RFC 8785 JCS`, `Domain-Separated Merkle Tree`, `EVM Registry`).
   - **Standard 4-Column Website Footer**: Thông tin thương hiệu, liên kết điều hướng, chuẩn mật mã và thông số mạng EVM.
2. **Cổng Đăng nhập & Chọn Vai trò (`RoleSwitcherGateView`)**:
   - Cho phép chọn Đơn vị Đào tạo và Vai trò vận hành (`Chuyên viên Phát hành`, `Người Duyệt & Ký số`, `Quản trị Hệ thống`) trước khi vào Bảng điều khiển.
3. **Bảng điều khiển Nội bộ (`Internal Console` — Sidebar App Shell)**:
   - **Sidebar cố định bên trái**: Logo thương hiệu, thông tin phiên đăng nhập, bộ chọn Đơn vị đào tạo, 2 nhóm điều hướng (`Vận hành Đơn vị` & `Quản trị & Kiểm toán`), trạng thái mạng EVM và nút quay về Website Công khai.
   - **Workspace bên phải**: `Tổng quan Đơn vị`, `Lô phát hành (Batches)` với đường ống 6 bước (`DRAFT` → `CONFIRMED`), `Sổ Chứng chỉ`, `Khóa học & Học viên`, `Tổ chức & Ví EVM (Admin)` và `Nhật ký Kiểm toán (Audit Trail)`.

## 3. Lệnh chạy & Kiểm tra

```bash
npm.cmd run dev
npm.cmd run build
npm.cmd run validate
```
