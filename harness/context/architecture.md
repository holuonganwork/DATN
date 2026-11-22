# Kiến trúc nền

Hệ thống dùng modular monolith để phù hợp với thời gian và nguồn lực của đồ án. Web app gọi Backend API; ví của đơn vị phát hành ký transaction; trang hoặc CLI verifier đọc dữ liệu cần thiết từ RPC.

Backend gồm các module tổ chức, khóa học, học viên, chứng chỉ, phát hành, thu hồi, chia sẻ và xác minh. Worker/indexer theo dõi transaction, receipt và event, đồng bộ dữ liệu về PostgreSQL và thực hiện retry hoặc đọc bù khi cần.

PostgreSQL lưu dữ liệu nghiệp vụ; object storage riêng tư lưu PDF, file nhập và gói xuất; Redis/BullMQ phục vụ hàng đợi và tác vụ nền. Blockchain chỉ lưu bằng chứng phát hành, Merkle root, trạng thái batch/thu hồi và event liên quan.

Backend không giữ private key của issuer. Blockchain được che sau `BlockchainGateway` để có thể dùng mock adapter trước khi kết nối EVM thật.
