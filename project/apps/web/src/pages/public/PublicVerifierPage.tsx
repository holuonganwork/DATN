import type { ChangeEvent, FormEvent } from "react";
import {
  verifyMeta,
  type AppState,
  type Credential,
  type CredentialPackage,
  type VerificationReport,
  type VerifierMode,
} from "../../domain";
import { downloadCredentialPackageJson, formatDateTime, shortHash } from "../../services";

interface PublicVerifierViewProps {
  state: AppState;
  verifierMode: VerifierMode;
  onVerifierModeChange: (mode: VerifierMode) => void;
  lookupCode: string;
  onLookupCodeChange: (code: string) => void;
  onRunCodeSearch: (code: string) => void;
  activePackage: CredentialPackage | null;
  inspectorJsonText: string;
  jsonParseError: string | null;
  uploadedFileName: string | null;
  uploadedFileHash: string | undefined;
  verificationReport: VerificationReport | null;
  onSelectCredential: (credential: Credential) => void;
  onOpenDetail: (credentialId: string) => void;
  onInspectorTextChange: (text: string) => void;
  onJsonFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onAttachmentFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearAttachment: () => void;
}

export function PublicVerifierView({
  state,
  verifierMode,
  onVerifierModeChange,
  lookupCode,
  onLookupCodeChange,
  onRunCodeSearch,
  activePackage,
  inspectorJsonText,
  jsonParseError,
  uploadedFileName,
  uploadedFileHash,
  verificationReport,
  onSelectCredential,
  onOpenDetail,
  onInspectorTextChange,
  onJsonFileUpload,
  onAttachmentFileUpload,
  onClearAttachment,
}: PublicVerifierViewProps) {
  const verdict = verificationReport ? verifyMeta[verificationReport.result] : null;
  const matchedCred = verificationReport?.credential;
  const issuerOrg = state.organizations.find((o) => o.id === activePackage?.payload.issuerId);

  function handleSearchForm(event: FormEvent) {
    event.preventDefault();
    onRunCodeSearch(lookupCode);
  }

  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">CỔNG XÁC THỰC ĐỘC LẬP (UC-09)</span>
          <h1>Kiểm định Mật mã & Trạng thái Chứng chỉ On-chain</h1>
        </div>
        <div className="segmented-tabs">
          <button
            type="button"
            className={verifierMode === "lookup" ? "seg-btn active" : "seg-btn"}
            onClick={() => onVerifierModeChange("lookup")}
          >
            1. Tra cứu Mã / Tải File
          </button>
          <button
            type="button"
            className={verifierMode === "inspector" ? "seg-btn active" : "seg-btn"}
            onClick={() => {
              if (!inspectorJsonText && activePackage) {
                onInspectorTextChange(JSON.stringify(activePackage, null, 2));
              }
              onVerifierModeChange("inspector");
            }}
          >
            2. Payload & File Inspector
          </button>
        </div>
      </div>

      <div className="verifier-layout">
        <div className="panel-card">
          {verifierMode === "lookup" ? (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">PHƯƠNG THỨC 1: TRA CỨU THEO MÃ ĐỊNH DANH</span>
                  <h2>Nhập mã chứng chỉ trên phôi hoặc mã QR</h2>
                </div>
              </div>

              <form className="search-bar" onSubmit={handleSearchForm}>
                <input
                  value={lookupCode}
                  onChange={(event) => onLookupCodeChange(event.target.value)}
                  placeholder="Nhập mã định danh chứng chỉ..."
                  aria-label="Mã chứng chỉ"
                />
                <button type="submit" className="btn-primary">
                  Xác thực ngay
                </button>
              </form>

              <div className="divider-line" />

              <div className="upload-grid-2">
                <div className="upload-box">
                  <span className="eyebrow">PHƯƠNG THỨC 2: GÓI CHỨNG CHỈ (.JSON)</span>
                  <h3>Tải file Credential Package</h3>
                  <p>
                    Đối chiếu trực tiếp từ file <code>.json</code> chứa{" "}
                    <code>payload + anchor + proof</code> mà không cần phụ thuộc cơ sở dữ liệu nội
                    bộ.
                  </p>
                  <label className="file-upload-btn">
                    <input type="file" accept=".json,application/json" onChange={onJsonFileUpload} />
                    <span>Chọn file .json từ máy tính</span>
                  </label>
                </div>

                <div className="upload-box">
                  <span className="eyebrow">PHƯƠNG THỨC 3: KIỂM ĐỊNH FILE PDF ĐÍNH KÈM</span>
                  <h3>Đối chiếu mã băm SHA-256 của file PDF</h3>
                  <p>
                    Tính hàm băm SHA-256 trực tiếp trên trình duyệt và so khớp với trường{" "}
                    <code>payload.pdfSha256</code> trong gói chứng chỉ.
                  </p>
                  <div className="button-row">
                    <label className="file-upload-btn">
                      <input type="file" onChange={onAttachmentFileUpload} />
                      <span>Chọn file PDF / Bản in</span>
                    </label>
                  </div>
                  {uploadedFileName && (
                    <div className="uploaded-file-pill">
                      <div>
                        <strong>{uploadedFileName}</strong>
                        <code>SHA-256: {shortHash(uploadedFileHash ?? "", 14, 10)}</code>
                      </div>
                      <button type="button" className="btn-ghost" onClick={onClearAttachment}>
                        Gỡ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">TRÌNH KIỂM TRA CẤU TRÚC GÓI CHỨNG CHỈ</span>
                  <h2>Payload & File Inspector (JSON Canonicalization)</h2>
                </div>
                {matchedCred && (
                  <button
                    type="button"
                    className="btn-secondary btn-xs"
                    onClick={() => onSelectCredential(matchedCred)}
                  >
                    Tải lại gói gốc từ sổ
                  </button>
                )}
              </div>

              <p className="panel-desc">
                Dán nội dung tệp <code>CredentialPackage (.json)</code> vào khung bên dưới để kiểm
                tra trực tiếp cấu trúc <code>payload</code>, <code>anchor</code> và{" "}
                <code>proof</code> theo chuẩn RFC 8785.
              </p>

              <textarea
                className="json-editor"
                rows={16}
                value={inspectorJsonText}
                onChange={(event) => onInspectorTextChange(event.target.value)}
                placeholder='{"payload": {...}, "anchor": {...}, "proof": {...}}'
                spellCheck={false}
              />

              {jsonParseError && <div className="inline-error">{jsonParseError}</div>}
            </>
          )}
        </div>

        <div className="panel-card">
          {!verificationReport || !verdict ? (
            <div className="verifier-empty-state">
              <span className="eyebrow">TRẠNG THÁI CHỜ XÁC THỰC</span>
              <h2>Chưa có dữ liệu chứng chỉ được nạp để kiểm định</h2>
              <p className="panel-desc">
                Vui lòng nhập mã định danh chứng chỉ ở khung bên trái và nhấn{" "}
                <strong>Xác thực ngay</strong>, hoặc tải lên tệp gói chứng chỉ <code>.json</code>{" "}
                để hệ thống thực hiện đối chiếu mật mã 7 bước.
              </p>
            </div>
          ) : (
            <>
              <div className={`verdict-banner tone-${verdict.tone}`}>
                <div className="verdict-top">
                  <span className="verdict-badge">{verdict.badge}</span>
                  <span className="verdict-code">
                    {matchedCred?.code ?? activePackage?.payload.credentialId ?? lookupCode}
                  </span>
                </div>
                <h2>{verdict.title}</h2>
                <p>{verdict.summary}</p>

                {matchedCred?.status === "REVOKED" && (
                  <div className="lineage-alert danger">
                    <strong>Lý do thu hồi ({formatDateTime(matchedCred.revokedAt)}):</strong>{" "}
                    {matchedCred.revokedReason}
                  </div>
                )}

                {matchedCred?.status === "SUPERSEDED" && matchedCred.reissuedToId && (
                  <div className="lineage-alert warn">
                    <span>
                      Chứng chỉ này đã được thay thế bởi bản cấp lại mới hơn trên sổ đăng ký.
                    </span>
                    <button
                      type="button"
                      className="btn-secondary btn-xs"
                      onClick={() => {
                        const replacement = state.credentials.find(
                          (item) => item.id === matchedCred.reissuedToId,
                        );
                        if (replacement) onSelectCredential(replacement);
                      }}
                    >
                      Xem bản thay thế mới →
                    </button>
                  </div>
                )}

                {matchedCred?.reissuedFromId && (
                  <div className="lineage-alert info">
                    <span>
                      Đây là chứng chỉ cấp lại chính thức (kế thừa lịch sử từ bản gốc{" "}
                      <code>
                        {state.credentials.find((c) => c.id === matchedCred.reissuedFromId)?.code ??
                          matchedCred.reissuedFromId}
                      </code>
                      ).
                    </span>
                  </div>
                )}
              </div>

              {activePackage && (
                <div className="verified-summary-card">
                  <div className="summary-header">
                    <div>
                      <span className="eyebrow">THÔNG TIN CHỨNG CHỈ ĐANG KIỂM ĐỊNH</span>
                      <h3>{activePackage.payload.holder}</h3>
                    </div>
                    <div className="button-row">
                      {matchedCred && (
                        <button
                          type="button"
                          className="btn-secondary btn-xs"
                          onClick={() => onOpenDetail(matchedCred.id)}
                        >
                          Xem Phôi & Mã QR
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-secondary btn-xs"
                        onClick={() =>
                          downloadCredentialPackageJson(
                            matchedCred?.code ?? activePackage.payload.credentialId,
                            activePackage,
                          )
                        }
                      >
                        Tải gói .json
                      </button>
                    </div>
                  </div>

                  <div className="summary-grid-3">
                    <div>
                      <span>Khóa đào tạo</span>
                      <strong>{activePackage.payload.courseName}</strong>
                    </div>
                    <div>
                      <span>Đơn vị cấp</span>
                      <strong>{issuerOrg?.displayName ?? activePackage.payload.issuerId}</strong>
                    </div>
                    <div>
                      <span>Kết quả & Ngày cấp</span>
                      <strong>
                        {activePackage.payload.result} ·{" "}
                        {formatDateTime(activePackage.payload.issuedAt)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="steps-section">
                <div className="steps-head">
                  <span className="eyebrow">
                    BÁO CÁO ĐỐI CHIẾU MẬT MÃ ({verificationReport.checks.length} BƯỚC)
                  </span>
                  <span>
                    Leaf: <code>{shortHash(activePackage?.proof.leaf, 10, 8)}</code>
                  </span>
                </div>

                {verificationReport.checks.length === 0 ? (
                  <p className="panel-desc">
                    Không tìm thấy gói chứng chỉ tương ứng với mã đã nhập trong sổ đăng ký hiện tại.
                  </p>
                ) : (
                  <div className="verify-step-list">
                    {verificationReport.checks.map((step, index) => {
                      const passed = step.status === "PASS";
                      return (
                        <div
                          key={step.key}
                          className={`verify-step-item ${passed ? "pass" : "fail"}`}
                        >
                          <div className="step-num">{index + 1}</div>
                          <div className="step-body">
                            <div className="step-title-row">
                              <strong>{step.label}</strong>
                              <span className={passed ? "step-tag pass" : "step-tag fail"}>
                                {step.status}
                              </span>
                            </div>
                            <p>{step.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
