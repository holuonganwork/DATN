# Giai đoạn 11 — Demo, báo cáo và bàn giao

**Thời lượng:** Tuần 10  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Đóng gói sản phẩm, bằng chứng và câu chuyện demo nhất quán với phạm vi đồ án.

## Kịch bản demo chính

1. Đăng ký đơn vị A và ủy quyền ví.
2. Tạo khóa học.
3. Nhập 1.000 học viên.
4. Kiểm tra, duyệt và freeze batch.
5. Issuer ký publish batch.
6. Receipt/event được xác nhận.
7. Học viên nhận JSON và PDF.
8. Verifier xác minh thành công.
9. Sửa tên hoặc PDF để chứng minh bị phát hiện.
10. Thu hồi một credential.
11. Xác minh credential bị thu hồi và credential còn lại.
12. Tắt API, giữ RPC, xác minh bằng CLI.
13. Khởi động lại worker và chứng minh đọc bù, chống trùng.

## Checklist kỹ thuật

- [ ] Có script cài đặt và chạy local.
- [ ] Có Docker Compose cho database, Redis và app nếu cần.
- [ ] Có seed data và deploy script.
- [ ] Có file cấu hình mẫu không chứa secret thật.
- [ ] Có health check cho API, worker và RPC.
- [ ] Có backup hoặc fixture cho demo.
- [ ] Dọn dữ liệu nhạy cảm khỏi repository.
- [ ] Chạy lại toàn bộ test trước khi khóa phiên bản demo.

## Checklist báo cáo

- [ ] Mô tả vấn đề và giới hạn.
- [ ] Trình bày kiến trúc và phân chia on-chain/off-chain.
- [ ] Giải thích JCS, hash, leaf và Merkle proof.
- [ ] Giải thích smart contract và quyền issuer.
- [ ] Trình bày quy trình receipt/event.
- [ ] Trình bày verifier độc lập và trạng thái INCOMPLETE.
- [ ] Trình bày worker, retry, đọc bù và chống trùng.
- [ ] Trình bày benchmark A/B/C.
- [ ] Nêu giới hạn: không chứng minh người học thật, danh tính người cầm hoặc chất lượng đào tạo.
- [ ] Nêu hướng phát triển ngoài MVP.

## Tiêu chí hoàn thành cuối cùng

- [ ] Demo end-to-end chạy được từ phát hành đến thu hồi.
- [ ] Có ít nhất một luồng xác minh trực tiếp qua RPC.
- [ ] Có bằng chứng phát hiện JSON/PDF bị sửa.
- [ ] Có test và benchmark được lưu lại.
- [ ] Có README hướng dẫn người khác chạy dự án.
- [ ] Không còn chức năng quan trọng chỉ tồn tại dưới dạng mô tả mà chưa có bằng chứng triển khai.

## Bàn giao

- Source code và lịch sử commit.
- ABI, deployment manifest và địa chỉ contract.
- Test report và benchmark data.
- Video hoặc ảnh chụp demo nếu cần.
- Báo cáo, slide và danh sách giới hạn.
