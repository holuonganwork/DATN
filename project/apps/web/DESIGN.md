# DESIGN.md — CertChain Academic Azure Design System
> Inspired by [`VoltAgent/awesome-design-md`](https://github.com/VoltAgent/awesome-design-md) (Academic Azure · Bright Marine 1D Specification)

## 1. Brand Identity & Visual Direction
- **Brand Mark**: Isometric Triple-Arch Monolith (`/logo.png`). Three nested isometric arches with crisp white top/left planes and solid black inner/right shadow planes, framed inside `.brand-logo-frame`.
- **Aesthetic Philosophy**: **Academic Azure & Cryptographic Precision (1D — Bright Marine Azure)**.
  - Educational trust and readability: cool ice-slate surfaces (`#F8FAFC` / `#FFFFFF`) paired with Bright Marine Azure (`#0284C7` / `#075985`) in Light Mode; Deep Ocean Night (`#06131F` / `#0C2236`) with luminous Azure highlights (`#38BDF8`) in Dark Mode.
  - Deep Marine Navy Internal Sidebar (`#082F49` Light / `#081C2E` Dark) to clearly separate governance navigation from data workspaces.
  - Frosted glass sticky navigation headers (`backdrop-filter: blur(12px)`), subtle Azure Hero micro-grid (`28px × 28px`), and double-hairline Azure frame on `.certificate-sheet`.
  - Semantic verification colors remain strictly reserved for cryptographic verification states (`VALID`, `REVOKED`, `INDETERMINATE`, `PENDING_CHAIN`) so they never clash with the Ocean Blue brand palette.

## 2. Color Tokens (Light & Dark Mode)

| Token | Light Mode (Default) | Dark Mode (`[data-theme="dark"]`) | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#F8FAFC` | `#06131F` | Main page background |
| `--bg-surface` | `#FFFFFF` | `#0C2236` | Card, table, header, footer, modal surface |
| `--bg-subtle` | `#F1F5F9` | `#12304B` | Secondary blocks, code cells, hover states |
| `--bg-elevated` | `#FFFFFF` | `#163A5A` | Floating cards, toast surfaces |
| `--bg-header-glass` | `rgba(255, 255, 255, 0.92)` | `rgba(12, 34, 54, 0.9)` | Frosted sticky header & console topbar |
| `--bg-inverse` | `#0284C7` | `#0284C7` | Primary buttons, active nav pills |
| `--bg-inverse-hover` | `#0369A1` | `#0EA5E9` | Primary button hover state |
| `--brand-deep` | `#075985` | `#7DD3FC` | Top `.system-bar`, KPI numerals, certificate recipient |
| `--brand-tint` | `#E0F2FE` | `rgba(14, 165, 233, 0.16)` | Hero protocol badge, soft marine highlights |
| `--brand-tint-border` | `#7DD3FC` | `rgba(56, 189, 248, 0.38)` | Hero border, certificate inner hairline |
| `--brand-sidebar-bg` | `#082F49` | `#081C2E` | Fixed Console Sidebar background |
| `--text-primary` | `#0F172A` | `#F8FAFC` | Headings, primary data, active navigation |
| `--text-secondary` | `#475569` | `#94A3B8` | Body copy, descriptions, table labels |
| `--text-muted` | `#64748B` | `#7B93B0` | Eyebrows, captions, timestamps, hashes |
| `--text-inverse` | `#FFFFFF` | `#FFFFFF` | Text inside primary Azure buttons |
| `--border` | `#E2E8F0` | `#164266` | Standard 1px structural dividers |
| `--border-strong` | `#0284C7` | `#38BDF8` | Active focus rings & certificate sheet outer border |
| `--status-info-bg` | `#E0F2FE` | `rgba(14, 165, 233, 0.16)` | Technical / process info badges |
| `--status-info-fg` | `#0369A1` | `#38BDF8` | Technical / process info text |
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
