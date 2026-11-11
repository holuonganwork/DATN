# Đặc tả use case MVP

## Mục tiêu và ranh giới

MVP phục vụ một hệ thống có nhiều đơn vị phát hành chứng chỉ đào tạo. Luồng bắt buộc là:

`đăng ký issuer → chuẩn bị batch → duyệt/đóng băng → phát hành on-chain → phân phối gói → xác minh độc lập → thu hồi hoặc cấp lại`.

Blockchain chỉ chứng minh bằng chứng phát hành và trạng thái đã ghi nhận. Hệ thống không chứng minh người cầm chứng chỉ là đúng người được cấp, người học đã học thật, hay chất lượng đào tạo của tổ chức.

Liên kết chia sẻ có thời hạn được để sau MVP. Trong MVP, học viên nhận gói JSON/PDF và mã hoặc QR dẫn tới trang xác minh.

## Tác nhân

| Tác nhân | Trách nhiệm |
| --- | --- |
| Quản trị viên hệ thống | Đăng ký, xác minh, khóa/mở tổ chức và ủy quyền ví issuer. |
| Người vận hành issuer | Quản lý khóa học, học viên, batch; chuẩn bị và theo dõi phát hành. |
| Người phê duyệt issuer | Duyệt dữ liệu và đóng băng Merkle root trước khi ký giao dịch. |
| Ví issuer | Ký giao dịch publish/revoke; private key không đi qua backend. |
| Học viên | Nhận và lưu gói chứng chỉ, PDF, mã/QR. |
| Verifier | Kiểm tra gói, hash, proof, nguồn phát hành, hạn và thu hồi. |
| Worker/indexer | Theo dõi receipt/event, đồng bộ, retry và đọc bù. |
| Blockchain/RPC | Lưu anchor phát hành, root và trạng thái thu hồi. |

## Danh sách use case đã chốt

| Mã | Use case | Tác nhân chính | MVP |
| --- | --- | --- | --- |
| UC-01 | Đăng ký tổ chức và ủy quyền ví | Quản trị viên | Có |
| UC-02 | Quản lý khóa học và hồ sơ học viên | Issuer | Có |
| UC-03 | Tạo và nhập batch | Issuer | Có |
| UC-04 | Kiểm tra, duyệt và đóng băng batch | Issuer/phê duyệt | Có |
| UC-05 | Ký và phát hành batch | Ví issuer, worker | Có |
| UC-06 | Phân phối gói chứng chỉ | Issuer/học viên | Có |
| UC-07 | Xác minh độc lập | Verifier | Có |
| UC-08 | Thu hồi một chứng chỉ | Issuer, ví issuer | Có |
| UC-09 | Cấp lại chứng chỉ | Issuer | Có |
| UC-10 | Đồng bộ và phục hồi event | Worker/indexer | Có |
| UC-11 | Chia sẻ liên kết có thời hạn | Học viên | Sau MVP |

## Luồng chi tiết

### UC-01 — Đăng ký tổ chức và ủy quyền ví

1. Quản trị viên tạo tổ chức với tên pháp lý, tên hiển thị và thông tin xác minh.
2. Tổ chức ở trạng thái `PENDING` cho đến khi quản trị viên xác minh.
3. Khi được kích hoạt, quản trị viên thêm đúng một ví đang hoạt động theo `chainId + address`; lịch sử ví cũ vẫn được lưu khi thay thế.
4. Hệ thống ghi lịch sử ủy quyền; ví bị khóa hoặc đã thay thế không thể ký phát hành hoặc thu hồi.
5. Chỉ tổ chức `ACTIVE` và ví `AUTHORIZED` được thực hiện UC-05/UC-08.

Ngoại lệ: tổ chức trùng định danh, địa chỉ sai định dạng, chain không tin cậy hoặc ví đã thuộc tổ chức khác đều bị từ chối.

### UC-02 — Quản lý khóa học và hồ sơ học viên

Issuer tạo khóa học có mã ổn định, tên, phiên bản, thời lượng và quy tắc kết quả. Hồ sơ học viên được lưu ngoài blockchain, có mã nội bộ ổn định và trường hiển thị cần thiết cho chứng chỉ.

Mỗi tổ chức chỉ được đọc/sửa dữ liệu của mình. Dữ liệu nhạy cảm phải được giới hạn quyền đọc và không xuất hiện trong log hoặc event blockchain.

### UC-03 — Tạo và nhập batch

1. Issuer tạo batch `DRAFT` gắn với một khóa học.
2. Issuer nhập danh sách học viên/kết quả từ biểu mẫu hoặc tệp được kiểm tra schema.
3. Hệ thống tạo các dòng batch, phát hiện dòng trùng, thiếu trường bắt buộc hoặc học viên không hợp lệ.
4. Sửa lỗi vẫn giữ cùng batch khi chưa đóng băng; mọi thay đổi có audit log.

