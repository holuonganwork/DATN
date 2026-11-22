import type { PublishIntent } from "../../domain";
import { shortHash } from "../../services";

interface PublishBatchModalProps {
  intent: PublishIntent;
  onClose: () => void;
  onSignAndSubmit: () => void;
}

export function PublishBatchModal({
  intent,
  onClose,
  onSignAndSubmit,
}: PublishBatchModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-sheet">
        <div className="modal-header">
          <div>
            <span className="eyebrow">CHỮ KÝ SỐ VÍ ĐƠN VỊ ĐÀO TẠO (UC-05)</span>
            <h3>Xác nhận ký giao dịch neo Merkle Root lên Blockchain</h3>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Đóng ✕
          </button>
        </div>

        <p className="modal-lead">
          Hệ thống không giữ khóa bí mật (private key) trên máy chủ. Giao dịch dưới đây được đóng
          gói theo chuẩn ABI để người có thẩm quyền ký trực tiếp bằng ví EVM đã ủy quyền.
        </p>

        <div className="kv-list">
          <div className="kv-row">
            <span>Mạng đích (Chain ID)</span>
            <strong>Chain ID {intent.chainId}</strong>
          </div>
          <div className="kv-row">
            <span>Hợp đồng thông minh</span>
            <code>{intent.registryAddress}</code>
          </div>
          <div className="kv-row">
            <span>Mã lô (batchId)</span>
            <code>{intent.batchId}</code>
          </div>
          <div className="kv-row">
            <span>Merkle Root (bytes32)</span>
            <code>{intent.merkleRoot}</code>
          </div>
          <div className="kv-row">
            <span>Số lượng chứng chỉ</span>
            <strong>{intent.entryCount} chứng chỉ</strong>
          </div>
          <div className="kv-row">
            <span>Ví ký đang kết nối</span>
            <code>{intent.walletAddress}</code>
          </div>
          <div className="kv-row">
            <span>Calldata ABI Digest</span>
            <code>{shortHash(intent.calldata, 14, 10)}</code>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Hủy bỏ
          </button>
          <button type="button" className="btn-primary" onClick={onSignAndSubmit}>
            Ký bằng Ví Đơn vị & Neo On-chain
          </button>
        </div>
      </div>
    </div>
  );
}
