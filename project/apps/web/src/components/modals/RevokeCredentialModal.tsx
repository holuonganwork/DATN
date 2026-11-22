import type { FormEvent } from "react";
import type { Credential } from "../../domain";

interface RevokeCredentialModalProps {
  target: Credential;
  reasonText: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function RevokeCredentialModal({
  target,
  reasonText,
  onReasonChange,
  onClose,
  onSubmit,
}: RevokeCredentialModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal-sheet" onSubmit={onSubmit}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">THU HỒI CHỨNG CHỈ ON-CHAIN (UC-07)</span>
            <h3>Thu hồi chứng chỉ {target.code}</h3>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Đóng ✕
          </button>
        </div>

        <p className="modal-lead">
          Hành động thu hồi sẽ ghi nhận trạng thái <code>REVOKED</code> lên hợp đồng thông minh cho
          học viên <strong>{target.holder}</strong>. Mọi lần tra cứu sau thời điểm này sẽ trả về
          cảnh báo đã thu hồi.
        </p>

        <label className="form-field">
          <span>Lý do thu hồi chính thức (bắt buộc)</span>
          <textarea
            rows={3}
            value={reasonText}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Nhập lý do thu hồi chứng chỉ..."
            required
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Giữ nguyên hiệu lực
          </button>
          <button type="submit" className="btn-danger">
            Xác nhận Thu hồi On-chain
          </button>
        </div>
      </form>
    </div>
  );
}
