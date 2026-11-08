# Giai đoạn 07 — Verifier độc lập

**Thời lượng:** Tuần 5–7  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Cho phép bên xác minh kiểm tra gói chứng chỉ qua RPC mà không phụ thuộc vào trạng thái API nội bộ.

## Trình tự xác minh

1. Kiểm tra cấu trúc gói JSON.
2. Kiểm tra schema và giới hạn dữ liệu.
3. Kiểm tra chain ID và registry address trong trust configuration.
4. Chuẩn hóa payload và tính lại digest.
5. Tạo lại leaf.
6. Kiểm tra Merkle proof.
7. Đọc root từ blockchain.
8. Đối chiếu issuer và batch.
9. Kiểm tra thời hạn.
10. Kiểm tra trạng thái thu hồi.
11. Nếu có PDF, tính SHA-256 và đối chiếu.
12. Trả báo cáo riêng cho từng phép kiểm tra.

## Trạng thái kết quả

- VALID: mọi bước bắt buộc đều đạt.
- INVALID: có bằng chứng chắc chắn bị sai hoặc bị sửa.
- INCOMPLETE: RPC/API không cung cấp đủ trạng thái để kết luận.

Không chuyển INCOMPLETE thành VALID.

## Checklist

- [ ] Tạo verifier-sdk dùng credential-core.
- [ ] Tạo CLI nhận file JSON và tùy chọn PDF.
- [ ] Tạo verifier-web độc lập.
- [ ] Cho verifier đọc RPC trực tiếp.
- [ ] Kiểm tra trusted chain và registry.
- [ ] Kiểm tra issuer, batch, root và proof.
- [ ] Kiểm tra expiresAt và revoked.
- [ ] Kiểm tra hash PDF.
- [ ] Hiển thị báo cáo từng bước.
- [ ] Kiểm thử JSON đổi thứ tự thuộc tính.
- [ ] Kiểm thử tên tiếng Việt.
- [ ] Kiểm thử proof sai, batch khác, sai mạng và RPC timeout.
- [ ] Kiểm thử khi API backend dừng nhưng RPC còn hoạt động.

## Đầu ra

- verifier-sdk.
- verifier-cli.
- verifier-web hoặc trang xác minh tách biệt.
- Schema kết quả xác minh.
- Bộ fixture hợp lệ và không hợp lệ.

## Tiêu chí hoàn thành

CLI xác minh được một gói hợp lệ chỉ bằng JSON, cấu hình tin cậy và RPC; phát hiện được sửa payload/PDF; trả INCOMPLETE khi không đọc được trạng thái bắt buộc.
