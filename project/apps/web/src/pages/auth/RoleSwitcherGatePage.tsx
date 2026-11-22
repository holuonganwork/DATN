import type { FormEvent } from "react";
import { BrandLogo } from "../../components/ui/BrandLogo";
import {
  organizationStatusLabels,
  roleDescriptions,
  roleLabels,
  type AppState,
  type UserRole,
} from "../../domain";

interface RoleSwitcherGateViewProps {
  state: AppState;
  selectedRole: UserRole;
  selectedOrgId: string;
  onSelectRole: (role: UserRole) => void;
  onSelectOrgId: (orgId: string) => void;
  onContinue: (role: UserRole, orgId?: string) => void;
  onBackToPublic: () => void;
}

export function RoleSwitcherGateView({
  state,
  selectedRole,
  selectedOrgId,
  onSelectRole,
  onSelectOrgId,
  onContinue,
  onBackToPublic,
}: RoleSwitcherGateViewProps) {
  const roles: UserRole[] = ["ISSUER_APPROVER", "ISSUER_OPERATOR", "SYSTEM_ADMIN"];

  const currentOrg =
    state.organizations.find((o) => o.id === selectedOrgId) ?? state.organizations[0] ?? null;
  const currentWallet = currentOrg
    ? state.wallets.find(
        (w) => w.organizationId === currentOrg.id && w.status === "AUTHORIZED",
      )
    : undefined;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onContinue(selectedRole, currentOrg?.id);
  }

  return (
    <div className="auth-gate-screen">
      <header className="auth-gate-topbar">
        <div className="site-container auth-gate-topbar-inner">
          <button type="button" className="brand-home-link" onClick={onBackToPublic}>
            <BrandLogo size={36} />
            <div className="brand-title-box">
              <div className="brand-title-row">
                <span className="brand-name">CertChain</span>
                <span className="brand-version-pill">ACCESS GATE</span>
              </div>
              <span className="brand-subtitle">CỔNG ĐĂNG NHẬP & CHỌN VAI TRÒ VẬN HÀNH</span>
            </div>
          </button>

          <div className="button-row">
            <button type="button" className="btn-secondary btn-sm" onClick={onBackToPublic}>
              ← Quay lại Website Công khai
            </button>
          </div>
        </div>
      </header>

      <main className="auth-gate-main">
        <form className="auth-gate-card" onSubmit={handleSubmit}>
          <div className="auth-gate-head">
            <BrandLogo size={48} />
            <div>
              <span className="eyebrow">XÁC THỰC PHIÊN LÀM VIỆC NỘI BỘ</span>
              <h1>Chọn Tài khoản & Vai trò truy cập Bảng điều khiển</h1>
              <p>
                Chọn vai trò nghiệp vụ và đơn vị đào tạo để mở không gian làm việc có Sidebar điều
                hướng tương ứng.
              </p>
            </div>
          </div>

          <div className="auth-section">
            <span className="auth-step-label">1. Chọn Vai trò vận hành (Role)</span>
            <div className="role-cards-grid">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={selectedRole === r ? "role-select-card active" : "role-select-card"}
                  onClick={() => onSelectRole(r)}
                >
                  <div className="role-card-top">
                    <strong>{roleLabels[r]}</strong>
                    <span className="role-code-tag">{r}</span>
                  </div>
                  <p>{roleDescriptions[r]}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="auth-section">
            <span className="auth-step-label">2. Chọn Đơn vị Đào tạo làm việc (Organization)</span>
            {state.organizations.length === 0 ? (
              <div className="auth-wallet-preview">
                <span>Trạng thái Tổ chức Đào tạo</span>
                <strong>Chưa có đơn vị đào tạo nào được đăng ký trong hệ thống</strong>
                <small>
                  Khi tiếp tục, bạn sẽ được đưa tới trang Quản trị Hệ thống (UC-01) để khởi tạo tổ
                  chức đào tạo đầu tiên.
                </small>
              </div>
            ) : (
              <div className="form-grid-2">
                <label className="form-field">
                  <span>Đơn vị Đào tạo</span>
                  <select
                    value={currentOrg?.id ?? ""}
                    onChange={(event) => onSelectOrgId(event.target.value)}
                  >
                    {state.organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.code} — {org.displayName} ({organizationStatusLabels[org.status]})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="auth-wallet-preview">
                  <span>Ví EVM đang ủy quyền của đơn vị</span>
                  <code>
                    {currentWallet ? currentWallet.address : "Đơn vị chưa có ví EVM AUTHORIZED"}
                  </code>
                  <small>
                    {currentWallet
                      ? `Chain ID ${currentWallet.chainId} · Ký giao dịch trực tiếp qua EIP-1193`
                      : "Cần Quản trị Hệ thống cấp phép ví trước khi ký lô"}
                  </small>
                </div>
              </div>
            )}
          </div>

          <div className="auth-gate-actions">
            <button type="button" className="btn-secondary" onClick={onBackToPublic}>
              ← Hủy & Về Website Công khai
            </button>
            <button type="submit" className="btn-primary">
              Tiếp tục vào Bảng điều khiển ({roleLabels[selectedRole]}) →
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
