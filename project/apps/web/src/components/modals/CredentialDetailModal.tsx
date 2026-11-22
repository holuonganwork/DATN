import {
  buildCredentialPackage,
  credentialStatusLabels,
  type AppState,
  type Credential,
} from "../../domain";
import { downloadCredentialPackageJson, formatDateTime, shortHash } from "../../services";
import { BrandLogo } from "../ui/BrandLogo";

interface CredentialDetailModalProps {
  credential: Credential;
  state: AppState;
  organizationName: string;
  onClose: () => void;
  onSendToVerify: (credential: Credential) => void;
}

export function CredentialDetailModal({
  credential,
  state,
  organizationName,
  onClose,
  onSendToVerify,
}: CredentialDetailModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-sheet modal-lg">
        <div className="modal-header">
          <div>
            <span className="eyebrow">PHÔI CHỨNG CHỈ SỐ & MÃ QR XÁC THỰC</span>
            <h3>
              {credential.code} — {credential.holder}
            </h3>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Đóng ✕
          </button>
        </div>

        <div className="certificate-sheet">
          <div className="certificate-sheet-head">
            <div className="cert-brand-cluster">
              <BrandLogo size={46} />
              <div>
                <span className="cert-org-label">{organizationName}</span>
                <h4>CHỨNG CHỈ HOÀN THÀNH KHÓA ĐÀO TẠO</h4>
              </div>
            </div>
            <span
              className={`status-pill ${
                credential.status === "ISSUED"
                  ? "tone-valid"
                  : credential.status === "REVOKED"
                    ? "tone-danger"
                    : "tone-warn"
              }`}
            >
              {credentialStatusLabels[credential.status]}
            </span>
          </div>

          <div className="certificate-sheet-body">
            <div className="cert-main-info">
              <p className="cert-intro">Chứng nhận học viên:</p>
              <h2 className="cert-learner-name">{credential.holder}</h2>
              <p className="cert-learner-code">
                Mã học viên: <strong>{credential.subjectRef}</strong>
              </p>
              <p className="cert-course-line">Đã hoàn thành chương trình đào tạo:</p>
              <h3 className="cert-course-title">{credential.course}</h3>

              <div className="cert-metrics-row">
                <div>
                  <span>Mã học phần</span>
                  <strong>{credential.courseCode}</strong>
                </div>
                <div>
                  <span>Kết quả đạt được</span>
                  <strong>{credential.score}</strong>
                </div>
                <div>
                  <span>Ngày cấp</span>
                  <strong>{formatDateTime(credential.issuedAt)}</strong>
                </div>
                <div>
                  <span>Hiệu lực đến</span>
                  <strong>
                    {credential.expiresAt ? formatDateTime(credential.expiresAt) : "Không thời hạn"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="cert-qr-box">
              <code>{credential.code}</code>
              <small>Mã định danh tra cứu tại Cổng Xác thực</small>
            </div>
          </div>

          <div className="certificate-sheet-foot">
            <div>
              <span>Payload Digest (JCS SHA-256)</span>
              <code>{credential.payloadDigest}</code>
            </div>
            <div>
              <span>Merkle Root On-chain</span>
              <code>{credential.merkleRoot}</code>
            </div>
            <div>
              <span>Giao dịch EVM (TxHash)</span>
              <code>{shortHash(credential.txHash, 14, 10)}</code>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const pkg = buildCredentialPackage(state, credential.id);
              if (pkg) downloadCredentialPackageJson(credential.code, pkg);
            }}
          >
            Tải gói Chứng chỉ (.json)
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onClose();
              onSendToVerify(credential);
            }}
          >
            Đưa sang Cổng Xác thực Công khai →
          </button>
        </div>
      </div>
    </div>
  );
}
