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

## 3. Đề xuất bước sau — CHỜ CHỦ DỰ ÁN DUYỆT: chọn trên ảnh vệ tinh ngay trong trang

Trải nghiệm đích (một màn, ~20 giây): ô tìm địa chỉ / tự căn theo vị trí máy → ảnh vệ tinh → **bấm lên mái nhà** (ghim) →
**kéo mũi tên** từ ghim ra mặt đường trước cửa → số độ + hướng hiện sống → Chốt. Không phải chép / dán gì. Toạ độ vẫn chỉ đi
qua lượt gọi engine, không lưu.

| Phương án | Ảnh vệ tinh VN | Chi phí | Việc phải duyệt |
|---|---|---|---|
| **A. Google Maps JavaScript API** (khuyến nghị) | Tốt nhất, người dùng quen | Miễn phí ~10.000 lượt mở bản đồ / tháng, sau đó tính tiền | Tài khoản Google Cloud có thanh toán, khoá API giới hạn theo tên miền (env `NEXT_PUBLIC_GOOGLE_MAPS_KEY`), thêm miền Google Maps vào `lib/csp.ts`, cập nhật Chính sách riêng tư (bản đồ do Google cung cấp) |
| B. Tự viết khung xem ô ảnh (không thư viện) + Google Map Tiles API | Như A | Miễn phí 100.000 ô ảnh / tháng (~3.000 lượt xem) | Như A, thêm ~1–2 ngày viết khung kéo / phóng to |
| C. Leaflet / MapLibre + nguồn ảnh khác | Esri World Imagery **không cho dùng thương mại** nếu không có giấy phép ArcGIS; nhà cung cấp VN (Goong, VietMap) cần kiểm tra có lớp vệ tinh | Tuỳ nhà cung cấp | Dependency mới + nhà cung cấp mới |

Khuyến nghị **A**, chỉ tải bản đồ khi người dùng bấm "Chọn trên ảnh vệ tinh" (không tốn lượt với người chỉ đọc trang),
giữ nguyên cách dán toạ độ làm đường dự phòng khi thiếu khoá / hết hạn mức.
