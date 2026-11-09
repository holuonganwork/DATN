# Quy tắc project

- `project/` là nơi chứa mã nguồn thật của hệ thống chứng chỉ.
- Tài liệu sản phẩm và kỹ thuật đặt trong `project/docs/`.
- Giữ logic blockchain, API, frontend và worker trong các module riêng theo kiến trúc đã thống nhất.
- Không lưu secret, private key hoặc dữ liệu cá nhân thật trong repository.
- Mọi thay đổi có ảnh hưởng hành vi phải có kiểm thử hoặc bằng chứng tương ứng trong `harness/evidence/`.
