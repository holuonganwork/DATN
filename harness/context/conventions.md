# Quy ước xuyên suốt

- Không lưu toàn bộ thông tin cá nhân hoặc file PDF lên blockchain công khai.
- Không coi transaction hash là thành công nếu chưa kiểm tra receipt, event, chain ID, contract, issuer, batch và Merkle root.
- Khi RPC không đọc được trạng thái bắt buộc, verifier trả về `Chưa thể xác minh đầy đủ`.
- TypeScript và Solidity phải dùng cùng quy tắc chuẩn hóa JSON, mã hóa và tạo leaf.
- Payload không chứa proof hoặc transaction hash dùng để tạo Merkle root.
- Backend không giữ private key của issuer; wallet issuer trực tiếp ký transaction.
- Các thao tác phát hành, thu hồi và đồng bộ phải có idempotency hoặc cơ chế chống tạo bản ghi trùng.
- Không đánh dấu task hoàn thành nếu chưa có bằng chứng: mã nguồn, migration, test, ảnh chụp hoặc báo cáo đo.
