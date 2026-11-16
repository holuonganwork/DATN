# Giai đoạn 08 — Worker, indexer và phục hồi lỗi

**Thời lượng:** Tuần 7–8  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Đồng bộ transaction/event có retry, đọc bù và chống tạo bản ghi trùng.

## Mô tả

Xây worker bằng Redis/BullMQ hoặc cơ chế tương đương để theo dõi transaction phát hành và thu hồi. Database off-chain là bản sao nghiệp vụ có thể phục hồi từ blockchain trong phạm vi đã xác định.

## Luồng xử lý

- Nhận transaction intent.
- Theo dõi receipt.
- Đọc event.
- Kiểm tra dữ liệu event với intent.
- Ghi checkpoint block.
- Đọc bù các block chưa xử lý.
- Retry lỗi tạm thời với backoff.
- Dùng khóa idempotency để chống trùng.

## Checklist

- [ ] Tạo queue cho publish và revoke.
- [ ] Theo dõi pending/confirmed/failed.
- [ ] Lưu block number và log index đã xử lý.
- [ ] Thiết kế unique key cho event.
- [ ] Retry RPC timeout và lỗi tạm thời.
- [ ] Đọc bù từ checkpoint.
- [ ] Xử lý worker khởi động lại.
- [ ] Ghi log có correlation ID.
- [ ] Đo số lần retry và thời gian phục hồi.
- [ ] Kiểm thử event được đọc nhiều lần.
- [ ] Kiểm thử transaction thất bại.
- [ ] Kiểm thử RPC tạm dừng rồi hoạt động lại.

## Đầu ra

- Worker/indexer chạy độc lập.
- Bảng checkpoint và event log.
- Dashboard hoặc metric cơ bản.
- Kịch bản recovery.

## Tiêu chí hoàn thành

Sau khi dừng và khởi động lại worker, các event chưa xử lý được đọc bù; event đọc lặp không tạo bản ghi nghiệp vụ trùng; lỗi RPC không làm batch chuyển nhầm thành CONFIRMED.
