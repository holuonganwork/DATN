# ADR-0004 — Xây dựng Backend nghiệp vụ off-chain trước khi tích hợp Blockchain

**Trạng thái:** Accepted  
**Ngày:** 2026-11-14

## Bối cảnh

Frontend (`project/apps/web`) đã được xây dựng hoàn chỉnh về giao diện nhưng hiện lưu trữ tạm qua `localStorage` và chưa có Backend thực. Nhằm hoàn thiện luồng nghiệp vụ CRUD cốt lõi (tổ chức, người dùng, khóa học, học viên, quy trình duyệt/đóng băng batch, thu hồi, cấp lại, xác thực công khai và audit) trước khi triển khai smart contract và EVM adapter (`T-004`, `T-005`), nhóm quyết định xây dựng trước tầng Backend off-chain (`T-023`).

## Quyết định

1. **Tách lớp phát hành qua `IssuancePort`**: Mọi thao tác phát hành batch (`publish`) và thu hồi chứng chỉ (`revoke`) trong `apps/api` đi qua interface `IssuancePort`. Đợt đầu (`T-023`) sử dụng `OffChainIssuanceAdapter` để chuyển trạng thái `FROZEN → PENDING_CHAIN → CONFIRMED` và `PREPARED → ISSUED` / `ISSUED → REVOKED` trực tiếp trong PostgreSQL. Khi tích hợp blockchain ở `T-005`, chỉ thay thế adapter (`BlockchainIssuanceAdapter`) mà không thay đổi controller, state machine hay response contract.
2. **Tính chuẩn hóa và Merkle tree thật ngay từ đầu**: Module thuần TypeScript `credential-core` thực hiện chuẩn hóa Unicode NFC + JCS (RFC 8785), tính `payloadDigest = keccak256`, tạo leaf và Merkle root/proof bằng `@openzeppelin/merkle-tree`.
3. **Ngữ cảnh anchor giữ chỗ từ cấu hình**: Để giữ nguyên cấu trúc gói `CredentialPackage`, leaf vẫn ràng buộc `ANCHOR_CHAIN_ID` (mặc định `31337`) và `ANCHOR_REGISTRY_ADDRESS` (mặc định `0x0000000000000000000000000000000000000000`). Chứng chỉ phát hành ở giai đoạn off-chain phục vụ demo/kiểm thử nội bộ và sẽ không tự động xác thực lại được on-chain sau khi deploy địa chỉ contract thật.
4. **Trạng thái kiểm tra `SKIPPED`**: Ở chế độ off-chain và chưa xử lý PDF, bước `on_chain_anchor` và `pdf_sha256` trong báo cáo xác thực trả về `SKIPPED` thay vì `UNAVAILABLE` để kết quả hợp lệ vẫn trả về `VALID`. Frontend sẽ bổ sung trạng thái `SKIPPED` trong task kết nối API sau.

## Hệ quả

- Cho phép vận hành đầy đủ hệ thống nghiệp vụ, kiểm thử E2E trên PostgreSQL thật và chuẩn bị sẵn Swagger contract để nối Frontend.
- Giữ nguyên ranh giới module và `IssuancePort` để nâng cấp sang EVM không gây đứt gãy API.
