# Bối cảnh đồ án

Đây là đồ án tốt nghiệp thuần code, do một sinh viên thực hiện trong khoảng 10 tuần. Đề tài thuộc hướng Web App, Smart Contract và Blockchain.

Tên đề tài:

**Xây dựng hệ thống phát hành theo lô, xác thực độc lập và thu hồi chứng chỉ đào tạo đa đơn vị tích hợp Blockchain EVM.**

Đồ án xây dựng một nền tảng cho nhiều trung tâm hoặc tổ chức đào tạo phát hành chứng chỉ điện tử. Chứng chỉ có thể được kiểm tra về nguồn phát hành, tính toàn vẹn dữ liệu, thời hạn và trạng thái thu hồi.

Blockchain chỉ được dùng để lưu bằng chứng phát hành có tính toàn vẹn cao, chẳng hạn thông tin đơn vị cấp, mã lô, Merkle root và trạng thái thu hồi. Không đưa toàn bộ thông tin cá nhân, điểm số hoặc file PDF lên blockchain công khai.

# Vấn đề cần giải quyết

Chứng chỉ có thể bị:

- Giả mạo hoàn toàn.
- Sửa tên, điểm, khóa học hoặc thời hạn.
- Sửa file PDF nhưng giữ nguyên mã QR.
- Sử dụng sau khi đã bị thu hồi hoặc hết hạn.
- Dẫn người xác minh tới website giả.
- Làm giả transaction hash hoặc chỉ gửi một hash mà không có bằng chứng giao dịch hợp lệ.

Hệ thống cần giúp bên xác minh kiểm tra:

1. Chứng chỉ có đúng do một đơn vị đã đăng ký phát hành hay không.
2. Ví blockchain phát hành có được đơn vị đó ủy quyền hay không.
3. Nội dung chứng chỉ có bị thay đổi hay không.
4. Chứng chỉ có thuộc đúng lô phát hành hay không.
5. Merkle proof có hợp lệ hay không.
6. Chứng chỉ còn hạn hay đã hết hạn.
7. Chứng chỉ có bị thu hồi hay không.
8. File PDF người dùng cung cấp có đúng file gốc hay không.
9. Có thể xác minh khi API của nền tảng bị dừng hay không.

Hệ thống không tự chứng minh được:

- Người học có thực sự học hoặc thi hay không.
- Người xuất trình có đúng là người được cấp hay không.
- Đơn vị đào tạo có cấp chứng chỉ đúng nghiệp vụ hay không.
- Một chứng chỉ bên ngoài hệ thống là thật hay giả nếu không có nguồn dữ liệu đáng tin cậy.

Phạm vi MVP chỉ xác minh chứng chỉ do các đơn vị đã đăng ký trong hệ thống phát hành.

# Mục tiêu chính

Đồ án cần xây dựng được:

1. Hệ thống quản lý nhiều đơn vị phát hành chứng chỉ.
2. Quy trình nhập danh sách chứng chỉ, kiểm tra dữ liệu, duyệt và đóng băng lô.
3. Cơ chế phát hành nhiều chứng chỉ bằng một Merkle root.
4. Smart contract quản lý đơn vị cấp, ví được ủy quyền, lô chứng chỉ và thu hồi.
5. Gói JSON chứa dữ liệu chứng chỉ và Merkle proof.
6. Bộ xác minh độc lập chạy trên web hoặc CLI.
7. Cơ chế kiểm tra hash của file PDF.
8. Cơ chế thu hồi riêng từng chứng chỉ.
9. Worker/indexer theo dõi giao dịch và sự kiện blockchain.
10. Cơ chế retry, đọc bù sự kiện, chống trùng và phục hồi sau lỗi.
11. Bộ kiểm thử và benchmark để so sánh với các phương án khác.

# Các tác nhân

## Quản trị viên hệ thống

- Đăng ký tổ chức phát hành.
- Xác minh thông tin tổ chức.
- Quản lý quyền và trạng thái tổ chức.
- Ủy quyền ví blockchain cho tổ chức.

## Đơn vị phát hành

- Tạo khóa học.
- Nhập danh sách người học.
- Chuẩn bị dữ liệu chứng chỉ.
- Duyệt và đóng băng một lô chứng chỉ.
- Ký giao dịch phát hành bằng ví riêng.
- Thu hồi chứng chỉ.
- Cấp lại chứng chỉ với mã mới.

## Học viên

- Nhận gói chứng chỉ JSON.
- Tải file PDF.
- Chia sẻ chứng chỉ cho bên khác.
- Có thể chia sẻ bằng liên kết có thời hạn.

## Bên xác minh

- Tải gói JSON hoặc nhập mã chứng chỉ.
- Cung cấp file PDF nếu muốn kiểm tra toàn vẹn file.
- Nhận báo cáo xác minh riêng từng bước.

