import type { FormEvent } from "react";
import type { Credential } from "../../domain";

interface ReissueCredentialModalProps {
  target: Credential;
  holderName: string;
  resultText: string;
  expiresAt: string;
  reason: string;
  onHolderNameChange: (value: string) => void;
  onResultTextChange: (value: string) => void;
  onExpiresAtChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function ReissueCredentialModal({
  target,
  holderName,
  resultText,
  expiresAt,
  reason,
  onHolderNameChange,
  onResultTextChange,
  onExpiresAtChange,
  onReasonChange,
  onClose,
  onSubmit,
}: ReissueCredentialModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal-sheet" onSubmit={onSubmit}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">CẤP LẠI CHỨNG CHỈ & LIÊN KẾT LỊCH SỬ (UC-08)</span>
            <h3>Cấp lại từ chứng chỉ gốc {target.code}</h3>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Đóng ✕
          </button>
        </div>

        <p className="modal-lead">
          Dữ liệu đã neo trên blockchain không thể sửa đè. Hệ thống sẽ chuyển chứng chỉ cũ sang
          trạng thái <code>SUPERSEDED</code> và phát hành chứng chỉ mới có trường{" "}
          <code>reissuedFromId</code> trỏ về bản gốc để giữ nguyên chuỗi truy vết.
        </p>

        <div className="form-grid-2">
          <label className="form-field">
            <span>Họ và tên học viên chuẩn hóa</span>
            <input
              value={holderName}
              onChange={(event) => onHolderNameChange(event.target.value)}
              placeholder="Nhập họ tên học viên..."
              required
            />
          </label>
          <label className="form-field">
            <span>Kết quả / Điểm & Xếp loại</span>
            <input
              value={resultText}
              onChange={(event) => onResultTextChange(event.target.value)}
              placeholder="Nhập kết quả / xếp loại..."
              required
            />
          </label>
        </div>

        <div className="form-grid-2">
          <label className="form-field">
            <span>Ngày hết hạn mới (tùy chọn)</span>
            <input
              type="date"
              value={expiresAt}
              onChange={(event) => onExpiresAtChange(event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Lý do cấp lại</span>
            <input
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Nhập lý do cấp lại..."
              required
            />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Hủy bỏ
          </button>
          <button type="submit" className="btn-primary">
            Phát hành Chứng chỉ Cấp lại
          </button>
        </div>
      </form>
    </div>
  );
}
