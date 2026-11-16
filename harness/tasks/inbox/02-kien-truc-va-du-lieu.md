# Giai đoạn 02 — Kiến trúc, dữ liệu và trạng thái nghiệp vụ

**Thời lượng:** Tuần 1–2  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Thiết kế modular monolith và các hợp đồng dữ liệu để có thể phát triển blockchain sau mà không phải viết lại hệ thống.

## Mô tả

Thiết kế các module web, API, worker, cơ sở dữ liệu và object storage. Phần blockchain được che sau một interface để giai đoạn đầu có thể dùng mock adapter.

## Phạm vi thiết kế

- Module tổ chức và phân quyền.
- Module khóa học, học viên và batch.
- Module chứng chỉ, phát hành, thu hồi và chia sẻ.
- Module xác minh.
- Worker/indexer.
- PostgreSQL, Redis/BullMQ và object storage riêng tư.

## Trạng thái batch đề xuất

'DRAFT → VALIDATED → APPROVED → FROZEN → PENDING_CHAIN → CONFIRMED'

Nhánh lỗi:

'VALIDATED/APPROVED/FROZEN/PENDING_CHAIN → FAILED'

Chỉ batch ở trạng thái 'CONFIRMED' mới được phân phối như đã phát hành.

## Checklist

- [ ] Vẽ sơ đồ module và luồng dữ liệu.
- [ ] Thiết kế schema cho issuer, wallet, course, learner, batch và credential.
- [ ] Thiết kế quan hệ giữa credential, leaf, batch và PDF.
- [ ] Thiết kế audit log và quyền truy cập.
- [ ] Thiết kế trạng thái batch và transaction.
- [ ] Tạo migration PostgreSQL ban đầu.
- [ ] Tách dữ liệu on-chain và off-chain.
- [ ] Tạo interface BlockchainGateway.
- [ ] Tạo mock BlockchainGateway cho phát triển sớm.
- [ ] Thiết kế cấu hình tin cậy gồm chain ID, contract address và RPC.
- [ ] Quy định idempotency key cho các thao tác phát hành/thu hồi.

## Đầu ra

- Sơ đồ kiến trúc.
- ERD hoặc schema Prisma.
- State machine nghiệp vụ.
- API contract ban đầu.
- Interface blockchain và mock adapter.
- Quy tắc bảo vệ dữ liệu cá nhân.

## Tiêu chí hoàn thành

Có thể chạy backend với database rỗng, tạo một batch nháp và chuyển trạng thái qua các bước mà chưa cần smart contract thật. Khi thay mock bằng EVM adapter, API không phải thay đổi.

## Rủi ro cần tránh

- Dùng một cột 'issued = true' thay cho trạng thái transaction chi tiết.
- Đưa private key vào backend hoặc file .env dùng chung.
- Lưu PDF hoặc thông tin cá nhân trong event/blockchain.
