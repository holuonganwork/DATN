# Giai đoạn 01 — Khởi động, phạm vi và tiêu chí chấp nhận

**Thời lượng:** Tuần 1  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Biến ý tưởng trong DE_TAI.md thành phạm vi có thể kiểm chứng trong 10 tuần.

## Mô tả

Xác định vấn đề, tác nhân, use case, giới hạn MVP và các kịch bản demo. Giai đoạn này giúp tránh mở rộng sang W3C Verifiable Credentials, mobile wallet, zero-knowledge hoặc nhiều blockchain.

## Đầu vào

- DE_TAI.md.
- Các giới hạn thời gian, nhân lực và môi trường demo.
- Quyết định dùng Anvil, Base Sepolia hoặc cả hai.

## Mục tiêu cần đạt

- Chốt vai trò: quản trị viên, đơn vị phát hành, học viên, bên xác minh.
- Chốt luồng phát hành, xác minh, thu hồi và cấp lại.
- Chốt các nội dung thuộc MVP và nội dung để hướng phát triển.
- Viết tiêu chí chấp nhận có thể kiểm thử.

## Checklist

- [ ] Viết use case cho đăng ký issuer và ủy quyền ví.
- [ ] Viết use case nhập, duyệt, đóng băng và phát hành batch.
- [ ] Viết use case tải gói JSON/PDF và xác minh.
- [ ] Viết use case thu hồi và cấp lại bằng mã mới.
- [ ] Ghi rõ những gì blockchain chứng minh và không chứng minh.
- [ ] Chốt chain ID, registry address và RPC tin cậy trong cấu hình.
- [ ] Chốt kịch bản demo 1.000 chứng chỉ.
- [ ] Chốt các kịch bản lỗi bắt buộc.
- [ ] Tạo danh sách rủi ro và phương án giảm rủi ro.

## Đầu ra

- Đặc tả use case.
- Danh sách yêu cầu chức năng và phi chức năng.
- Danh sách MVP và hướng phát triển.
- Bộ kịch bản chấp nhận cho demo.
- Quyết định công nghệ ban đầu.

## Tiêu chí hoàn thành

Một người khác có thể đọc tài liệu và trả lời được: ai sử dụng hệ thống, phát hành thế nào, xác minh thế nào, blockchain lưu gì, và trường hợp nào bị trả về 'Chưa thể xác minh đầy đủ'.

## Quyết định cần ghi lại

- Mạng demo chính.
- Có bắt buộc chia sẻ liên kết có thời hạn trong MVP hay không.
- Mức độ đầy đủ của dashboard và benchmark.
