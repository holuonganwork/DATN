import { useState, type FormEvent } from "react";
import {
  BATCH_PIPELINE_STEPS,
  addEntryToBatch,
  approveBatch,
  batchStatusLabels,
  confirmBatchPublish,
  createBatch,
  freezeBatch,
  removeBatchEntry,
  roleLabels,
  validateBatch,
  type AppState,
  type BatchEntry,
  type Credential,
  type IssuerSubTab,
  type NoticeBanner,
  type UserRole,
} from "../../domain";
import { formatDateTime, shortHash } from "../../services";

interface IssuerBatchesTabProps {
  state: AppState;
  role: UserRole;
  selectedOrg: AppState["organizations"][number];
  orgCourses: AppState["courses"];
  orgLearners: AppState["learners"];
  orgBatches: AppState["batches"];
  selectedBatch: AppState["batches"][number] | undefined;
  selectedBatchEntries: BatchEntry[];
  onSelectBatch: (batchId: string) => void;
  onSubTabChange: (tab: IssuerSubTab) => void;
  onStateChange: (next: AppState) => void;
  onNotify: (tone: NoticeBanner["tone"], message: string) => void;
  onOpenPublishModal: (batchId: string) => void;
  onSelectCredentialForVerify: (credential: Credential) => void;
  onOpenCredentialDetail: (credentialId: string) => void;
}

