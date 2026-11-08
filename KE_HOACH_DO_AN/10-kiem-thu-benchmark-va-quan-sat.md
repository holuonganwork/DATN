# Giai đoạn 10 — Kiểm thử, benchmark và quan sát

**Thời lượng:** Tuần 9  
**Trạng thái:** Chưa bắt đầu  
**Mục tiêu:** Tạo bằng chứng định lượng cho tính đúng, hiệu năng và khả năng phục hồi.

## Ba phương án so sánh

- Phương án A: JSON ký số, khóa công khai và trạng thái tập trung.
- Phương án B: Ghi hash từng chứng chỉ trực tiếp lên smart contract.
- Phương án C: Phát hành theo lô bằng Merkle root, proof riêng và thu hồi riêng.

## Kích thước thử nghiệm

1, 10, 100, 1.000 và 10.000 chứng chỉ.

## Chỉ số cần đo

- Tỷ lệ kiểm tra đúng.
- Số chứng chỉ không hợp lệ bị chấp nhận.
- Số trường hợp báo đạt khi thiếu bằng chứng.
- Gas phát hành và gas trung bình mỗi chứng chỉ.
- Gas thu hồi.
- p50/p95 thời gian xác minh.
- Kích thước JSON và proof.
- Thời gian phục hồi worker.
- Số event trùng và bị bỏ sót.
- Khả năng xác minh khi API dừng.

## Checklist

- [ ] Viết unit test cho credential-core.
- [ ] Viết unit/fuzz/invariant test contract.
- [ ] Viết API integration test.
- [ ] Viết e2e test cho phát hành và xác minh.
- [ ] Chạy mọi kịch bản sửa payload/PDF.
- [ ] Kiểm thử sai proof, sai batch, sai registry và sai mạng.
- [ ] Kiểm thử hết hạn và thu hồi.
- [ ] Kiểm thử RPC timeout và API dừng.
- [ ] Chạy benchmark ba phương án cùng điều kiện.
- [ ] Lưu raw result và script tái chạy.
- [ ] Ghi version code, chain, compiler và cấu hình benchmark.
- [ ] Thiết lập log, metric và trace tối thiểu.

## Đầu ra

- Test report.
- Benchmark report và biểu đồ.
- Raw data.
- Kịch bản tái lập.
- Danh sách lỗi còn tồn tại.

## Tiêu chí hoàn thành

Mỗi kết luận trong báo cáo có test hoặc số đo đi kèm. Có thể tái chạy benchmark và giải thích được giới hạn của kết quả.
