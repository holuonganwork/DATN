# Glossary miền chứng chỉ

Tài liệu này chỉ định nghĩa thuật ngữ nghiệp vụ; chi tiết database, HTTP và blockchain nằm ở các tài liệu kiến trúc/dữ liệu.

| Thuật ngữ | Định nghĩa chuẩn |
| --- | --- |
| Đơn vị phát hành (Issuer Organization) | Tổ chức được hệ thống xác minh và cho phép phát hành chứng chỉ. |
| Ví issuer | Địa chỉ duy nhất đang được một tổ chức ủy quyền trong MVP để ký thao tác phát hành hoặc thu hồi; lịch sử thay ví vẫn được truy vết. |
| Quản trị viên hệ thống | Người quản lý việc đăng ký, xác minh và trạng thái tổ chức. |
| Người vận hành issuer | Người chuẩn bị dữ liệu khóa học, học viên và batch. |
| Người phê duyệt | Người có quyền duyệt và đóng băng batch trước khi phát hành. |
| Học viên (Learner) | Chủ thể nghiệp vụ được ghi nhận là người nhận chứng chỉ. |
| Người cầm chứng chỉ (Holder) | Người đang xuất trình gói chứng chỉ; hệ thống không tự chứng minh họ là học viên. |
| Khóa học | Chương trình đào tạo mà một hoặc nhiều chứng chỉ tham chiếu. |
| Batch | Tập hợp chứng chỉ được chuẩn bị, đóng băng và phát hành cùng một bằng chứng gốc. |
| Credential | Bản ghi chứng chỉ cho một học viên, gồm nội dung, nguồn phát hành, thời hạn và trạng thái. |
| Gói chứng chỉ | Gói dữ liệu mà học viên lưu/chia sẻ để verifier kiểm tra. |
| Anchor | Thông tin liên kết credential với nguồn phát hành và batch đã được ghi nhận. |
| Leaf | Dấu đại diện của một credential trong tập bằng chứng của batch. |
| Merkle proof | Bằng chứng cho biết một leaf thuộc root của batch. |
| Thu hồi (Revocation) | Quyết định một credential không còn được chấp nhận là hợp lệ kể từ thời điểm ghi nhận. |
| Cấp lại (Reissue) | Việc phát hành credential mới để thay thế hoặc bổ sung cho credential cũ, có liên kết truy vết. |
| Trạng thái xác minh | Kết quả tổng hợp của các kiểm tra nguồn, toàn vẹn, thời hạn và thu hồi. |
| Chưa thể xác minh đầy đủ | Trạng thái khi một kiểm tra bắt buộc không thực hiện được, thường do RPC hoặc cấu hình tin cậy không khả dụng. |
| Bằng chứng phát hành | Tập dữ liệu tối thiểu đủ để đối chiếu credential với nguồn phát hành và trạng thái đã công bố. |