## Blockchain/RPC

- Lưu thông tin phát hành.
- Lưu Merkle root.
- Lưu trạng thái thu hồi.
- Phát sinh transaction receipt và event.

## Worker/Indexer

- Theo dõi transaction.
- Đọc receipt và event.
- Đồng bộ dữ liệu blockchain vào database.
- Retry khi RPC hoặc API lỗi.
- Đọc bù các block chưa xử lý.

# Các Use Case chính

## Phát hành lô chứng chỉ

Luồng chính:

1. Đơn vị phát hành tạo một lô.
2. Nhập danh sách người học.
3. Kiểm tra schema, dữ liệu bắt buộc và dữ liệu trùng.
4. Tạo PDF cuối cùng.
5. Tính SHA-256 của từng PDF.
6. Chuẩn hóa payload.
7. Tính payload digest.
8. Tạo leaf cho từng chứng chỉ.
9. Tạo Merkle tree và Merkle root.
10. Tạo proof cho từng chứng chỉ.
11. Người có quyền duyệt lô.
12. Đóng băng dữ liệu và root.
13. Ví của đơn vị phát hành ký hàm `publishBatch`.
14. Backend chờ transaction receipt.
15. Backend kiểm tra chain ID, địa chỉ contract, issuer, batch ID và Merkle root.
16. Kiểm tra event phát hành.
17. Chỉ sau khi giao dịch hợp lệ mới phân phối chứng chỉ.

Không được đánh dấu phát hành thành công chỉ vì frontend gửi lên transaction hash.

## Xác minh chứng chỉ

Verifier thực hiện các bước:

1. Kiểm tra cấu trúc gói JSON.
2. Kiểm tra schema và giới hạn dữ liệu.
3. Kiểm tra chain ID và địa chỉ registry có nằm trong cấu hình tin cậy không.
4. Chuẩn hóa lại payload.
5. Tính lại payload digest.
6. Tạo lại leaf.
7. Kiểm tra Merkle proof.
8. Đọc Merkle root từ blockchain.
9. Đối chiếu issuer và batch.
10. Kiểm tra thời hạn.
11. Kiểm tra trạng thái thu hồi.
12. Nếu có PDF thì tính lại SHA-256 và đối chiếu.
13. Trả báo cáo riêng cho từng phép kiểm tra.

Nếu RPC không phản hồi hoặc không đọc được trạng thái bắt buộc, kết quả phải là:

**“Chưa thể xác minh đầy đủ”**

Không được tự động kết luận chứng chỉ hợp lệ khi còn bước chưa kiểm tra được.

## Thu hồi chứng chỉ

- Thu hồi theo cặp `batchId` và `leaf`.
- Chỉ ví có quyền của đúng tổ chức phát hành mới được thu hồi.
- Proof phải chứng minh chứng chỉ thuộc lô.
- Việc thu hồi trong MVP là một chiều.
- Khi cấp lại, tạo chứng chỉ mới với mã mới và liên kết nghiệp vụ với bản cũ.

# Kiến trúc hệ thống

Sử dụng kiến trúc **modular monolith**, phù hợp với một người thực hiện trong 10 tuần.

Các thành phần:

```text
Web App
  ├── Backend API
  ├── Ví của đơn vị phát hành
  └── Trang xác minh

Backend
  ├── Module tổ chức
  ├── Module khóa học
  ├── Module chứng chỉ
  ├── Module phát hành
  ├── Module thu hồi
  ├── Module chia sẻ
  └── Module xác minh

Worker/Indexer
  ├── Theo dõi transaction
  ├── Đọc receipt/event
  ├── Đồng bộ block
  ├── Retry
  └── Phục hồi dữ liệu

Dữ liệu
  ├── PostgreSQL: dữ liệu nghiệp vụ
  ├── Object Storage riêng tư: PDF, file nhập, gói xuất
  └── Redis/BullMQ: hàng đợi và tác vụ nền

Blockchain EVM
  ├── Issuer registry
  ├── Batch registry
  ├── Merkle root
  ├── Trạng thái thu hồi
  └── Event
```

Backend không giữ private key của đơn vị phát hành. Ví của đơn vị phát hành trực tiếp ký transaction.

# Phân chia dữ liệu

## On-chain

- Issuer ID.
- Địa chỉ ví được ủy quyền.
- Batch ID.
- Merkle root.
- Thời điểm phát hành.
- Trạng thái batch.
- Trạng thái thu hồi.
- Event phát hành và thu hồi.

## Off-chain

- Tài khoản người dùng.
- Thông tin tổ chức.
- Khóa học.
- Hồ sơ người học.
- Danh sách bản nháp.
- Quy trình phê duyệt.
- File PDF.
- Gói JSON.
- Lịch sử thao tác.
- Quyền truy cập.
- Log nghiệp vụ.

