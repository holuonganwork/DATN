# Giai đoạn 09 — PDF, cổng học viên và chia sẻ

**Thời lượng:** Tuần 7–8  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Phân phối chứng chỉ và bảo đảm file PDF có thể được kiểm tra toàn vẹn.

## Mô tả

Xây PDF từ template hoặc tiếp nhận PDF theo quyết định ở giai đoạn 01. PDF được lưu trong object storage riêng tư; chỉ lưu SHA-256 trong payload.

## Phạm vi MVP

- Tạo hoặc tải PDF cuối cùng.
- Tính và lưu PDF SHA-256.
- Tạo gói JSON chứa payload, anchor và proof.
- Học viên tải JSON/PDF.
- Tạo liên kết chia sẻ có thời hạn nếu còn đủ thời gian.

## Checklist

- [ ] Chốt template hoặc quy trình upload PDF.
- [ ] Đảm bảo PDF cuối cùng không thay đổi sau khi freeze.
- [ ] Tính SHA-256 trước khi tạo leaf.
- [ ] Lưu file trong object storage riêng tư.
- [ ] Tạo package JSON đúng schema.
- [ ] Gắn QR/link tới verifier.
- [ ] Phân quyền tải file theo issuer/holder.
- [ ] Tạo cổng học viên tối thiểu.
- [ ] Thêm liên kết có thời hạn nếu thuộc MVP.
- [ ] Kiểm thử sửa một byte trong PDF.
- [ ] Không đưa PDF hoặc thông tin cá nhân đầy đủ lên chain.

## Đầu ra

- PDF mẫu.
- Gói JSON hoàn chỉnh.
- Trang tải chứng chỉ.
- Cơ chế kiểm tra hash PDF.

## Tiêu chí hoàn thành

PDF gốc được xác minh thành công; PDF bị sửa bị phát hiện; gói JSON không chứa transaction hash trong payload tạo root; quyền tải file được kiểm soát.
