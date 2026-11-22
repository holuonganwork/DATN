# Giai đoạn 05 — Backend và quy trình phát hành

**Thời lượng:** Tuần 3–5  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Hoàn thiện API nghiệp vụ và phát hành batch từ dữ liệu nhập đến receipt hợp lệ.

## Mô tả

Xây NestJS API, Prisma và các module nghiệp vụ. Backend quản lý dữ liệu và quy trình, còn issuer wallet trực tiếp ký transaction.

## Luồng phát hành

1. Tạo batch.
2. Nhập danh sách học viên.
3. Kiểm tra schema, trường bắt buộc và dữ liệu trùng.
4. Tạo hoặc nhận PDF.
5. Tính PDF SHA-256.
6. Chuẩn hóa payload.
7. Tạo digest, leaf, root và proof.
8. Duyệt và đóng băng batch.
9. Gửi publishBatch để issuer wallet ký.
10. Chờ receipt.
11. Kiểm tra chain, contract, issuer, batch, root và event.
12. Chỉ chuyển sang CONFIRMED sau khi mọi kiểm tra đạt.

## Checklist

- [ ] Tạo NestJS modules và Prisma schema.
- [ ] Tạo API tổ chức, khóa học và học viên.
- [ ] Tạo API nhập CSV/JSON có giới hạn kích thước.
- [ ] Kiểm tra dữ liệu trùng và dữ liệu bắt buộc.
- [ ] Tạo batch snapshot khi đóng băng.
- [ ] Tích hợp credential-core.
- [ ] Tạo API approve/freeze.
- [ ] Tạo BlockchainGateway thật và mock gateway.
- [ ] Lưu transaction intent và transaction hash.
- [ ] Kiểm tra receipt, event và chain metadata.
- [ ] Xử lý transaction thất bại hoặc người dùng từ chối ký.
- [ ] Đảm bảo retry không tạo batch trùng.
- [ ] Tạo API thu hồi với batchId và leaf.
- [ ] Ghi audit log cho thao tác quan trọng.

## Đầu ra

- Backend API chạy được.
- Migration và seed data.
- OpenAPI hoặc tài liệu endpoint.
- Luồng phát hành batch end-to-end.
- Luồng thu hồi credential.

## Tiêu chí hoàn thành

Có thể tạo một batch, freeze, ký bằng ví issuer, chờ receipt, kiểm tra event và lưu trạng thái CONFIRMED. Nếu receipt không hợp lệ, batch không được phân phối.
