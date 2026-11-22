# Quyết định 0002 — Phạm vi blockchain

**Trạng thái:** Đề xuất, cần chốt trong giai đoạn 01

## Quyết định

Blockchain chỉ lưu bằng chứng phát hành: issuer ID, ví được ủy quyền, batch ID, Merkle root, thời điểm phát hành, trạng thái batch, trạng thái thu hồi và event. Payload đầy đủ, PDF, thông tin cá nhân và nhật ký nghiệp vụ vẫn ở hệ thống off-chain.

Mạng phát triển là Anvil. Base Sepolia chỉ được dùng cho bản demo khi chain ID, registry address và RPC đã được cấu hình tin cậy.

## Ràng buộc

- Backend không giữ private key của issuer.
- Ví chưa được ủy quyền hoặc issuer đã vô hiệu hóa không được phát hành batch.
- Batch đã phát hành không được đổi Merkle root.
- Chỉ đúng issuer mới được thu hồi credential của mình.
- Verifier phải kiểm tra receipt, event, chain, contract, issuer, batch, root và trạng thái thu hồi.

## Ngoài phạm vi

MVP không bao gồm nhiều blockchain đồng thời, mobile wallet hoàn chỉnh, selective disclosure, zero-knowledge proof hoặc cơ chế nâng cấp contract phức tạp.
