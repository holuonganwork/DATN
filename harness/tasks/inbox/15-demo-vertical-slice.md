# T-015 — Prototype vertical slice không database

**Trạng thái:** Draft  
**Mục tiêu:** Dựng một demo React/TypeScript chạy local để kiểm tra trải nghiệm phát hành, xác minh và thu hồi chứng chỉ trước khi triển khai database.

## Phạm vi

- State nằm trong memory, reset được bằng nút trên giao diện.
- Mô phỏng batch `DRAFT → VALIDATED → APPROVED → FROZEN → CONFIRMED`.
- Issuer xem chứng chỉ mẫu, mô phỏng publish, thu hồi một credential.
- Verifier nhập mã, kiểm tra hash/Merkle/revocation ở dạng mock và thấy kết quả rõ ràng.
- Có audit log trong phiên chạy.

## Không làm

- Database, API thật, private key, ví thật, RPC thật, PDF upload hoặc dữ liệu cá nhân thật.
- Smart contract, authentication production hoặc persistence.

## Tiêu chí chấp nhận

Người dùng có thể chạy app local, đi qua luồng publish mock, xác minh credential hợp lệ, bật tình huống dữ liệu bị sửa và thu hồi credential; mỗi thao tác cập nhật trạng thái và audit log hiển thị trên UI.
