# ADR-0002 — Modular monolith và BlockchainGateway

**Trạng thái:** Accepted  
**Ngày:** 2026-11-12

## Bối cảnh

Đồ án do một người thực hiện trong khoảng 10 tuần. Nếu module nghiệp vụ gọi thẳng RPC, database hoặc HTTP, việc test mock và thay Anvil bằng EVM adapter sẽ làm lan truyền thay đổi.

## Quyết định

Backend dùng modular monolith; domain/application chỉ phụ thuộc các port. Tất cả thao tác blockchain đi qua `BlockchainGateway`. Worker là process riêng nhưng dùng chung domain contract và repository adapter.

Mỗi tổ chức chỉ có một ví issuer đang hoạt động trong MVP; thay ví là thao tác có audit và không làm đổi các batch đã xác nhận. Mock gateway là adapter mặc định trong test/dev sớm. EVM gateway chỉ chịu trách nhiệm encode calldata, gửi/đọc receipt/event và kiểm tra chain/contract context; không giữ private key issuer.

## Hệ quả

- Có thể chạy luồng batch nháp và test state machine không cần RPC thật.
- API không phải đổi khi thay mock bằng EVM adapter.
- Cần duy trì hợp đồng port, fixture receipt/event và test idempotency.
- Microservices, event sourcing toàn hệ thống và multi-chain bị loại khỏi MVP.
