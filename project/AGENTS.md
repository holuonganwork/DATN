# Quy tắc project

- `project/` là nơi chứa mã nguồn thật của hệ thống chứng chỉ; tài liệu sản phẩm và kỹ thuật đặt trong `project/docs/`.
- Giữ logic blockchain, API, frontend và worker trong các module riêng theo kiến trúc đã thống nhất.
- Không lưu secret, private key hoặc dữ liệu cá nhân thật trong repository.
- Mọi thay đổi có ảnh hưởng hành vi phải có kiểm thử hoặc bằng chứng tương ứng trong `harness/evidence/`.
- Trước khi lập kế hoạch và sửa mã trong `project/`, bắt buộc đọc và tuân thủ quy tắc clean code, boundary, pattern cấm và test gates tại [quality-gates.md](docs/quality-gates.md) (nguồn chuẩn duy nhất).
