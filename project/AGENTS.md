# Quy tắc project

- `project/` là nơi chứa mã nguồn thật của hệ thống chứng chỉ.
- Tài liệu sản phẩm và kỹ thuật đặt trong `project/docs/`.
- Giữ logic blockchain, API, frontend và worker trong các module riêng theo kiến trúc đã thống nhất.
- Không lưu secret, private key hoặc dữ liệu cá nhân thật trong repository.
- Mọi thay đổi có ảnh hưởng hành vi phải có kiểm thử hoặc bằng chứng tương ứng trong `harness/evidence/`.
- Khi task sửa mã trong `project/`, đọc [quality-gates](docs/quality-gates.md) trước khi lập kế hoạch.
- Mỗi module có một boundary rõ; domain logic không gọi trực tiếp database, RPC, filesystem hoặc HTTP.
- Kiểm tra input và quyền ở boundary; giữ lỗi có ngữ nghĩa, có context và có thể truy vết.
- Dùng tên theo domain, gom rule lặp vào constant/type có tên và giữ hàm theo một trách nhiệm.
- Chạy quality gates của task trước khi báo hoàn thành; không để debug statement, unsafe type escape hoặc catch rỗng trong code sản phẩm.
- Test phải kiểm tra hành vi và nhánh lỗi quan trọng, gồm quyền, retry, idempotency và dữ liệu không hợp lệ khi liên quan.