Không đưa thông tin cá nhân đầy đủ hoặc file PDF lên blockchain công khai.

# Thiết kế dữ liệu chứng chỉ

Gói chứng chỉ gồm:

```json
{
  "payload": {
    "credentialId": "...",
    "issuerId": "...",
    "holder": "...",
    "courseId": "...",
    "courseName": "...",
    "result": "...",
    "issuedAt": "...",
    "expiresAt": "...",
    "nonce": "...",
    "pdfSha256": "..."
  },
  "anchor": {
    "chainId": 84532,
    "registryAddress": "...",
    "batchId": "...",
    "issuerId": "..."
  },
  "proof": {
    "leaf": "...",
    "path": ["..."],
    "root": "..."
  }
}
```

`proof` và transaction hash không được đưa vào phần payload dùng để tính root, vì có thể tạo ra vòng lặp phụ thuộc.

# Quy trình hash và Merkle

1. Chuẩn hóa payload bằng JSON Canonicalization Scheme.
2. Xác định trước quy tắc xử lý Unicode, tên tiếng Việt, số và ngày giờ.
3. JCS không tự chuẩn hóa Unicode, nên hệ thống phải quy định rõ quy tắc trước khi phát hành.
4. Tính:

```text
payloadDigest = Keccak256(UTF8(JCS(payload)))
```

5. Tạo leaf ràng buộc với:

```text
chainId
registryAddress
issuerId
batchId
payloadDigest
```

6. Dùng `StandardMerkleTree` ở TypeScript.
7. Dùng `MerkleProof` hoặc logic tương ứng trong Solidity.
8. Phải có vector kiểm thử chung giữa TypeScript và Solidity.
9. Cần kiểm thử trường hợp thay đổi thứ tự thuộc tính JSON, tên tiếng Việt, proof sai và proof thuộc batch khác.

# Smart Contract dự kiến

Các hàm chính:

```solidity
registerIssuer(...)
authorizeIssuerWallet(...)
publishBatch(...)
revokeCredential(...)
getBatch(...)
isRevoked(...)
```

Quy tắc bắt buộc:

- Ví không được ủy quyền không được phát hành.
- Tổ chức A không được thu hồi chứng chỉ của tổ chức B.
- Batch đã phát hành không được thay đổi Merkle root.
- Proof sai phải bị từ chối.
- Batch không tồn tại phải bị từ chối.
- Issuer bị vô hiệu hóa không được phát hành batch mới.
- Các thao tác quan trọng phải phát event.

# Công nghệ dự kiến

## Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Kết nối ví.

## Backend

- NestJS.
- TypeScript.
- PostgreSQL.
- Prisma.

## Blockchain

- Solidity.
- OpenZeppelin Contracts.
- Foundry.
- Anvil.
- viem.
- Base Sepolia khi demo.

## Lõi chứng chỉ

- JCS.
- Keccak256.
- SHA-256.
- OpenZeppelin Merkle Tree.
- Merkle proof.

## Tác vụ nền

- Redis.
- BullMQ.
- Worker/indexer.

## Kiểm thử và quan sát

- Foundry unit/fuzz/invariant test.
- Vitest.
- Playwright.
- k6.
- Pino.
- Prometheus.
- Grafana.
- Docker Compose.
- CI.

# Cấu trúc mã nguồn gợi ý

```text
apps/
  web/
  api/
  verifier-web/
  verifier-cli/
  worker/

contracts/
  IssuerRegistry.sol
  CredentialRegistry.sol
  BatchRegistry.sol

packages/
  credential-core/
  verifier-sdk/
  shared-types/
  config/

benchmarks/
  issuance/
  verification/
  recovery/

tests/
  contract/
  api/
  e2e/
  integration/
```

# Phương pháp đánh giá

So sánh ba phương án:

## Phương án A

JSON ký số, khóa công khai và dịch vụ quản lý trạng thái tập trung.

## Phương án B

Ghi hash của từng chứng chỉ trực tiếp lên smart contract.

## Phương án C

Giải pháp đề xuất: phát hành theo lô bằng Merkle root, proof riêng và thu hồi riêng.

Kích thước lô thử nghiệm:

- 1 chứng chỉ.
- 10 chứng chỉ.
- 100 chứng chỉ.
- 1.000 chứng chỉ.
- 10.000 chứng chỉ.

Chỉ số đo:

- Tỷ lệ kiểm tra đúng.
- Số chứng chỉ không hợp lệ nhưng bị chấp nhận.
- Số trường hợp báo đạt khi thiếu bằng chứng.
- Gas phát hành batch.
- Gas trung bình trên mỗi chứng chỉ.
- Gas thu hồi.
- p50 và p95 thời gian xác minh.
- Kích thước gói JSON và proof.
- Thời gian phục hồi worker/indexer.
- Số event bị trùng.
- Số event bị bỏ sót.
- Khả năng xác minh khi API dừng.
- Khả năng phát hiện PDF hoặc JSON bị sửa.

