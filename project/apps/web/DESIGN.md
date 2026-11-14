# DESIGN.md — CertChain Architectural Design System
> Inspired by [`VoltAgent/awesome-design-md`](https://github.com/VoltAgent/awesome-design-md) (Vercel / Geist & Linear Precision Specification)

## 1. Brand Identity & Visual Direction
- **Brand Mark**: Isometric Triple-Arch Monolith (`/logo.png`). Three nested isometric arches with crisp white top/left planes and solid black inner/right shadow planes.
- **Aesthetic Philosophy**: **Architectural Monochrome & Cryptographic Precision**.
  - High-contrast black and white surfaces (`#09090B` on `#FFFFFF` in Light Mode; `#FAFAFA` on `#09090B` in Dark Mode).
  - Structural `1px` hairline grid borders (`--border`) instead of heavy drop shadows or muddy gradients.
  - Semantic color is reserved strictly for cryptographic verification states (`VALID`, `REVOKED`, `INDETERMINATE`, `PENDING_CHAIN`).

## 2. Color Tokens (Light & Dark Mode)

| Token | Light Mode (Default) | Dark Mode (`[data-theme="dark"]`) | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#FAFAFA` | `#09090B` | Main page background |
| `--bg-surface` | `#FFFFFF` | `#121215` | Card, table, header, sidebar, footer surface |
| `--bg-subtle` | `#F4F4F5` | `#18181B` | Secondary blocks, code cells, hover states |
| `--bg-inverse` | `#09090B` | `#FAFAFA` | Primary buttons, active pill indicators |
| `--text-primary` | `#09090B` | `#FAFAFA` | Headings, primary data, active navigation |
| `--text-secondary` | `#52525B` | `#A1A1AA` | Body copy, descriptions, table labels |
| `--text-muted` | `#71717A` | `#71717A` | Eyebrows, captions, timestamps, hashes |
| `--text-inverse` | `#FFFFFF` | `#09090B` | Text inside primary buttons |
| `--border` | `#E4E4E7` | `#27272A` | Standard 1px structural dividers |
| `--border-strong` | `#09090B` | `#FAFAFA` | Active focus rings & featured borders |
| `--status-valid-bg` | `#ECFDF5` | `rgba(16, 185, 129, 0.14)` | Verified / Active / Confirmed background |
| `--status-valid-fg` | `#047857` | `#34D399` | Verified / Active / Confirmed text |
| `--status-warn-bg` | `#FFFBEB` | `rgba(245, 158, 11, 0.14)` | Pending / Draft / Indeterminate background |
| `--status-warn-fg` | `#B45309` | `#FBBF24` | Pending / Draft / Indeterminate text |
| `--status-danger-bg` | `#FEF2F2` | `rgba(239, 68, 68, 0.14)` | Revoked / Invalid / Tampered background |
| `--status-danger-fg` | `#B91C1C` | `#F87171` | Revoked / Invalid / Tampered text |

## 3. Typography Scale
- **Primary Sans (`--font-sans`)**: `'Inter'`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, sans-serif.
  - Display Hero: `clamp(1.85rem, 3vw, 2.65rem)`, weight `700`, tracking `-0.035em`, line-height `1.12`.
  - Page Title (`H1`): `1.5rem`, weight `600`, tracking `-0.025em`.
  - Section Heading (`H2`): `1.125rem`, weight `600`, tracking `-0.02em`.
  - Body Standard: `0.9rem`, weight `400`, line-height `1.55`.
- **Cryptographic Mono (`--font-mono`)**: `'JetBrains Mono'`, `'SFMono-Regular'`, `Consolas`, monospace.
  - Used for all SHA-256 digests (`0x...`), Merkle roots, Ethereum wallet addresses, Chain IDs, and JSON payloads.

## 4. Dual-Mode Product Architecture (Public Website vs. Internal Console)

### Mode A: Public Website (`surfaceMode = "public"`)
1. **Top System Status Bar (`.system-bar`)**:
   - Displays live EVM Chain ID (`31337`), `CertificateRegistry` contract address, and protocol status.
2. **Sticky Website Header & Navigation Bar (`<header class="site-header">`)**:
   - **Brand Identity**: `/logo.png` inside `.brand-logo-frame` + title `CertChain` & subtitle `BLOCKCHAIN CREDENTIAL REGISTRY`.
   - **Primary Public Navigation (`<nav class="site-nav">`)**:
     - `Trang chủ` (`home`)
     - `Xác thực Chứng chỉ` (`verifier`)
     - `Danh bạ Đơn vị Đào tạo` (`directory`)
     - `Chuẩn Kỹ thuật & Mật mã` (`standards`)
   - **Header Actions**: Quick certificate lookup input, Light/Dark mode toggle button, and primary CTA `"Cổng Quản lý / Đăng nhập →"`.
3. **Standard 4-Column Website Footer (`<footer class="site-footer">`)**:
   - Column 1: Brand mark (`/logo.png`), mission statement, and protocol version.
   - Column 2: Public Website Sitemap links.
   - Column 3: Cryptographic & Technical Standards (`RFC 8785 JCS`, `SHA-256`, `Merkle Proof`, `EIP-155`).
   - Column 4: Network & Smart Contract metadata + sample data reset utility.

### Mode B: Role Switcher / Portal Login Gate (`surfaceMode = "auth-gate"`)
- Triggered when clicking **"Cổng Quản lý / Đăng nhập →"** from the Public Website or **"Đổi vai trò"** inside the Console.
- Displays a centered architectural authentication card allowing the operator to select:
  1. **Đơn vị Đào tạo (Organization)** (`BKDTT`, `VBCA`, etc.).
  2. **Vai trò vận hành (Role Cards)**:
     - `Chuyên viên Phát hành (ISSUER_OPERATOR)`
     - `Người Duyệt & Ký số (ISSUER_APPROVER)`
     - `Quản trị Hệ thống (SYSTEM_ADMIN)`

### Mode C: Internal Management Console (`surfaceMode = "console"`)
1. **Fixed Left Sidebar (`<aside class="app-sidebar">`)**:
   - Top brand header (`/logo.png` + `CertChain Console`).
   - Active Session Card (current Role badge, active Organization switcher, `"Đổi vai trò"` action).
   - **Vận hành Đơn vị (Issuer Workspace)**:
     - `Tổng quan Đơn vị` (`overview`)
     - `Lô phát hành (Batches)` (`batches`)
     - `Sổ Chứng chỉ (Credentials)` (`credentials`)
     - `Khóa học & Học viên` (`catalog`)
   - **Quản trị & Kiểm toán (Governance)**:
     - `Tổ chức & Ví EVM (Admin)` (`admin`)
     - `Nhật ký Kiểm toán (Audit Trail)` (`events`)
   - Bottom Sidebar Footer: Active EVM wallet status + `"← Về Website Công khai"` button.
2. **Main Console Workspace (`<div class="app-workspace">`)**:
   - **Top Workspace Header (`.workspace-topbar`)**: Breadcrumb, quick certificate search, sample data reset, Light/Dark toggle, and `"Mở Cổng Xác thực Công khai"` shortcut.
   - **Semantic Data Tables (`<table class="data-table">`)** & **6-Step Merkle Batch Pipeline**.
