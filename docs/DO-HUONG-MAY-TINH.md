# Đo hướng nhà trên máy tính (DH-PC, 2026-10-27)

Chủ dự án hỏi: dùng trình duyệt trên PC thì đo / nhập hướng nhà thế nào cho đơn giản, có tự nhận được hướng và toạ độ không.
Kho tri thức chưa có mục nào về định vị trên máy tính → tài liệu này ghi lại hiện trạng, phương án và lựa chọn.

## 1. Vì sao trên PC khó

| Cách hiện có | Trên điện thoại | Trên máy tính |
|---|---|---|
| La bàn cảm biến | Dùng được | **Không có** cảm biến hướng |
| Gõ số độ | Được | Được, nhưng người dùng thường không biết số độ |
| "Lấy vị trí hiện tại" cho hai điểm | GPS ngoài trời ±5–10 m | **Không có GPS**: trình duyệt đoán theo wifi / IP, ±40 m tới vài km. Hai điểm trong một căn nhà cách nhau 4 m mà sai số ±40 m → góc tính ra gần như ngẫu nhiên (đúng trường hợp ảnh chụp màn hình chủ dự án gửi) |
| Dán toạ độ / link bản đồ | Nhấn giữ trên bản đồ | Phải tự biết "chuột phải → bấm dòng số" trên Google Maps |

Tự nhận hướng nhà hoàn toàn (không cần người dùng chỉ) **chưa làm được tin cậy**: cần dữ liệu đường viền toà nhà + đường phố
(OpenStreetMap ở hẻm Việt Nam còn thưa; Google không mở dữ liệu toà nhà qua API cho Việt Nam). Cách thực tế nhất là để người
dùng **chỉ hai điểm trên ảnh vệ tinh**: mái nhà và mặt đường trước cửa — mắt người nhận ra nhà mình ngay.

## 2. Đã làm (không thêm dependency, không dịch vụ mới, không đổi engine)

1. **Kéo xoay mặt la bàn** bằng chuột / ngón tay, bấm một chữ (B, Đ, N, T) để đưa lên dưới kim, phím ← → chỉnh 1° (Shift 15°)
   → nút "Chốt hướng N°" gửi engine như đo la bàn. Cho người đã biết nhà quay về phía nào.
2. **Google Maps ảnh vệ tinh** mở tab mới, căn sẵn gần vị trí máy (nếu cho phép; vị trí wifi đủ để căn giữa bản đồ dù không đủ để
   chấm điểm). Hướng dẫn riêng cho máy tính: chuột phải lên mái nhà → bấm dòng số đầu (Google tự chép) → nút **Dán**.
3. **Nút Dán** cạnh mỗi ô toạ độ (đọc bộ nhớ tạm khi bấm; chặn thì nhắc Ctrl+V).
4. **Chặn kết quả vô nghĩa**: điểm lấy bằng định vị có sai số ≥ nửa khoảng cách hai điểm → không chốt, không lưu, báo lý do và
   chỉ sang cách chuột phải trên bản đồ.

Đo: `chart_interacted{kind: mo_ban_do_ve_tinh | ban_do_dan | huong_ban_do_sai_so | huong_ban_do | nhap_do_huong}`.

## 3. DH-PC2 — chọn trên ảnh vệ tinh ngay trong trang (chủ dự án duyệt phương án A, 2026-10-27, đã làm)

Một màn: ô tìm địa chỉ + nút "Về vị trí của tôi" → ảnh vệ tinh (Google Maps, lớp "hybrid" có tên đường) → **bấm mái nhà**
(điểm 1) → **bấm mặt đường trước cửa** (điểm 2, mũi tên vàng) → trang gọi engine → "Mặt nhà nhìn về X · N° · hai điểm cách
M m" → **Dùng hướng này** (như đo la bàn: hiện kết quả, báo Khảo sát nhà, lưu hồ sơ nhà trên máy). Kéo ghim để chỉnh; bấm
tiếp = dời điểm 2; "Chấm lại".

- **Khung riêng `/khung/ve-tinh`** (route trả HTML): Maps JS API cần `'unsafe-eval'` trong CSP → chỉ khung này có CSP riêng
  (Google Maps + `'unsafe-eval'`, `frame-ancestors 'self'`, noindex, không cache); `proxy.ts` bỏ qua đường dẫn này, cả site
  giữ CSP-2 chặt (client navigation không đổi CSP tài liệu nên không thể nới theo từng trang). Robots chặn `/khung/`.
- **postMessage** chỉ cùng origin và đúng `source`: khung gửi `san` / `loi` / `diem{buoc, tam, truoc}` / `tim` / `vi_tri`;
  trang gửi lệnh `tim`, `vi_tri`, `lam_lai`. Web KHÔNG tự tính góc — mỗi lần đủ hai điểm gọi `/api/phongthuy/huong-ban-do`.
- Bản đồ chỉ tải khi bấm "Chọn trên ảnh vệ tinh" → không tốn lượt với người chỉ đọc. Thiếu `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
  → nút ẩn; khoá sai / bị chặn (`gm_authFailure`) → báo và chỉ sang cách dán toạ độ.
- Không thêm gói npm (không `@types/google.maps`, không thư viện React cho Maps).
- Chính sách riêng tư thêm dòng "Google Maps (bản đồ vệ tinh)", hiệu lực 27/10/2026.
- Đo: `chart_interacted{kind: ve_tinh_mo | ve_tinh_tim | ve_tinh_dung}`.
- E2E: bản Google Maps GIẢ (`e2e/phong-thuy.spec.ts` "DH-PC2") — chấm hai điểm trong khung → engine → Đông Nam; kiểm CSP
  trang không có `'unsafe-eval'`, khung có. Bản thật cần kiểm tay sau khi đặt khoá (`docs/VIEC-CUA-ANH.md` mục 4r).

### Lựa chọn đã cân nhắc

| Phương án | Ảnh vệ tinh VN | Chi phí | Ghi chú |
|---|---|---|---|
| **A. Google Maps JavaScript API** (đã chọn) | Tốt nhất, người dùng quen | Miễn phí ~10.000 lượt mở bản đồ / tháng, sau đó tính tiền | Khoá giới hạn tên miền, đặt hạn mức ngày |
| B. Tự viết khung xem ô ảnh + Google Map Tiles API | Như A | Miễn phí 100.000 ô ảnh / tháng (~3.000 lượt xem) | Thêm 1–2 ngày viết khung kéo / phóng to |
| C. Leaflet / MapLibre + nguồn ảnh khác | Esri World Imagery **không cho dùng thương mại** nếu không có giấy phép ArcGIS | Tuỳ nhà cung cấp | Dependency mới |
