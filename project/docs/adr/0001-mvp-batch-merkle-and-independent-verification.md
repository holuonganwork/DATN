# ADR-0001 — MVP phát hành theo batch, xác minh độc lập

**Trạng thái:** Accepted  
**Ngày:** 2026-11-12

## Bối cảnh

Ghi hash từng chứng chỉ lên chain làm chi phí tăng theo số chứng chỉ và khiến verifier phụ thuộc vào API. MVP cần chứng minh phát hành số lượng lớn, kiểm tra file bị sửa và vẫn xác minh được khi API dừng.

## Quyết định

Mỗi batch tạo một Merkle root. Credential giữ proof riêng; leaf ràng buộc chain, registry, issuer, batch và payload digest. Verifier có thể đọc root/trạng thái từ RPC mà không cần backend.

PII, PDF, payload đầy đủ và audit log ở off-chain. Thu hồi vẫn ghi trạng thái riêng theo `batchId + leaf`.

## Hệ quả

- Chi phí publish không tăng tuyến tính theo số credential trong batch.
- Proof phải được chuẩn hóa và kiểm thử chéo TypeScript/Solidity.
- Gói credential phụ thuộc vào root và anchor tin cậy; đổi batch/root làm proof không hợp lệ.
- Cần worker kiểm tra receipt/event và đọc bù.
- MVP không bao gồm selective disclosure hoặc W3C VC đầy đủ.