Các tình huống phải kiểm thử:

- Chứng chỉ hợp lệ.
- Sửa tên, điểm hoặc thời hạn.
- Sửa file PDF.
- Sai Merkle proof.
- Proof thuộc batch khác.
- Sai mạng hoặc registry.
- Ví không có quyền.
- Chứng chỉ hết hạn.
- Chứng chỉ đã thu hồi.
- JSON đổi thứ tự thuộc tính.
- Payload có tên tiếng Việt.
- RPC timeout.
- API dừng nhưng RPC còn hoạt động.
- Worker khởi động lại.
- Event được đọc nhiều lần.
- Transaction thất bại.
- Người dùng từ chối ký.

# Kế hoạch 10 tuần

## Tuần 1

- Khảo sát bài toán.
- Đặc tả Use Case.
- Xác định vai trò và phạm vi.
- Thiết kế schema ban đầu.
- Xây dựng kịch bản kiểm thử.

## Tuần 2

- Tìm hiểu EVM, Solidity, Merkle và JCS.
- Xây dựng credential-core.
- Triển khai contract mẫu trên Anvil.
- Kiểm tra hash/leaf giữa TypeScript và Solidity.

## Tuần 3–4

- Hoàn thiện smart contract.
- Xây dựng module tổ chức, khóa học và danh sách người học.
- Xây dựng quy trình duyệt và đóng băng batch.
- Xây dựng API và phân quyền.

## Tuần 5–6

- Kết nối ví.
- Phát hành batch.
- Đối chiếu receipt/event.
- Xây verifier SDK, CLI và trang xác minh.

## Tuần 7–8

- Tạo PDF và QR.
- Xây cổng học viên.
- Xây chức năng chia sẻ.
- Xây worker/indexer.
- Thêm retry, đọc bù và chống trùng.
- Thêm Prometheus/Grafana.

## Tuần 9–10

- Kiểm thử contract và hệ thống.
- Benchmark ba phương án.
- Đo gas, latency, proof size và recovery time.
- Chạy các kịch bản lỗi.
- Hoàn thiện báo cáo, slide và demo.

# Kịch bản demo chính

1. Đơn vị A đăng ký và liên kết ví.
2. Đơn vị A tạo một khóa học.
3. Nhập danh sách 1.000 học viên.
4. Duyệt và phát hành batch.
5. Học viên nhận JSON và PDF.
6. Bên xác minh kiểm tra thành công.
7. Sửa tên hoặc PDF để chứng minh hệ thống phát hiện thay đổi.
8. Thu hồi một chứng chỉ.
9. Kiểm tra chứng chỉ bị thu hồi và các chứng chỉ còn lại.
10. Tắt API nhưng giữ RPC, sau đó dùng CLI để xác minh.
11. Khởi động lại worker để chứng minh khả năng đọc bù và chống tạo bản ghi trùng.

# Giới hạn phạm vi

MVP chưa bao gồm:

- Tương thích đầy đủ với W3C Verifiable Credentials.
- Mobile wallet hoàn chỉnh.
- Selective disclosure.
- Zero-knowledge proof.
- OCR toàn bộ chữ trên ảnh hoặc bản in.
- Xác thực danh tính người cầm chứng chỉ.
- Nhiều blockchain cùng lúc.
- Cơ chế nâng cấp contract phức tạp.
- Kết luận chất lượng đào tạo của tổ chức.
- Mô hình Machine Learning hoặc LLM.
- Dữ liệu huấn luyện.

# Nguyên tắc agent cần tuân thủ

Khi hỗ trợ đồ án này, agent phải:

1. Giữ phạm vi chính là phát hành theo lô, xác minh độc lập và thu hồi chứng chỉ.
2. Phân biệt rõ phần đã triển khai, phần dự kiến và phần mở rộng.
3. Không nói rằng blockchain tự chứng minh người học đã học thật.
4. Không nói rằng hash có thể xác thực mọi chứng chỉ bên ngoài hệ thống.
5. Không đưa dữ liệu cá nhân lên blockchain công khai.
6. Không tin transaction hash nếu chưa kiểm tra receipt, event, chain, contract, issuer, batch và root.
7. Khi RPC lỗi, phải trả trạng thái “chưa thể xác minh đầy đủ”.
8. Giữ nhất quán cách mã hóa giữa TypeScript và Solidity.
9. Ưu tiên tính đúng, khả năng phục hồi và khả năng đo lường.
10. Khi đề xuất tính năng mới, phải kiểm tra xem tính năng đó có nằm trong MVP 10 tuần hay nên đưa vào hướng phát triển.