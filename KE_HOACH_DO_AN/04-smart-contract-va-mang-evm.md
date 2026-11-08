# Giai đoạn 04 — Smart contract và mạng EVM

**Thời lượng:** Tuần 2–4  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Có contract tối thiểu để đăng ký issuer, phát hành batch và thu hồi credential.

## Mô tả

Viết, kiểm thử và triển khai contract bằng Solidity, OpenZeppelin và Foundry. Có thể bắt đầu bằng Anvil rồi triển khai bản demo lên Base Sepolia nếu cần.

## Chức năng MVP

- registerIssuer.
- authorizeIssuerWallet.
- publishBatch.
- getBatch.
- revokeCredential.
- isRevoked.

## Quy tắc bắt buộc

- Ví chưa được ủy quyền không được phát hành.
- Issuer bị vô hiệu hóa không được phát hành batch mới.
- Batch đã phát hành không đổi Merkle root.
- Proof sai và batch không tồn tại bị từ chối.
- Issuer này không được thu hồi credential của issuer khác.
- Thao tác quan trọng phải phát event.

## Checklist

- [ ] Khởi tạo Foundry project.
- [ ] Viết contract và custom errors.
- [ ] Thiết kế quyền quản trị và quyền issuer.
- [ ] Viết event cho issuer, wallet, batch và revocation.
- [ ] Viết unit test cho luồng đúng.
- [ ] Viết test quyền truy cập.
- [ ] Viết test proof sai và proof khác batch.
- [ ] Viết fuzz/invariant test phù hợp.
- [ ] Kiểm tra chain ID và địa chỉ registry trong cấu hình.
- [ ] Compile contract và sinh ABI.
- [ ] Deploy lên Anvil.
- [ ] Chạy test vector chung với credential-core.
- [ ] Deploy bản demo lên Base Sepolia nếu được chọn.

## Đầu ra

- Source contract.
- ABI và deployment manifest.
- Test contract.
- Script deploy và seed dữ liệu.
- Địa chỉ contract theo từng mạng.

## Tiêu chí hoàn thành

Một issuer được ủy quyền có thể publish batch; receipt và event được đọc đúng; issuer khác không thể can thiệp; có thể revoke một leaf và đọc được trạng thái thu hồi.

## Rủi ro cần tránh

- Dùng txHash làm trạng thái thành công.
- Cho phép thay root sau khi publish.
- Hash payload khác với credential-core.
- Gắn cố định private key thật trong script deploy.
