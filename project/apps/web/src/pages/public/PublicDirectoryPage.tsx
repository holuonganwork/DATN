import { useMemo, useState } from "react";
import { organizationStatusLabels, type AppState, type Credential } from "../../domain";

interface PublicDirectoryViewProps {
  state: AppState;
  onSelectCredential: (cred: Credential) => void;
  onOpenAuthGateForOrg: (orgId: string) => void;
}

export function PublicDirectoryView({
  state,
  onSelectCredential,
  onOpenAuthGateForOrg,
}: PublicDirectoryViewProps) {
  const [searchOrg, setSearchOrg] = useState<string>("");

  const filteredOrgs = useMemo(() => {
    return state.organizations.filter((org) => {
      if (!searchOrg.trim()) return true;
      const q = searchOrg.trim().toLowerCase();
      return (
        org.displayName.toLowerCase().includes(q) ||
        org.legalName.toLowerCase().includes(q) ||
        org.code.toLowerCase().includes(q) ||
        org.verificationRef.toLowerCase().includes(q)
      );
    });
  }, [state.organizations, searchOrg]);

  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">DANH BẠ ĐƠN VỊ ĐÀO TẠO CÔNG KHAI</span>
          <h1>Các Tổ chức Đào tạo & Địa chỉ Ví EVM trong mạng lưới</h1>
        </div>
        <div className="filter-bar">
          <input
            type="text"
            value={searchOrg}
            onChange={(event) => setSearchOrg(event.target.value)}
            placeholder="Tìm tên trường, mã đơn vị hoặc mã hồ sơ..."
          />
        </div>
      </div>

      {filteredOrgs.length === 0 ? (
        <div className="panel-card">
          <span className="eyebrow">DANH BẠ ĐANG TRỐNG</span>
          <h2>Chưa có đơn vị đào tạo nào được đăng ký</h2>
          <p className="panel-desc">
            Danh bạ công khai sẽ tự động cập nhật khi Quản trị viên Hệ thống đăng ký và phê duyệt
            các tổ chức đào tạo trong Cổng Quản lý.
          </p>
        </div>
      ) : (
        <div className="directory-grid">
          {filteredOrgs.map((org) => {
            const activeWallet = state.wallets.find(
              (w) => w.organizationId === org.id && w.status === "AUTHORIZED",
            );
            const orgBatches = state.batches.filter(
              (b) => b.organizationId === org.id && b.status === "CONFIRMED",
            );
            const orgCreds = state.credentials.filter((c) => c.organizationId === org.id);
            const latestCred = orgCreds[0];

            return (
              <article key={org.id} className="panel-card directory-card">
                <div className="directory-card-head">
                  <div className="directory-title-group">
                    <span className="code-badge">{org.code}</span>
                    <div>
                      <h2>{org.displayName}</h2>
                      <span className="cell-sub">
                        Pháp nhân: <strong>{org.legalName}</strong> · Hồ sơ: {org.verificationRef}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`status-pill ${
                      org.status === "ACTIVE"
                        ? "tone-valid"
                        : org.status === "PENDING"
                          ? "tone-warn"
                          : "tone-danger"
                    }`}
                  >
                    {organizationStatusLabels[org.status]}
                  </span>
                </div>

                <div className="kv-list">
                  <div className="kv-row">
                    <span>Địa chỉ Ví EVM đang ủy quyền</span>
                    <code>
                      {activeWallet ? activeWallet.address : "Chưa cấp phép ví AUTHORIZED"}
                    </code>
                  </div>
                  <div className="kv-row">
                    <span>Mạng Blockchain</span>
                    <strong>Chain ID {activeWallet?.chainId ?? 31337}</strong>
                  </div>
                  <div className="kv-row">
                    <span>Số lô Merkle đã neo On-chain</span>
                    <strong>{orgBatches.length} lô phát hành</strong>
                  </div>
                  <div className="kv-row">
                    <span>Tổng số chứng chỉ đã cấp</span>
                    <strong>
                      {orgCreds.filter((c) => c.status === "ISSUED").length} hiệu lực /{" "}
                      {orgCreds.length} tổng số
                    </strong>
                  </div>
                </div>

                <div className="directory-card-foot">
                  {latestCred ? (
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => onSelectCredential(latestCred)}
                    >
                      Kiểm định chứng chỉ ({latestCred.code})
                    </button>
                  ) : (
                    <span className="cell-sub">Đơn vị chưa có chứng chỉ phát hành công khai</span>
                  )}
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => onOpenAuthGateForOrg(org.id)}
                  >
                    Vào Cổng Quản lý Đơn vị →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