export function IssuerBatchesTab({
  state,
  role,
  selectedOrg,
  orgCourses,
  orgLearners,
  orgBatches,
  selectedBatch,
  selectedBatchEntries,
  onSelectBatch,
  onSubTabChange,
  onStateChange,
  onNotify,
  onOpenPublishModal,
  onSelectCredentialForVerify,
  onOpenCredentialDetail,
}: IssuerBatchesTabProps) {
  const [newBatchTitle, setNewBatchTitle] = useState<string>("");
  const [newBatchCourseId, setNewBatchCourseId] = useState<string>("");

  const [entryLearnerId, setEntryLearnerId] = useState<string>("");
  const [entryResult, setEntryResult] = useState<string>("");
  const [entryIssuedDate, setEntryIssuedDate] = useState<string>("");
  const [entryExpiresDate, setEntryExpiresDate] = useState<string>("");

  function handleCreateBatch(event: FormEvent) {
    event.preventDefault();
    const res = createBatch(state, {
      organizationId: selectedOrg.id,
      courseId: newBatchCourseId || orgCourses[0]?.id || "",
      title: newBatchTitle,
      chainId: 31337,
    });
    if (res.error || !res.batch) {
      onNotify("danger", res.error ?? "Không thể tạo lô phát hành mới.");
      return;
    }
    onStateChange(res.state);
    onSelectBatch(res.batch.id);
    setNewBatchTitle("");
    onNotify("success", `Đã khởi tạo lô nháp ${res.batch.code}.`);
  }

  function handleAddEntry(event: FormEvent) {
    event.preventDefault();
    if (!selectedBatch) return;
    const res = addEntryToBatch(state, {
      batchId: selectedBatch.id,
      learnerId: entryLearnerId || orgLearners[0]?.id || "",
      result: entryResult,
      issuedAt: entryIssuedDate ? `${entryIssuedDate}T00:00:00Z` : "",
      expiresAt: entryExpiresDate ? `${entryExpiresDate}T00:00:00Z` : null,
    });
    if (res.error) {
      onNotify("danger", res.error);
      return;
    }
    onStateChange(res.state);
    setEntryResult("");
    setEntryIssuedDate("");
    setEntryExpiresDate("");
    onNotify("success", "Đã thêm hồ sơ học viên vào lô nháp.");
  }

  return (
    <div className="issuer-batch-layout">
      <aside className="panel-card batch-sidebar">
        <div className="panel-head">
          <div>
            <span className="eyebrow">DANH SÁCH LÔ CHỨNG CHỈ</span>
            <h2>Lô của {selectedOrg.code}</h2>
          </div>
        </div>

        <div className="batch-list">
          {orgBatches.length === 0 ? (
            <div className="cell-sub">Chưa có lô phát hành nào.</div>
          ) : (
            orgBatches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                className={selectedBatch?.id === batch.id ? "batch-item active" : "batch-item"}
                onClick={() => onSelectBatch(batch.id)}
              >
                <div className="batch-item-top">
                  <code>{batch.code}</code>
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
                </div>
                <strong>{batch.title}</strong>
                <small>{batch.entries.length} hồ sơ trong lô</small>
              </button>
            ))
          )}
        </div>

        <form className="compact-form" onSubmit={handleCreateBatch}>
          <span className="eyebrow">KHỞI TẠO LÔ MỚI (UC-03)</span>
          <label className="form-field">
            <span>Chương trình đào tạo</span>
            <select
              value={newBatchCourseId || orgCourses[0]?.id || ""}
              onChange={(event) => setNewBatchCourseId(event.target.value)}
              disabled={orgCourses.length === 0}
            >
              {orgCourses.length === 0 ? (
                <option value="">Chưa có khóa học (Hãy tạo ở mục Khóa học)</option>
              ) : (
                orgCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} — {course.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="form-field">
            <span>Tên đợt phát hành</span>
            <input
              value={newBatchTitle}
              onChange={(event) => setNewBatchTitle(event.target.value)}
              placeholder="Nhập tên đợt phát hành..."
              required
            />
          </label>
          <button
            type="submit"
            className="btn-secondary full-width"
            disabled={orgCourses.length === 0}
          >
            + Tạo Lô Nháp (DRAFT)
          </button>
        </form>
      </aside>

      <div className="panel-card batch-workspace">
        {selectedBatch ? (
          <>
            <div className="batch-workspace-head">
              <div>
                <div className="batch-code-row">
                  <code>{selectedBatch.code}</code>
                  <span
                    className={`status-pill ${
                      selectedBatch.status === "CONFIRMED"
                        ? "tone-valid"
                        : selectedBatch.status === "DRAFT"
                          ? "tone-info"
                          : "tone-warn"
                    }`}
                  >
                    {batchStatusLabels[selectedBatch.status]}
                  </span>
                </div>
                <h2>{selectedBatch.title}</h2>
              </div>

              <div className="pipeline-action-bar">
                {selectedBatch.status === "DRAFT" && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      const res = validateBatch(state, selectedBatch.id);
                      onStateChange(res.state);
                      if (res.error) {
                        onNotify("danger", res.error);
                        return;
                      }
                      onNotify(
                        "success",
                        `Lô ${selectedBatch.code} đã vượt qua kiểm tra hợp lệ (VALIDATED).`,
                      );
                    }}
                  >
                    Bước 2: Kiểm tra tính hợp lệ (Validate) →
                  </button>
                )}

                {selectedBatch.status === "VALIDATED" && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (role !== "ISSUER_APPROVER" && role !== "SYSTEM_ADMIN") {
                        onNotify(
                          "warning",
                          "Vui lòng chuyển sang vai trò 'Người Duyệt & Ký số' để phê duyệt lô.",
                        );
                        return;
                      }
                      const res = approveBatch(
                        state,
                        selectedBatch.id,
                        `${selectedOrg.code} (${roleLabels[role]})`,
                      );
                      if (res.error) {
                        onNotify("danger", res.error);
                        return;
                      }
                      onStateChange(res.state);
                      onNotify("success", `Đã phê duyệt lô ${selectedBatch.code} (APPROVED).`);
                    }}
                  >
                    Bước 3: Phê duyệt Lô (Approve) →
                  </button>
                )}

                {selectedBatch.status === "APPROVED" && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      const res = freezeBatch(state, selectedBatch.id);
                      if (res.error) {
                        onNotify("danger", res.error);
                        return;
                      }
                      onStateChange(res.state);
                      onNotify(
                        "success",
                        "Đã chuẩn hóa JCS, tạo lá và đóng băng Merkle Root thành công (FROZEN).",
                      );
                    }}
                  >
                    Bước 4: Đóng băng & Dựng Merkle Root →
                  </button>
                )}

                {selectedBatch.status === "FROZEN" && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => onOpenPublishModal(selectedBatch.id)}
                  >
                    Bước 5: Ký Ví EVM & Neo On-chain →
                  </button>
                )}

                {selectedBatch.status === "PENDING_CHAIN" && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      const res = confirmBatchPublish(state, {
                        batchId: selectedBatch.id,
                      });
                      if (res.error) {
                        onNotify("danger", res.error);
                        return;
                      }
                      onStateChange(res.state);
                      onNotify(
                        "success",
                        "Giao dịch đã xác nhận khối (CONFIRMED) và phát hành gói chứng chỉ.",
                      );
                    }}
                  >
                    Bước 6: Đồng bộ Receipt & Xác nhận Khối →
                  </button>
                )}
              </div>
            </div>

            <div className="pipeline-stepper">
              {BATCH_PIPELINE_STEPS.map((stepStatus, index) => {
                const currentIdx = BATCH_PIPELINE_STEPS.indexOf(selectedBatch.status);
                const stateClass =
                  index < currentIdx ? "done" : index === currentIdx ? "current" : "upcoming";
                return (
                  <div key={stepStatus} className={`pipeline-step ${stateClass}`}>
                    <span className="step-index">{index + 1}</span>
                    <div>
                      <strong>{batchStatusLabels[stepStatus]}</strong>
                      <small>{stepStatus}</small>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedBatch.merkleRoot && (
              <div className="merkle-anchor-banner">
                <div>
                  <span>MERKLE ROOT (SHA-256)</span>
                  <code>{selectedBatch.merkleRoot}</code>
                </div>
                {selectedBatch.txHash && (
                  <div>
                    <span>ON-CHAIN TX HASH</span>
                    <code>
                      {shortHash(selectedBatch.txHash, 14, 10)}
                      {selectedBatch.blockNumber !== undefined
                        ? ` (Block #${selectedBatch.blockNumber})`
                        : ""}
                    </code>
                  </div>
                )}
              </div>
            )}

            {selectedBatch.status === "DRAFT" && (
              <form className="add-entry-bar" onSubmit={handleAddEntry}>
                <label className="form-field">
                  <span>Học viên</span>
                  <select
                    value={entryLearnerId || orgLearners[0]?.id || ""}
                    onChange={(event) => setEntryLearnerId(event.target.value)}
                    disabled={orgLearners.length === 0}
                  >
                    {orgLearners.length === 0 ? (
                      <option value="">Chưa có học viên</option>
                    ) : (
                      orgLearners.map((learner) => (
                        <option key={learner.id} value={learner.id}>
                          {learner.subjectRef} — {learner.displayName}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <label className="form-field">
                  <span>Kết quả / Điểm & Xếp loại</span>
                  <input
                    value={entryResult}
                    onChange={(event) => setEntryResult(event.target.value)}
                    placeholder="Nhập điểm hoặc xếp loại..."
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Ngày cấp</span>
                  <input
                    type="date"
                    value={entryIssuedDate}
                    onChange={(event) => setEntryIssuedDate(event.target.value)}
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Hết hạn (tùy chọn)</span>
                  <input
                    type="date"
                    value={entryExpiresDate}
                    onChange={(event) => setEntryExpiresDate(event.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  className="btn-secondary"
                  disabled={orgLearners.length === 0}
                >
                  + Thêm vào Lô
                </button>
              </form>
            )}

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã mục / Học viên</th>
                    <th>Kết quả đạt được</th>
                    <th>File PDF đính kèm</th>
                    <th>Payload Digest / Leaf Hash</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBatchEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state-cell">
                          <strong>Lô này chưa có hồ sơ học viên nào.</strong>
                          <span>Hãy thêm học viên vào lô ở biểu mẫu phía trên.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    selectedBatchEntries.map((entry, idx) => {
                      const issuedCred = state.credentials.find(
                        (c) => c.batchEntryId === entry.id,
                      );
                      return (
                        <tr key={entry.id}>
                          <td>
                            <code>#{idx + 1}</code>
                          </td>
                          <td>
                            <strong>{entry.holderName}</strong>
                            <div className="cell-sub">{entry.subjectRef}</div>
                          </td>
                          <td>
                            <strong>{entry.result}</strong>
                            <div className="cell-sub">
                              Ngày cấp: {formatDateTime(entry.issuedAt)}
                            </div>
                          </td>
                          <td>
                            <code>{entry.pdfFileName}</code>
                            <div className="cell-sub">
                              SHA-256: {shortHash(entry.pdfSha256, 8, 6)}
                            </div>
                          </td>
                          <td>
                            <code>Leaf: {shortHash(entry.leaf, 10, 8)}</code>
                            <div className="cell-sub">
                              Digest: {shortHash(entry.payloadDigest, 10, 8)}
                            </div>
                          </td>
                          <td className="text-right">
                            {selectedBatch.status === "DRAFT" && (
                              <button
                                type="button"
                                className="btn-ghost"
                                onClick={() => {
                                  const res = removeBatchEntry(state, {
                                    batchId: selectedBatch.id,
                                    entryId: entry.id,
                                  });
                                  if (res.error) {
                                    onNotify("danger", res.error);
                                    return;
                                  }
                                  onStateChange(res.state);
                                }}
                              >
                                Xóa
                              </button>
                            )}
                            {issuedCred && (
                              <div className="table-actions">
                                <button
                                  type="button"
                                  className="btn-secondary btn-xs"
                                  onClick={() => onOpenCredentialDetail(issuedCred.id)}
                                >
                                  Xem Phôi & QR
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary btn-xs"
                                  onClick={() => onSelectCredentialForVerify(issuedCred)}
                                >
                                  Kiểm định
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="verifier-empty-state">
            <span className="eyebrow">CHƯA CÓ LÔ PHÁT HÀNH</span>
            <h2>Đơn vị {selectedOrg.displayName} chưa khởi tạo lô chứng chỉ nào</h2>
            <p className="panel-desc">
              Trước tiên hãy tạo Chương trình đào tạo và Hồ sơ học viên ở tab{" "}
              <strong>Khóa học &amp; Học viên</strong>, sau đó khởi tạo lô nháp ở cột bên trái.
            </p>
            <div className="button-row">
              <button
                type="button"
                className="btn-primary"
                onClick={() => onSubTabChange("catalog")}
              >
                Đi tới Khóa học & Học viên (UC-02) →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
