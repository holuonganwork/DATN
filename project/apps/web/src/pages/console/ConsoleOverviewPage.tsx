import {
  batchStatusLabels,
  credentialStatusLabels,
  roleLabels,
  type AppState,
  type ConsolePage,
  type Credential,
  type UserRole,
} from "../../domain";
import { shortHash } from "../../services";

interface ConsoleOverviewViewProps {
  role: UserRole;
  selectedOrg: AppState["organizations"][number];
  activeOrgWallet: AppState["wallets"][number] | undefined;
  orgCourses: AppState["courses"];
  orgLearners: AppState["learners"];
  orgBatches: AppState["batches"];
  orgCredentials: AppState["credentials"];
  onNavigateConsole: (page: ConsolePage) => void;
  onSelectBatch: (batchId: string) => void;
  onSelectCredential: (cred: Credential) => void;
  onOpenDetail: (credId: string) => void;
}

export function ConsoleOverviewView({
  role,
  selectedOrg,
  activeOrgWallet,
  orgCourses,
  orgLearners,
  orgBatches,
  orgCredentials,
  onNavigateConsole,
  onSelectBatch,
  onSelectCredential,
  onOpenDetail,
}: ConsoleOverviewViewProps) {
  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">TỔNG QUAN KHÔNG GIAN LÀM VIỆC ĐƠN VỊ</span>
          <h1>
            {selectedOrg.displayName} ({selectedOrg.code})
          </h1>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigateConsole("catalog")}
          >
            + Khóa học & Học viên
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigateConsole("batches")}
          >
            Quản lý Lô phát hành →
          </button>
        </div>
      </div>

      <section className="kpi-grid-4">
        <article className="kpi-card">
          <span className="kpi-label">LÔ PHÁT HÀNH CỦA ĐƠN VỊ</span>
          <strong className="kpi-value">{orgBatches.length}</strong>
          <span className="kpi-foot">
            {orgBatches.filter((b) => b.status === "CONFIRMED").length} lô đã neo On-chain
          </span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">CHỨNG CHỈ ĐÃ CẤP</span>
          <strong className="kpi-value">{orgCredentials.length}</strong>
          <span className="kpi-foot">
            {orgCredentials.filter((c) => c.status === "ISSUED").length} chứng chỉ đang hiệu lực
          </span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">KHÓA HỌC & HỌC VIÊN</span>
          <strong className="kpi-value">
            {orgCourses.length} / {orgLearners.length}
          </strong>
          <span className="kpi-foot">
            {orgCourses.length} chương trình · {orgLearners.length} hồ sơ học viên
          </span>
        </article>
        <article className="kpi-card">
          <span className="kpi-label">VÍ EVM ỦY QUYỀN</span>
          <strong className="kpi-value">
            {activeOrgWallet ? shortHash(activeOrgWallet.address, 6, 4) : "Chưa cấp"}
          </strong>
          <span className="kpi-foot">Vai trò hiện tại: {roleLabels[role]}</span>
        </article>
      </section>

      <div className="admin-grid">
        <div className="panel-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">DANH SÁCH LÔ PHÁT HÀNH GẦN ĐÂY</span>
              <h2>Trạng thái Đường ống Lô Chứng chỉ (Batches)</h2>
            </div>
            <button
              type="button"
              className="btn-secondary btn-xs"
              onClick={() => onNavigateConsole("batches")}
            >
              Mở tất cả lô →
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Tên đợt phát hành</th>
                <th>Số lượng</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orgBatches.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state-cell">
                      <strong>Chưa có lô phát hành nào.</strong>
                      <span>Hãy tạo khóa học, thêm học viên và khởi tạo lô mới.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                orgBatches.map((batch) => (
                  <tr key={batch.id}>
                    <td>
                      <code>{batch.code}</code>
                    </td>
                    <td>
                      <strong>{batch.title}</strong>
                      <div className="cell-sub">
                        Merkle Root: {batch.merkleRoot ? shortHash(batch.merkleRoot, 10, 6) : "—"}
                      </div>
                    </td>
                    <td>{batch.entries.length} hồ sơ</td>
                    <td>
                      <span
                        className={`status-pill ${
                          batch.status === "CONFIRMED"
                            ? "tone-valid"
                            : batch.status === "DRAFT"
                              ? "tone-info"
                              : "tone-warn"
                        }`}
                      >
                        {batchStatusLabels[batch.status]}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-secondary btn-xs"
                        onClick={() => onSelectBatch(batch.id)}
                      >
                        Mở lô →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="panel-card">
          <div className="panel-head">
            <div>
              <span className="eyebrow">CHỨNG CHỈ MỚI PHÁT HÀNH CỦA ĐƠN VỊ</span>
              <h2>Sổ Chứng chỉ ({selectedOrg.code})</h2>
            </div>
            <button
              type="button"
              className="btn-secondary btn-xs"
              onClick={() => onNavigateConsole("credentials")}
            >
              Mở Sổ Chứng chỉ →
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Mã chứng chỉ</th>
                <th>Học viên</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orgCredentials.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state-cell">
                      <strong>Chưa có chứng chỉ nào được phát hành.</strong>
                    </div>
                  </td>
                </tr>
              ) : (
                orgCredentials.slice(0, 5).map((cred) => (
                  <tr key={cred.id}>
                    <td>
                      <code className="code-strong">{cred.code}</code>
                    </td>
                    <td>
                      <strong>{cred.holder}</strong>
                      <div className="cell-sub">{cred.course}</div>
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
                          onClick={() => onOpenDetail(cred.id)}
                        >
                          Phôi & QR
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-xs"
                          onClick={() => onSelectCredential(cred)}
                        >
                          Kiểm định ↗
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
