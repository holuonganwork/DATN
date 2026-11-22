import { useMemo, useState } from "react";
import {
  buildCredentialPackage,
  credentialStatusLabels,
  type AppState,
  type Credential,
} from "../../domain";
import { downloadCredentialPackageJson, formatDateTime, shortHash } from "../../services";

interface IssuerCredentialsTabProps {
  state: AppState;
  selectedOrg: AppState["organizations"][number];
  orgCredentials: AppState["credentials"];
  onSelectCredentialForVerify: (credential: Credential) => void;
  onOpenCredentialDetail: (credentialId: string) => void;
  onOpenRevokeModal: (credential: Credential) => void;
  onOpenReissueModal: (credential: Credential) => void;
}

export function IssuerCredentialsTab({
  state,
  selectedOrg,
  orgCredentials,
  onSelectCredentialForVerify,
  onOpenCredentialDetail,
  onOpenRevokeModal,
  onOpenReissueModal,
}: IssuerCredentialsTabProps) {
  const [credSearch, setCredSearch] = useState<string>("");
  const [credFilterStatus, setCredFilterStatus] = useState<string>("ALL");

  const filteredCredentials = useMemo(() => {
    return orgCredentials.filter((cred) => {
      if (credFilterStatus !== "ALL" && cred.status !== credFilterStatus) return false;
      if (!credSearch.trim()) return true;
      const q = credSearch.trim().toLowerCase();
      return (
        cred.code.toLowerCase().includes(q) ||
        cred.holder.toLowerCase().includes(q) ||
        cred.subjectRef.toLowerCase().includes(q) ||
        cred.course.toLowerCase().includes(q)
      );
    });
  }, [orgCredentials, credFilterStatus, credSearch]);

  return (
    <div className="panel-card">
      <div className="panel-head">
        <div>
          <span className="eyebrow">QUẢN LÝ VÒNG ĐỜI CHỨNG CHỈ (UC-06, UC-07, UC-08)</span>
          <h2>Sổ đăng ký Chứng chỉ của {selectedOrg.displayName}</h2>
        </div>

        <div className="filter-bar">
          <input
            value={credSearch}
            onChange={(event) => setCredSearch(event.target.value)}
            placeholder="Tìm theo mã chứng chỉ, tên hoặc mã học viên..."
          />
          <select
            value={credFilterStatus}
            onChange={(event) => setCredFilterStatus(event.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ISSUED">Đang hiệu lực (ISSUED)</option>
            <option value="REVOKED">Đã thu hồi (REVOKED)</option>
            <option value="SUPERSEDED">Đã thay thế (SUPERSEDED)</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã chứng chỉ</th>
              <th>Học viên</th>
              <th>Khóa đào tạo</th>
              <th>Kết quả / Ngày cấp</th>
              <th>Lô & Merkle Root</th>
              <th>Trạng thái</th>
              <th className="text-right">Thao tác nghiệp vụ</th>
            </tr>
          </thead>
          <tbody>
            {filteredCredentials.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state-cell">
                    <strong>Chưa có chứng chỉ nào phù hợp trong sổ đăng ký của đơn vị.</strong>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCredentials.map((cred) => (
                <tr key={cred.id}>
                  <td>
                    <code className="code-strong">{cred.code}</code>
                    {cred.reissuedFromId && (
                      <div className="cell-sub">Cấp lại từ bản cũ</div>
                    )}
                  </td>
                  <td>
                    <strong>{cred.holder}</strong>
                    <div className="cell-sub">{cred.subjectRef}</div>
                  </td>
                  <td>
                    <span>{cred.course}</span>
                    <div className="cell-sub">{cred.courseCode}</div>
                  </td>
                  <td>
                    <strong>{cred.score}</strong>
                    <div className="cell-sub">{formatDateTime(cred.issuedAt)}</div>
                  </td>
                  <td>
                    <code>{shortHash(cred.merkleRoot, 8, 6)}</code>
                    <div className="cell-sub">Batch: {cred.batchId}</div>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        cred.status === "ISSUED"
                          ? "tone-valid"
                          : cred.status === "REVOKED"
                            ? "tone-danger"
                            : "tone-warn"
                      }`}
                    >
                      {credentialStatusLabels[cred.status]}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-xs"
                        onClick={() => onOpenCredentialDetail(cred.id)}
                      >
                        Phôi & QR
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-xs"
                        onClick={() => onSelectCredentialForVerify(cred)}
                      >
                        Kiểm định
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-xs"
                        onClick={() => {
                          const pkg = buildCredentialPackage(state, cred.id);
                          if (pkg) downloadCredentialPackageJson(cred.code, pkg);
                        }}
                      >
                        Tải .json
                      </button>
                      {cred.status === "ISSUED" && (
                        <>
                          <button
                            type="button"
                            className="btn-secondary btn-xs"
                            onClick={() => onOpenReissueModal(cred)}
                          >
                            Cấp lại
                          </button>
                          <button
                            type="button"
                            className="btn-danger-outline btn-xs"
                            onClick={() => onOpenRevokeModal(cred)}
                          >
                            Thu hồi
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
