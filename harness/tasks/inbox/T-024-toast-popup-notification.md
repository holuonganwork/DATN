# T-024: Chuyển thông báo sang Toast Pop-up nổi góc trên phải

## Mục tiêu
Chuyển đổi thông báo trạng thái `.notice-banner` (hiện đang hiển thị inline phía dưới header ở cả chế độ Public Website và Internal Console, gây xô đẩy bố cục trang) thành **Toast Pop-up nổi góc trên bên phải** (`position: fixed`), đồng thời bổ sung tự động đóng sau 4 giây và tạm dừng đếm ngược khi người dùng di chuột vào thông báo.

## Yêu cầu đã chốt
1. **Vị trí & Kiểu hiển thị**: Floating Toast Pop-up ở góc trên bên phải viewport (`z-index: 120`, nằm trên header `30` và modal `.modal-backdrop` `100`), dùng chung một điểm render duy nhất trong `.site-root` để hoạt động đồng nhất ở Public Website, Auth Gate, Internal Console và khi đang mở Modal.
2. **Hành vi đóng**: Tự động đóng sau 4 giây (`4000ms`), kèm thanh tiến trình đếm ngược 4s ở cạnh dưới card; khi hover chuột (`onMouseEnter` / `onMouseLeave`), bộ đếm 4s và animation thanh tiến trình tạm dừng, đồng thời vẫn giữ nút `Đóng ✕`.

## Phạm vi cho phép
- `project/apps/web/`
- `harness/context/current-state.md`

## Tiêu chí hoàn thành
- `AC-1`: Không còn khối `.notice-banner` inline trong Public mode hay Console mode gây nhảy layout.
- `AC-2`: Một `.toast-popup-viewport` / `.toast-popup-card` dùng chung hiển thị nổi góc trên bên phải, giữ nguyên semantic tone (`tone-success`, `tone-warning`, `tone-danger`), badge (`THÀNH CÔNG`, `CHÚ Ý`, `LỖI NGHIỆP VỤ`) và nút `Đóng ✕`.
- `AC-3`: Tự động đóng sau 4s và tạm dừng bộ đếm + thanh tiến trình `.toast-popup-progress` khi di chuột vào pop-up; kích hoạt thông báo mới sẽ reset bộ đếm nhờ `key={notice.id}`.
- `AC-4`: `npm.cmd run build`, `node --check scripts/validate-web.mjs`, `node scripts/validate-web.mjs`, `git diff --check` và `node harness/runner/harness.mjs doctor --json` đều PASS.
