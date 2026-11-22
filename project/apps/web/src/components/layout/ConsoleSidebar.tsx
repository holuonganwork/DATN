import {
  roleLabels,
  type ConsolePage,
  type IssuerWallet,
  type Organization,
  type TrustedChain,
  type UserRole,
} from "../../domain";
import { shortHash } from "../../services";
import { BrandLogo } from "../ui/BrandLogo";

interface ConsoleSidebarProps {
  consolePage: ConsolePage;
  role: UserRole;
  organizations: Organization[];
  selectedOrg: Organization | null;
  activeOrgWallet: IssuerWallet | undefined;
  orgBatchesCount: number;
  orgCredentialsCount: number;
  catalogCount: number;
  eventsCount: number;
  primaryChain: TrustedChain;
  onSelectConsolePage: (page: ConsolePage) => void;
  onSelectOrganization: (orgId: string) => void;
  onSwitchRole: () => void;
  onBackToPublic: () => void;
}

export function ConsoleSidebar({
  consolePage,
  role,
  organizations,
  selectedOrg,
  activeOrgWallet,
  orgBatchesCount,
  orgCredentialsCount,
  catalogCount,
  eventsCount,
  primaryChain,
  onSelectConsolePage,
  onSelectOrganization,
  onSwitchRole,
  onBackToPublic,
}: ConsoleSidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="Điều hướng Bảng điều khiển Nội bộ">
      <div className="sidebar-brand">
        <button
          type="button"
          className="brand-home-link"
          onClick={() => onSelectConsolePage("overview")}
        >
          <BrandLogo size={36} />
          <div className="brand-title-box">
            <div className="brand-title-row">
              <span className="brand-name">CertChain</span>
              <span className="brand-version-pill">CONSOLE</span>
            </div>
            <span className="brand-subtitle">CỔNG QUẢN LÝ & PHÁT HÀNH</span>
          </div>
        </button>
      </div>

      <div className="sidebar-session-card">
        <div className="session-role-row">
          <span className="eyebrow">PHIÊN ĐĂNG NHẬP HIỆN TẠI</span>
          <button type="button" className="session-switch-btn" onClick={onSwitchRole}>
            Đổi vai trò ⇄
          </button>
        </div>
        <strong className="session-role-name">{roleLabels[role]}</strong>

        <label className="sidebar-org-field">
          <span>Đơn vị Đào tạo làm việc</span>
          {organizations.length > 0 ? (
            <select
              value={selectedOrg?.id ?? ""}
              onChange={(event) => onSelectOrganization(event.target.value)}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.code} — {org.displayName}
                </option>
              ))}
            </select>
          ) : (
            <div className="cell-sub">Chưa có tổ chức đào tạo nào</div>
          )}
        </label>

        <div className="session-wallet-strip">
          <span>Ví EVM đơn vị:</span>
          <code>
            {activeOrgWallet ? shortHash(activeOrgWallet.address, 8, 6) : "Chưa cấp ví active"}
          </code>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-group">
          <span className="sidebar-group-label">VẬN HÀNH ĐƠN VỊ (ISSUER)</span>
          <button
            type="button"
            className={consolePage === "overview" ? "sidebar-link active" : "sidebar-link"}
            onClick={() => onSelectConsolePage("overview")}
          >
            <span>Tổng quan Đơn vị</span>
          </button>
          <button
            type="button"
            className={consolePage === "batches" ? "sidebar-link active" : "sidebar-link"}
            onClick={() => onSelectConsolePage("batches")}
          >
            <span>Lô phát hành (Batches)</span>
            <span className="nav-counter">{orgBatchesCount}</span>
          </button>
          <button
            type="button"
            className={consolePage === "credentials" ? "sidebar-link active" : "sidebar-link"}
            onClick={() => onSelectConsolePage("credentials")}
          >
            <span>Sổ Chứng chỉ (Credentials)</span>
            <span className="nav-counter">{orgCredentialsCount}</span>
          </button>
          <button
            type="button"
            className={consolePage === "catalog" ? "sidebar-link active" : "sidebar-link"}
            onClick={() => onSelectConsolePage("catalog")}
          >
            <span>Khóa học & Học viên</span>
            <span className="nav-counter">{catalogCount}</span>
          </button>
        </div>

        <div className="sidebar-nav-group">
          <span className="sidebar-group-label">QUẢN TRỊ & KIỂM TOÁN</span>
          <button
            type="button"
            className={consolePage === "admin" ? "sidebar-link active" : "sidebar-link"}
            onClick={() => onSelectConsolePage("admin")}
          >
            <span>Tổ chức & Ví EVM (Admin)</span>
            <span className="nav-counter">{organizations.length}</span>
          </button>
          <button
            type="button"
            className={consolePage === "events" ? "sidebar-link active" : "sidebar-link"}
            onClick={() => onSelectConsolePage("events")}
          >
            <span>Nhật ký Kiểm toán (Audit Trail)</span>
            <span className="nav-counter">{eventsCount}</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-network-box">
          <span className="live-indicator">
            <span className="live-dot" />
            Chain ID {primaryChain.chainId}
          </span>
          <code>Registry: {shortHash(primaryChain.registryAddress, 8, 6)}</code>
        </div>

        <button type="button" className="btn-secondary full-width" onClick={onBackToPublic}>
          ← Về Website Công khai
        </button>
      </div>
    </aside>
  );
}