### UC-04 — Kiểm tra, duyệt và đóng băng batch

1. Hệ thống chuẩn hóa dữ liệu, tạo payload cho từng chứng chỉ và tính `pdfSha256` nếu đã có PDF.
2. Hệ thống tạo `payloadDigest`, leaf, Merkle tree, root và proof.
3. Batch chuyển `DRAFT → VALIDATED` khi tất cả dòng hợp lệ.
4. Người có quyền phê duyệt chuyển `VALIDATED → APPROVED`.
5. Người phê duyệt đóng băng batch: `APPROVED → FROZEN`.
6. Sau khi `FROZEN`, payload, thứ tự leaf, root và file gốc không được sửa. Sửa dữ liệu phải tạo batch mới.

### UC-05 — Ký và phát hành batch

1. API tạo publish intent chứa chain, registry, batch ID, root và idempotency key.
2. Ví issuer kiểm tra dữ liệu hiển thị và ký/gửi giao dịch.
3. API chỉ lưu `txHash` ở trạng thái chờ; worker chờ receipt.
4. Worker kiểm tra chain ID, contract, issuer, batch ID, root, receipt thành công và event phát hành.
5. Chỉ khi tất cả kiểm tra đạt, batch chuyển `PENDING_CHAIN → CONFIRMED` và credential được phân phối.
6. Receipt/event lỗi hoặc không khớp làm giao dịch `FAILED`; không được đánh dấu phát hành chỉ vì có txHash.

### UC-06 — Phân phối gói chứng chỉ

Sau khi batch `CONFIRMED`, mỗi credential có thể được xuất thành gói JSON chứa `payload`, `anchor`, `proof` và PDF riêng tư. Mã chứng chỉ và QR chỉ trỏ tới dữ liệu xác minh, không nhúng PII vào URL công khai.

### UC-07 — Xác minh độc lập

Verifier có thể nhập mã, tải gói JSON hoặc cung cấp thêm PDF.

1. Kiểm tra schema, giới hạn kích thước và cấu hình tin cậy.
2. Chuẩn hóa payload, tính lại digest và leaf.
3. Kiểm tra proof với root trong anchor.
4. Đọc issuer, batch, root và trạng thái thu hồi từ RPC tin cậy.
5. Kiểm tra thời hạn và, nếu có PDF, đối chiếu SHA-256.
6. Trả báo cáo từng bước.

Kết quả cuối cùng:

- `VALID`: mọi bước bắt buộc đạt, chưa hết hạn và chưa thu hồi.
- `INVALID`: dữ liệu, proof, nguồn phát hành hoặc PDF không khớp.
- `REVOKED`: bằng chứng hợp lệ nhưng credential đã bị thu hồi.
- `EXPIRED`: bằng chứng hợp lệ nhưng đã quá hạn.
- `NOT_FOUND`: không tìm thấy anchor/batch hợp lệ.
- `INDETERMINATE`: RPC hoặc trạng thái bắt buộc không đọc được; hiển thị “Chưa thể xác minh đầy đủ”.

Verifier không kết luận danh tính người xuất trình.

### UC-08 — Thu hồi một chứng chỉ

1. Issuer chọn credential và nhập lý do tối thiểu.
2. API kiểm tra credential thuộc tổ chức, batch đã `CONFIRMED` và chưa `REVOKED`.
3. API tạo revoke intent theo `batchId + leaf`.
4. Ví đúng tổ chức ký/gửi; worker kiểm tra receipt và event.
5. Credential chuyển `ISSUED → REVOKED`; thao tác là một chiều trong MVP.

### UC-09 — Cấp lại chứng chỉ

Issuer tạo credential mới với `credentialId` và leaf mới, liên kết `reissuedFromId` tới bản cũ. Bản cũ được đánh dấu `SUPERSEDED` hoặc vẫn `REVOKED` theo nguyên nhân đã ghi; mọi kiểm tra đều truy vết được chuỗi cấp lại.

### UC-10 — Đồng bộ và phục hồi event

Worker ghi nhận cursor theo chain/contract, xử lý event theo khóa `(chainId, contractAddress, txHash, logIndex)`, retry lỗi tạm thời và đọc bù từ block cuối đã xác nhận. Event lặp không tạo bản ghi nghiệp vụ trùng.

## Quy tắc chấp nhận xuyên suốt

- Không có dữ liệu PII hoặc PDF trong transaction/event công khai.
- Không coi transaction hash là thành công nếu thiếu receipt/event phù hợp.
- Mọi thao tác publish/revoke có idempotency key.
- Batch đã xác nhận không đổi root; proof thuộc batch khác bị từ chối.
- Issuer/ví không hợp lệ bị từ chối ở cả API và contract.
- Khi RPC không đủ dữ liệu, verifier trả `INDETERMINATE`, không suy đoán là hợp lệ.
