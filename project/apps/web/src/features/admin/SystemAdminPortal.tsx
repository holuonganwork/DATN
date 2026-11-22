import { useState, type FormEvent } from "react";
import {
  authorizeOrganizationWallet,
  organizationStatusLabels,
  registerOrganization,
  updateOrganizationStatus,
  type AppState,
  type NoticeBanner,
  type UserRole,
} from "../../domain";
import { shortHash } from "../../services";

interface SystemAdminPortalProps {
  state: AppState;
  role: UserRole;
  onSwitchRole: () => void;
  onStateChange: (next: AppState, createdOrgId?: string) => void;
  onNotify: (tone: NoticeBanner["tone"], message: string) => void;
}

export function SystemAdminPortal({
  state,
  role,
  onSwitchRole,
  onStateChange,
  onNotify,
}: SystemAdminPortalProps) {
  const [orgCode, setOrgCode] = useState<string>("");
  const [orgLegalName, setOrgLegalName] = useState<string>("");
  const [orgDisplayName, setOrgDisplayName] = useState<string>("");
  const [orgVerificationRef, setOrgVerificationRef] = useState<string>("");

  const [walletOrgId, setWalletOrgId] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");

  function handleRegisterOrg(event: FormEvent) {
    event.preventDefault();
    const res = registerOrganization(state, {
      code: orgCode,
      legalName: orgLegalName,
      displayName: orgDisplayName,
      verificationRef: orgVerificationRef,
    });
    if (res.error) {
      onNotify("danger", res.error);
      return;
    }
    onStateChange(res.state, res.organization?.id);
    setOrgCode("");
    setOrgLegalName("");
    setOrgDisplayName("");
    setOrgVerificationRef("");
    onNotify(
      "success",
      `Đã tiếp nhận hồ sơ tổ chức ${orgDisplayName} (${orgCode}) ở trạng thái chờ thẩm định.`,
    );
  }

  function handleAuthorizeWallet(event: FormEvent) {
    event.preventDefault();
    const targetOrgId = walletOrgId || state.organizations[0]?.id || "";
    const res = authorizeOrganizationWallet(state, {
      organizationId: targetOrgId,
      chainId: 31337,
      address: walletAddress,
    });
    if (res.error) {
      onNotify("danger", res.error);
      return;
    }
    onStateChange(res.state);
    setWalletAddress("");
    onNotify(
      "success",
      "Đã cấp phép địa chỉ ví EVM phát hành (các ví cũ của tổ chức đã tự động chuyển sang REVOKED).",
    );
  }

  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">QUẢN TRỊ HỆ THỐNG & ỦY QUYỀN VÍ EVM (UC-01)</span>
          <h1>Quản lý Đơn vị Đào tạo & Địa chỉ Ví Phát hành On-chain</h1>
        </div>
        {role !== "SYSTEM_ADMIN" && (
          <button type="button" className="btn-secondary" onClick={onSwitchRole}>
            Chuyển sang vai trò Quản trị Hệ thống
          </button>
        )}
      </div>

      <div className="admin-grid">
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DANH BẠ TỔ CHỨC ĐÀO TẠO</span>
              <h2>Trạng thái Pháp nhân & Ví đang ủy quyền</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên tổ chức & Hồ sơ pháp lý</th>
                  <th>Ví EVM đang hoạt động (1 ví duy nhất)</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác quản trị</th>
                </tr>
              </thead>
              <tbody>
                {state.organizations.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state-cell">
                        <strong>Chưa có tổ chức đào tạo nào trong hệ thống.</strong>
                        <span>Hãy điền biểu mẫu bên phải để đăng ký tổ chức đầu tiên.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  state.organizations.map((org) => {
                    const activeWallet = state.wallets.find(
                      (w) => w.organizationId === org.id && w.status === "AUTHORIZED",
                    );
                    return (
                      <tr key={org.id}>
                        <td>
                          <code className="code-strong">{org.code}</code>
                        </td>
                        <td>
                          <strong>{org.displayName}</strong>
                          <div className="cell-sub">
                            {org.legalName} · Hồ sơ: {org.verificationRef}
                          </div>
                        </td>
                        <td>
                          {activeWallet ? (
                            <>
                              <code>{shortHash(activeWallet.address, 10, 8)}</code>
                              <div className="cell-sub">Chain ID {activeWallet.chainId}</div>
                            </>
                          ) : (
                            <span className="cell-sub">Chưa cấp phép ví AUTHORIZED</span>
                          )}
                        </td>
                        <td>
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
                        </td>
                        <td className="text-right">
                          <div className="table-actions">
                            {org.status !== "ACTIVE" && (
                              <button
                                type="button"
                                className="btn-secondary btn-xs"
                                onClick={() => {
                                  const res = updateOrganizationStatus(state, {
                                    organizationId: org.id,
                                    nextStatus: "ACTIVE",
                                  });
                                  if (!res.error) {
                                    onStateChange(res.state);
                                    onNotify("success", `Đã kích hoạt tổ chức ${org.code}.`);
                                  }
                                }}
                              >
                                Kích hoạt (ACTIVE)
                              </button>
                            )}
                            {org.status === "ACTIVE" && (
                              <button
                                type="button"
                                className="btn-danger-outline btn-xs"
                                onClick={() => {
                                  const res = updateOrganizationStatus(state, {
                                    organizationId: org.id,
                                    nextStatus: "SUSPENDED",
                                  });
                                  if (!res.error) {
                                    onStateChange(res.state);
                                    onNotify(
                                      "warning",
                                      `Đã tạm ngưng quyền phát hành của ${org.code}.`,
                                    );
                                  }
                                }}
                              >
                                Tạm ngưng
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-forms-col">
          <form className="panel-card" onSubmit={handleRegisterOrg}>
            <span className="eyebrow">ĐĂNG KÝ TỔ CHỨC MỚI</span>
            <h3>Tiếp nhận Đơn vị Đào tạo</h3>

            <div className="form-grid-2">
              <label className="form-field">
                <span>Mã định danh (Code)</span>
                <input
                  value={orgCode}
                  onChange={(event) => setOrgCode(event.target.value)}
                  placeholder="Nhập mã đơn vị..."
                  required
                />
              </label>
              <label className="form-field">
                <span>Mã hồ sơ / Quyết định</span>
                <input
                  value={orgVerificationRef}
                  onChange={(event) => setOrgVerificationRef(event.target.value)}
                  placeholder="Nhập mã hồ sơ pháp lý..."
                  required
                />
              </label>
            </div>

            <label className="form-field">
              <span>Tên hiển thị ngắn gọn</span>
              <input
                value={orgDisplayName}
                onChange={(event) => setOrgDisplayName(event.target.value)}
                placeholder="Nhập tên hiển thị..."
                required
              />
            </label>

            <label className="form-field">
              <span>Tên pháp nhân đầy đủ</span>
              <input
                value={orgLegalName}
                onChange={(event) => setOrgLegalName(event.target.value)}
                placeholder="Nhập tên pháp nhân đầy đủ..."
                required
              />
            </label>

            <button type="submit" className="btn-primary full-width">
              Đăng ký Tổ chức Đào tạo
            </button>
          </form>

          <form className="panel-card" onSubmit={handleAuthorizeWallet}>
            <span className="eyebrow">ỦY QUYỀN ĐỊA CHỈ VÍ KÝ SỐ (1 VÍ ACTIVE / TỔ CHỨC)</span>
            <h3>Cấp phép Ví EVM trên Smart Contract</h3>

            <label className="form-field">
              <span>Chọn tổ chức đào tạo</span>
              <select
                value={walletOrgId || state.organizations[0]?.id || ""}
                onChange={(event) => setWalletOrgId(event.target.value)}
                disabled={state.organizations.length === 0}
              >
                {state.organizations.length === 0 ? (
                  <option value="">Chưa có tổ chức đào tạo</option>
                ) : (
                  state.organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.code} — {org.displayName}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="form-field">
              <span>Địa chỉ ví EVM (0x + 40 ký tự hex)</span>
              <input
                value={walletAddress}
                onChange={(event) => setWalletAddress(event.target.value)}
                placeholder="0x..."
                required
              />
            </label>

            <button
              type="submit"
              className="btn-primary full-width"
              disabled={state.organizations.length === 0}
            >
              Ủy quyền Địa chỉ Ví EVM
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
