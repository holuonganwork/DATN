# Project Scope

## 1. Phạm vi phiên bản đầu tiên

Phiên bản đầu tiên của đồ án phải hoàn thành được một luồng từ phát hành đến xác thực:

1. Đăng ký hoặc quản lý đơn vị phát hành.
2. Quản lý quyền issuer.
3. Tạo chứng chỉ đào tạo.
4. Phát hành chứng chỉ và ghi bằng chứng lên blockchain.
5. Sinh mã chứng chỉ và QR/link xác thực.
6. Xác thực công khai bằng mã, QR hoặc hash.
7. Nhận biết dữ liệu chứng chỉ đã bị thay đổi.
8. Thu hồi chứng chỉ.
9. Cấp lại chứng chỉ hoặc tạo phiên bản mới khi cần.
10. Hiển thị lịch sử và trạng thái xác thực cơ bản.

## 2. Phạm vi chức năng chi tiết

### 2.1. Quản lý issuer

- Tạo issuer trong môi trường quản trị.
- Gán địa chỉ blockchain hoặc định danh xác thực cho issuer.
- Kích hoạt, khóa và kiểm tra trạng thái issuer.
- Từ chối thao tác phát hành của issuer không hợp lệ.

### 2.2. Quản lý chứng chỉ

- Tạo chứng chỉ với dữ liệu tối thiểu cần thiết.
- Sinh định danh duy nhất.
- Tính hash dữ liệu hoặc file chứng chỉ.
- Ghi nhận chứng chỉ trên blockchain.
- Lưu dữ liệu nghiệp vụ ngoài blockchain.
- Truy xuất trạng thái chứng chỉ.

### 2.3. Xác thực

- Tìm theo mã chứng chỉ.
- Kiểm tra hash của file hoặc dữ liệu được cung cấp.
- Kiểm tra issuer.
- Kiểm tra trạng thái còn hiệu lực hoặc đã thu hồi.
- Trả kết quả dễ hiểu cho verifier.

### 2.4. Thu hồi và cấp lại

- Chỉ vai trò có quyền mới được thu hồi.
- Chứng chỉ đã thu hồi không được hiển thị là hợp lệ.
- Có lý do hoặc metadata nghiệp vụ tối thiểu cho việc thu hồi.
- Cấp lại phải tạo trạng thái hoặc định danh có thể truy vết.

## 3. Không nằm trong phạm vi phiên bản đầu tiên

Không tự ý triển khai các phần sau nếu chưa có task riêng và quyết định phạm vi:

- Mainnet hoặc hệ thống multi-chain.
- Ví mobile riêng.
- Full W3C Verifiable Credentials và selective disclosure.
- Thanh toán hoặc marketplace chứng chỉ.
- OCR hoặc xác thực tài liệu bằng AI.
- Tích hợp hệ thống đào tạo bên ngoài ở quy mô production.
- Xử lý hàng triệu chứng chỉ.
- Ứng dụng native iOS/Android.
- Danh tính phi tập trung đầy đủ.
- Cơ chế quản trị DAO.
- Tính năng không phục vụ phát hành, xác thực, thu hồi hoặc truy vết chứng chỉ.

## 4. Ranh giới giữa sản phẩm và harness

### Thuộc sản phẩm `project/`

- Smart contract.
- API và cơ sở dữ liệu nghiệp vụ.
- Giao diện issuer và verifier.
- Tạo, lưu và kiểm tra chứng chỉ.
- Đồng bộ event blockchain của sản phẩm.
- Monitoring và logging phục vụ vận hành sản phẩm.

### Thuộc harness `harness/`

- Context cho Agent.
- Task và acceptance criteria.
- Quy trình chạy task.
- Validator để kiểm tra code.
- State, checkpoint và evidence.
- Log của quá trình Agent làm việc.

Không đưa logic nghiệp vụ chứng chỉ vào `harness/`.

## 5. Tiêu chí chấp nhận cấp hệ thống

Hệ thống được xem là đạt phạm vi cơ bản khi có thể thực hiện thành công các kịch bản:

1. Issuer hợp lệ phát hành một chứng chỉ.
2. Verifier xác thực thành công chứng chỉ chưa bị thay đổi.
3. Verifier phát hiện file hoặc dữ liệu chứng chỉ đã bị sửa.
4. Issuer có quyền thu hồi chứng chỉ.
5. Chứng chỉ đã thu hồi không còn được xác nhận là hợp lệ.
6. Issuer không hợp lệ không thể phát hành hoặc thu hồi.
7. Một event blockchain được đồng bộ lặp lại không tạo bản ghi nghiệp vụ trùng.
8. Không có dữ liệu cá nhân hoặc secret nhạy cảm trong transaction blockchain.

## 6. Quy tắc mở rộng phạm vi

Một yêu cầu mới chỉ được thêm vào khi có:

- mục tiêu cụ thể;
- lý do cần thiết;
- ảnh hưởng đến kiến trúc và dữ liệu;
- tiêu chí chấp nhận;
- task riêng;
- đánh giá tác động đến thời gian và rủi ro.

