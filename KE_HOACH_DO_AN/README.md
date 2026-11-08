# Kế hoạch triển khai đồ án

Thư mục này chia đồ án trong DE_TAI.md thành các giai đoạn có thể triển khai tuần tự. Mỗi giai đoạn có mô tả, mục tiêu, đầu vào, đầu ra, checklist và tiêu chí hoàn thành.

## Cách sử dụng

1. Làm theo thứ tự từ giai đoạn 01 đến 11.
2. Trước khi bắt đầu một giai đoạn, cập nhật trạng thái thành 'Đang thực hiện'.
3. Đánh dấu checklist sau khi có bằng chứng cụ thể: mã nguồn, migration, test, ảnh chụp hoặc báo cáo đo.
4. Nếu phải cắt phạm vi, giữ các mục có nhãn 'MVP' và chuyển mục 'Mở rộng' sang hướng phát triển.
5. Không đánh dấu một giai đoạn hoàn thành nếu tiêu chí hoàn thành chưa đạt.

## Bản đồ giai đoạn

| Giai đoạn | Nội dung | Thời lượng dự kiến | Kết quả chính |
| --- | --- | --- | --- |
| 01 | Khởi động, phạm vi và tiêu chí chấp nhận | Tuần 1 | Đặc tả thống nhất |
| 02 | Kiến trúc, dữ liệu và trạng thái nghiệp vụ | Tuần 1–2 | Thiết kế có thể triển khai |
| 03 | Credential core, hash và Merkle | Tuần 2 | Gói lõi độc lập với blockchain |
| 04 | Smart contract và mạng EVM | Tuần 2–4 | Contract chạy được và có test |
| 05 | Backend và quy trình phát hành | Tuần 3–5 | API phát hành batch end-to-end |
| 06 | Frontend và kết nối ví | Tuần 5–6 | Giao diện cho admin/issuer |
| 07 | Verifier độc lập | Tuần 5–7 | CLI/web xác minh qua RPC |
| 08 | Worker, indexer và phục hồi lỗi | Tuần 7–8 | Đồng bộ transaction/event tin cậy |
| 09 | PDF, cổng học viên và chia sẻ | Tuần 7–8 | Phân phối chứng chỉ |
| 10 | Kiểm thử, benchmark và quan sát | Tuần 9 | Số liệu và bằng chứng |
| 11 | Demo, báo cáo và bàn giao | Tuần 10 | Sản phẩm có thể trình bày |

## Nguyên tắc xuyên suốt

- Blockchain chỉ lưu bằng chứng phát hành, không lưu toàn bộ thông tin cá nhân hoặc PDF.
- Không coi transaction hash là bằng chứng thành công nếu chưa kiểm tra receipt, event, chain ID, contract, issuer, batch và Merkle root.
- Khi RPC không đọc được trạng thái bắt buộc, verifier trả 'Chưa thể xác minh đầy đủ'.
- TypeScript và Solidity phải dùng cùng quy tắc chuẩn hóa, mã hóa và tạo leaf.
- Backend không giữ private key của issuer.
- Mọi thay đổi phạm vi phải ghi lại trong phần quyết định của giai đoạn liên quan.
