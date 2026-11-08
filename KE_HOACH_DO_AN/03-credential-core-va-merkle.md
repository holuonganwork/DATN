# Giai đoạn 03 — Credential core, hash và Merkle

**Thời lượng:** Tuần 2  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Tạo lõi dữ liệu xác định, có thể dùng độc lập với web app và smart contract.

## Mô tả

Xây dựng package dùng chung cho chuẩn hóa payload, hash PDF, payload digest, leaf, Merkle root và proof. Có thể hoàn thành phần lớn giai đoạn này trước khi compile smart contract.

## Quy tắc cần chốt

- Chuẩn hóa JSON bằng JCS.
- Quy định xử lý Unicode và tên tiếng Việt.
- Quy định kiểu số, ngày giờ và timezone.
- 'payloadDigest = Keccak256(UTF8(JCS(payload)))'.
- Leaf ràng buộc với chainId, registryAddress, issuerId, batchId và payloadDigest.
- Không đưa proof hoặc transaction hash vào payload tạo root.

## Checklist

- [ ] Tạo package credential-core.
- [ ] Định nghĩa TypeScript types cho payload, anchor và proof.
- [ ] Cài đặt JCS và kiểm tra thứ tự thuộc tính.
- [ ] Quy định và kiểm thử Unicode tiếng Việt.
- [ ] Tính SHA-256 cho PDF.
- [ ] Tính payload digest bằng Keccak256.
- [ ] Tạo leaf theo một quy tắc duy nhất.
- [ ] Tạo Merkle tree bằng StandardMerkleTree.
- [ ] Sinh proof cho từng credential.
- [ ] Kiểm tra proof đúng, proof sai và proof thuộc batch khác.
- [ ] Tạo test vector JSON dùng chung cho TypeScript và Solidity.
- [ ] Kiểm tra batch 1, 10, 100, 1.000 và 10.000 leaf.

## Đầu ra

- Package credential-core.
- Schema gói JSON.
- Test vector và fixture.
- Tài liệu quy tắc mã hóa.
- Hàm tạo và kiểm tra proof.

## Tiêu chí hoàn thành

Đổi thứ tự thuộc tính JSON không làm thay đổi digest; sửa một trường làm thay đổi leaf; proof sai hoặc proof của batch khác bị từ chối; kết quả TypeScript khớp với kết quả Solidity sau khi contract sẵn sàng.

## Lưu ý

Merkle root chưa cần ghi lên chain ở giai đoạn này, nhưng quy tắc tạo root phải được cố định trước khi xây quy trình đóng băng batch.
