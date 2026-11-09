# QBG-1 — "Quét 3 góc như Face ID" cho Nhân tướng học

Chủ dự án giao (2026-11-09): thêm cách quét 3 góc mặt bằng camera như video mẫu (một trang xem tướng khác: khung oval,
vòng vạch tiến độ, tự chụp khi đúng góc, đếm 3-2-1, ba bước Nhìn thẳng / Quay trái / Quay phải); giữ cách tải ảnh
mặc định (ANH-2/3/4). Khâu THU HÚT + QUAY LẠI — bớt bước chọn ảnh, ảnh đúng góc ngay từ đầu nên số đo đúng hơn.
Đo: `chart_interacted{mo_dun=nhantuong, kind=quet_mo|quet_chup{buoc,cach}|quet_xong{so_goc,tu_dong}|quet_loi{ly_do}}`
→ `kind=do_mat` (đo xong) → `reading_started{nhantuong}`.

## 1. Các cách tiếp cận

| | Cách | Được | Mất |
|---|---|---|---|
| A | Ba lần `<input capture>` (mở app camera của máy, mỗi góc một lần) | Không quyền camera trong trang, mọi trình duyệt | Không hướng dẫn trực tiếp, không tự chụp, người dùng tự canh góc → ảnh nghiêng lệch; ba lần chuyển app |
| **B** | **Camera trong trang + bộ tìm điểm mốc ở chế độ VIDEO (MediaPipe đã có từ ANH-3) + tự chụp** | Giống Face ID: biết góc mặt từng khung, nhắc "lại gần / ngẩng lên / quay thêm", đếm 3-2-1, giữ khung **nét nhất**; dùng lại tệp, CSP, mô hình đã duyệt — **không dependency mới, không gửi gì đi** | Cần quyền camera (`Permissions-Policy camera=(self)`), máy yếu chạy chậm hơn (GPU → CPU) |
| C | Quay video vài giây rồi tách khung | Một thao tác | Ghi hình toàn bộ (nhạy cảm hơn), tách khung đúng góc vẫn cần B, tệp lớn |
| D | Gửi luồng / ảnh lên máy chủ hoặc dịch vụ nhận diện | Có thể đoán thêm nét | Dữ liệu sinh trắc rời máy (Luật 91/2025), trái ANH-2 "ảnh không rời máy", tốn tiền |

**Chọn B**, giữ A làm đường lùi (nút "Chọn ảnh" / "Quay lại chọn ảnh" khi không mở được camera).

## 2. Cách làm

- `web/lib/quet-mat.ts` (hàm thuần, có test): góc quay ngang từ vị trí đầu mũi giữa hai viền gò má (đầu ~ hình trụ:
  lệch theo sin góc), nghiêng đầu từ hai đuôi mắt, cúi / ngửa từ mũi giữa mắt–miệng, cỡ + tâm mặt; `danhGia` trả một lời
  nhắc mỗi lúc; độ sáng + độ nét (phương sai Laplace trên vùng mặt 96 px). Ngưỡng một chỗ (`NGUONG`).
- `web/lib/quet-mat-bo-do.ts`: FaceLandmarker `runningMode: VIDEO` từ `/mediapipe/<phiên bản>/` (GPU, lỗi thì CPU).
- `web/components/nhan-tuong/QuetBaGoc.tsx`: màn toàn trang, camera trước lật gương khi xem (ảnh lưu KHÔNG lật), oval + 60
  vạch tiến độ (vàng → xanh), mũi tên chỉ chiều quay, đếm 3-2-1 sau khi giữ yên 0,9 s, trong lúc giữ chọn khung nét nhất,
  nút chụp tay luôn có, đổi camera trước / sau, "Bỏ qua góc này" cho hai góc nghiêng, Esc đóng.
- **Ảnh nghiêng**: bộ đo chỉ bám mặt tới khoảng 55–60°; tự chụp khi quay đúng chiều ≥ 55°, hoặc khi đã quay ≥ 38° rồi
  mất dấu (= đã quay gần hẳn 90°). Ảnh nghiêng vẫn để người dùng chấm đường viền (ANH-4 — chưa có ảnh nghiêng thật để hiệu
  chỉnh tự tìm điểm); khung chấm mở sẵn với ảnh vừa quét.
- Kết quả: ảnh thẳng → `DoMatTrenAnh` như chọn ảnh (tự tìm 20 điểm ANH-3), ảnh nghiêng → `ChamNghieng` → cùng thoả
  thuận `dm1`, cùng route `/v1/nhan-tuong/do-mat`. **Engine không đổi.**
- Riêng tư: khung hình chỉ trong trình duyệt, không ghi hình, không gửi; camera tắt khi xong / đóng. Chính sách riêng tư
  `#anh-mat` thêm câu về quyền camera (hiệu lực 09/11/2026).

## 3. Kiểm

`web/e2e/quet-ba-goc.spec.ts`: hàm thuần (chiều + độ lớn góc, từng lời nhắc, ảnh nghiêng, độ nét); trình duyệt thật với
camera giả (`canvas.captureStream`): bấm chụp 3 góc → ảnh vào đúng khung; bỏ qua góc nghiêng; Esc; từ chối camera →
lời báo; chiếu chân dung mẫu → máy tự chụp ảnh thẳng; không yêu cầu nào ra máy chủ ngoài.

## 4. Để sau

- Tự tìm điểm đường viền trên ảnh nghiêng (cần bộ ảnh nghiêng thật có phiếu đồng ý để hiệu chỉnh).
- Chỉnh `NGUONG` theo số `quet_chup{cach}` (tỉ lệ tự chụp / chụp tay) sau 2–4 tuần.
