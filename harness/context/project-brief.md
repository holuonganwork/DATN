# Project Brief

## 1. Tên dự án

**Hệ thống phát hành và xác thực chứng chỉ đào tạo tích hợp blockchain**.

Đây là tài liệu ngữ cảnh cho Codex Agent. Harness chỉ hỗ trợ quá trình phát triển; harness không phải là sản phẩm của dự án.

## 2. Vấn đề

Chứng chỉ đào tạo có thể bị làm giả, chỉnh sửa hoặc sử dụng sau khi đã bị thu hồi. Đơn vị tuyển dụng, cơ sở đào tạo và người sở hữu chứng chỉ cần một cách kiểm tra nhanh tính hợp lệ và tính toàn vẹn của chứng chỉ mà không phải phụ thuộc hoàn toàn vào file PDF do người dùng cung cấp.

## 3. Mục tiêu

Xây dựng một hệ thống mẫu cho phép:

1. Đơn vị đào tạo được đăng ký và được phân quyền phát hành chứng chỉ.
2. Đơn vị hợp lệ phát hành chứng chỉ và ghi nhận bằng chứng toàn vẹn lên blockchain.
3. Người kiểm tra xác thực chứng chỉ bằng mã chứng chỉ, liên kết hoặc QR code.
4. Hệ thống phát hiện chứng chỉ bị sửa đổi.
5. Đơn vị có quyền thu hồi hoặc cấp lại chứng chỉ.
6. Người kiểm tra xem được trạng thái hiện tại và thông tin nguồn phát hành.
7. Dữ liệu nghiệp vụ ngoài blockchain được liên kết nhất quán với bằng chứng trên blockchain.

## 4. Các tác nhân chính

- **System administrator**: quản lý cấu hình và đăng ký đơn vị phát hành.
- **Issuer**: tạo, phát hành, thu hồi và cấp lại chứng chỉ.
- **Certificate holder**: nhận và chia sẻ chứng chỉ.
- **Verifier**: kiểm tra chứng chỉ bằng mã, QR hoặc hash.
- **Blockchain network**: lưu bằng chứng, trạng thái và event cần thiết.

## 5. Luồng nghiệp vụ cốt lõi

### Phát hành

1. Issuer nhập thông tin chứng chỉ.
2. Hệ thống chuẩn hóa dữ liệu và tạo định danh chứng chỉ.
3. Hệ thống tạo file hoặc dữ liệu chứng chỉ ngoài blockchain.
4. Hệ thống tính hash của dữ liệu cần xác thực.
5. Hash, định danh và trạng thái được ghi nhận trên blockchain.
6. Hệ thống trả về mã chứng chỉ và QR/link xác thực.

### Xác thực

1. Verifier cung cấp mã, QR hoặc file chứng chỉ.
2. Hệ thống lấy bản ghi chứng chỉ và trạng thái trên blockchain.
3. Hệ thống tính lại hash từ dữ liệu được cung cấp.
4. Hệ thống so sánh hash và kiểm tra trạng thái thu hồi.
5. Hệ thống trả kết quả: hợp lệ, bị thay đổi, không tồn tại hoặc đã thu hồi.

### Thu hồi và cấp lại

Chỉ issuer hoặc vai trò có quyền mới được thay đổi trạng thái chứng chỉ. Mọi thay đổi quan trọng phải có lịch sử để truy vết.

## 6. Kiến trúc định hướng

- `project/apps/web`: giao diện quản trị và giao diện issuer.
- `project/apps/verifier`: giao diện xác thực công khai, có thể tách khỏi khu vực quản trị.
- `project/apps/api`: API nghiệp vụ và xác thực quyền.
- `project/packages/shared`: kiểu dữ liệu, schema và quy tắc dùng chung.
- `project/packages/blockchain`: client, transaction builder và đọc event blockchain.
- `project/packages/pdf`: tạo hoặc kiểm tra file chứng chỉ nếu task yêu cầu.
- `project/contracts`: smart contract.
- `project/workers`: các tác vụ nền của sản phẩm, chẳng hạn đồng bộ event blockchain.
- `project/tests`: unit, integration, contract và end-to-end tests.

## 7. Nguyên tắc dữ liệu

- Không lưu PDF hoặc dữ liệu cá nhân nhạy cảm trực tiếp trên blockchain.
- Blockchain lưu định danh, hash, trạng thái, issuer và timestamp cần thiết.
- Dữ liệu ngoài blockchain phải có khóa liên kết rõ ràng với bản ghi on-chain.
- Mọi dữ liệu đầu vào phải được kiểm tra schema và quyền truy cập.

## 8. Baseline công nghệ

Đây là baseline để Agent bắt đầu, không phải quyết định bất biến:

- TypeScript cho API và giao diện nếu chưa có quyết định khác.
- Solidity và Foundry cho smart contract.
- EVM testnet cho môi trường thử nghiệm.
- Cơ sở dữ liệu quan hệ cho dữ liệu nghiệp vụ ngoài blockchain.
- Client blockchain có kiểm tra chain, transaction receipt và event.

Nếu thay đổi baseline, phải ghi quyết định vào `harness/context/decisions/` hoặc `project/docs/decisions/` trước khi triển khai rộng.

## 9. Tiêu chí kỹ thuật chung

Mỗi chức năng phải có:

- kiểm tra quyền;
- kiểm tra dữ liệu đầu vào;
- xử lý lỗi rõ ràng;
- test phù hợp;
- log đủ để truy vết nhưng không làm lộ secret hoặc dữ liệu nhạy cảm;
- tài liệu ngắn gọn nếu thay đổi hành vi hoặc API.

