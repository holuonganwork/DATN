# T-021: Loại bỏ toàn bộ dữ liệu mẫu, mock, fallback và thành phần giả lập trong Frontend

## Mục tiêu
Dọn dẹp toàn bộ dữ liệu khởi tạo mẫu (`organizations`, `wallets`, `courses`, `learners`, `batches`, `credentials`, `events`), các nút bấm giả lập kịch bản (`Khôi phục dữ liệu mẫu`, `Mẫu PDF gốc/bị sửa`, `Kịch bản kiểm định nhanh`, chip chọn mẫu), các trường thừa `syncLegacyMirrors` (`issuer`, `batch`), giá trị điền sẵn trong state của form và các fallback tự chế số block / hash file lỗi trong `project/apps/web` để số liệu hoàn toàn trung thực (`0` khi chưa có dữ liệu) khi kết nối Backend.

## Phạm vi cho phép
- `project/apps/web/`
- `harness/context/current-state.md`

## Tiêu chí hoàn thành
- `AC-1`: `createInitialState()` khởi tạo rỗng 100% cho toàn bộ danh sách nghiệp vụ (`organizations: []`, `wallets: []`, `courses: []`, `learners: []`, `batches: []`, `credentials: []`, `events: []`), xóa `syncLegacyMirrors` (`issuer`, `batch`), xóa fallback số block `#14820` và đổi khóa `STORAGE_KEY` sang `certchain.product.state.v2` kèm dọn khóa `v1` cũ để không nạp lại dữ liệu mẫu cũ.
- `AC-2`: Loại bỏ toàn bộ các nút bấm giả lập kịch bản (`Khôi phục dữ liệu mẫu`, `Mẫu PDF gốc`, `Mẫu PDF bị sửa`, `Kịch bản kiểm định nhanh`, chip mẫu), xóa giá trị điền sẵn trong state của các form (chỉ dùng `placeholder`), để Cổng Xác thực ở trạng thái chờ người dùng nhập mã hoặc tải file thật và hiển thị Empty State chuẩn khi danh sách rỗng.
- `AC-3`: `npm.cmd run build`, `node scripts/validate-web.mjs` và `git diff --check` đều PASS.
