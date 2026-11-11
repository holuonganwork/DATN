# ADR-0003 — Dữ liệu cá nhân và file chứng chỉ ở off-chain

**Trạng thái:** Accepted  
**Ngày:** 2026-11-12

## Bối cảnh

Tên học viên, kết quả, PDF và hồ sơ đào tạo là dữ liệu nghiệp vụ có thể cần sửa quyền truy cập hoặc xóa theo chính sách lưu trữ. Blockchain công khai không phù hợp để lưu dữ liệu này.

## Quyết định

Blockchain chỉ lưu issuer ID, ví được ủy quyền, batch ID, Merkle root, thời điểm/trạng thái phát hành, leaf bị thu hồi và event. PostgreSQL/object storage giữ payload, PDF, proof, hồ sơ học viên, quy trình phê duyệt và audit.

Payload được băm trước khi tạo leaf. Hash chứng minh tính toàn vẹn của dữ liệu đã biết; nó không tự xác thực người xuất trình hoặc chứng chỉ ngoài hệ thống.

## Hệ quả

- Verifier cần gói credential và RPC để kiểm tra độc lập.
- Cần chính sách quyền đọc và log không chứa PII thừa.
- Mất object storage không làm thay đổi bằng chứng on-chain, nhưng có thể làm thiếu PDF để kiểm tra hash; báo cáo phải thể hiện bước đó là `UNAVAILABLE`.
