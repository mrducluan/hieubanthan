# ANH-1 — Tải ảnh chân dung để đọc tướng (có thoả thuận riêng)

**Ngày:** 2026-11-06 · Chủ dự án giao: "đầu trang Nhân tướng cần tính năng tải ảnh chân dung, góc mặt nếu cần, để hệ thống nhận dạng khuôn mặt và xem tướng — với điều kiện người dùng đồng ý thoả thuận với hieuban, để không dính dữ liệu cá nhân; nghiên cứu và cập nhật".

Khâu của vòng tăng trưởng: **THU HÚT** (lối vào nhanh nhất của trang Nhân tướng: ảnh → bài đọc trong một phút) + **QUAY LẠI** (ít rào cản hơn 31 câu). Đo: `chart_interacted{mo_dun=nhantuong, kind=doc_anh, so_anh, so_goi_y}` → `doc_anh_xac_nhan{so_goi_y}` → `bai_doc`; `consent_given/withdrawn{phien_ban=am1}`.

## 1. Pháp lý trước đã

Ảnh gương mặt dùng để nhận diện nét mặt = **dữ liệu sinh trắc** = dữ liệu cá nhân **nhạy cảm** (Luật BVDLCN 91/2025/QH15 + NĐ 356/2025). Không có cách "không dính" khi đã xử lý ảnh mặt; chỉ có cách xử lý **đúng luật và tối thiểu**:

| Yêu cầu | Cách làm trong ANH-1 |
|---|---|
| Đồng ý riêng, rõ ràng, theo mục đích, không tích sẵn, rút được | Thoả thuận riêng `am1` ngay cạnh ô tải ảnh (`lib/dong-y-anh-mat.ts`), ghi ngày đồng ý **trên máy người dùng**, rút ở chỗ tải ảnh hoặc "Dữ liệu của tôi"; đổi nội dung xử lý → đổi `PHIEN_BAN_DONG_Y_ANH` → hỏi lại |
| Máy chủ không xử lý khi chưa có đồng ý | `POST /v1/nhan-tuong/doc-anh` bắt buộc `dong_y: true` (422 nếu thiếu); web cũng từ chối |
| Tối thiểu hoá | Ảnh thu nhỏ ≤ 1280 px + bỏ EXIF **trên trình duyệt**; ≤ 3 ảnh; không lưu đĩa, không log, không Sentry, không trả tên mô hình |
| Không nhận dạng danh tính | Lời nhắc cấm "nhận ra người đó là ai"; đầu ra chỉ là mã lựa chọn của bộ câu khảo sát + cờ kiểm ảnh |
| Người dùng kiểm soát | Mọi nhãn `can_xac_nhan` — người dùng tích từng nét mới vào khảo sát |
| Minh bạch bên thứ ba / chuyển ra nước ngoài | Chính sách riêng tư `#anh-mat` nêu nhóm nhà cung cấp AI thị giác, máy chủ ngoài VN; hồ sơ đánh giá tác động `docs/ho-so-dlcn/` cần thêm mục sinh trắc (việc của chủ dự án) |
| Công tắc vận hành | Engine mặc định **TẮT** (`NHAN_TUONG_DOC_ANH=1` mới bật) — bật sau khi có ý kiến luật sư (VIEC-CUA-ANH 4z / 4aa) |

Trẻ em: thoả thuận ghi rõ người gửi đủ 18 tuổi; không có cách kiểm tuổi kỹ thuật — ghi nhận là giới hạn.

## 2. Ba phương án kỹ thuật

| | A. Nhận diện + đo điểm mốc **trên máy** (MediaPipe Face Landmarker WASM) | B. Mô hình thị giác ở máy chủ gắn nhãn (lớp `doc_anh_mat` đã có) | C. Lai: kiểm ảnh trên máy + B + người dùng xác nhận (**chọn**) |
|---|---|---|---|
| Cách làm | 468 điểm mốc tính trong trình duyệt → gửi **toạ độ chuẩn hoá** (không ảnh) → CALC engine tính tỉ lệ tam đình, ngũ quan, góc mày… → điền khảo sát | Ảnh (đã thu nhỏ) → OpenRouter mô hình thị giác → JSON mã lựa chọn + độ tin → hậu xử lý tất định | Trình duyệt đếm gương mặt (`FaceDetector` khi có), bỏ EXIF, 3 góc chụp có hướng dẫn; máy chủ kiểm "đúng một mặt / nhìn thẳng / đủ sáng" rồi gắn nhãn; người dùng tích xác nhận |
| Riêng tư | Ảnh không rời máy — nhưng **bộ điểm mốc gương mặt vẫn là mẫu sinh trắc** (luật không coi nhẹ hơn ảnh); vẫn cần thoả thuận | Ảnh đi ra bên thứ ba một lượt — rủi ro cao nhất, cần thoả thuận + hợp đồng xử lý | Như B về pháp lý; bớt lượt gửi ảnh hỏng (không mặt / nhiều người) nhờ kiểm trên máy |
| Đúng về tướng | Chỉ đo được **hình** (tỉ lệ, góc); không đọc được sắc, thần, nếp, nốt ruồi | Đọc được cả sắc / nếp / thần ở mức "nhìn thấy"; không đo chính xác tỉ lệ | B + ô "Đo ba đình trên ảnh" 4 điểm (đã có) cho phần tỉ lệ |
| Chi phí / phụ thuộc | Dependency mới `@mediapipe/tasks-vision` + WASM (`'wasm-unsafe-eval'` trong CSP-2) + mô hình ~3 MB từ CDN (`connect-src` mở thêm miền) — **cần chủ dự án duyệt dependency**; chạy chậm trên điện thoại yếu | Không dependency; mỗi lượt tốn hạn mức RL-1 (~0,001–0,003 USD/lượt) | Như B; `FaceDetector` là API có sẵn của trình duyệt (Chrome Android, Safari mới), không có thì bỏ qua |
| Kết | **Chưa làm** — làm GĐ2 nếu chủ dự án duyệt dependency; khi đó CALC `tam_dinh_tu_diem` mở rộng nhận 468 điểm | Nền của C | **Làm** |

Không làm: nhận dạng danh tính / so khớp khuôn mặt (khác mục đích, rủi ro pháp lý khác hẳn), lưu ảnh để "cải thiện mô hình", mô hình tự chấm điểm đẹp xấu.

## 3. Cái đã làm (C)

- **Engine** `narrative/doc_anh_mat.py`: ≤ 3 ảnh có `goc` (chính diện bắt buộc · nghiêng trái · nghiêng phải; lời nhắc nói góc nào đọc nét nào), mô hình trả thêm `kiem_tra {thay_mat, so_nguoi, nhin_thang, du_sang}` → `_kiem_tra()` ép về cờ tất định; không thấy đúng một mặt → `tra_loi = []` + lời cố định của hệ thống (không lấy chữ mô hình); nghiêng / tối → chỉ cảnh báo. API `DocAnhMatInput` bắt buộc `dong_y: true`, mỗi góc một ảnh, trần thân 5 MB. `KHONG_TU_ANH` giữ nguyên (giọng, dáng, sờ xương không đọc từ ảnh).
- **Web** `components/nhan-tuong/AnhChanDung.tsx` đặt ngay dưới đầu trang `/nhan-tuong` (ẩn khi đã có bài đọc): ba ô góc chụp (`capture="user"` cho chính diện), xem trước `blob:` trên máy, `FaceDetector` đếm mặt khi trình duyệt có, khối thoả thuận (ô không tích sẵn; đã đồng ý thì hiện ngày + "Rút thoả thuận"), nút "Đọc ảnh và gợi ý" chỉ bật khi đủ ảnh chính diện + thoả thuận + engine đã bật; kết quả = danh sách nét có tích (mặc định tích, bỏ được) → "Dùng N nét" → điền `hbt.nhan_tuong.v1` → "Xem bài đọc ngay". Engine tắt → khối báo "đang chờ bật" + lối tự soi gương. Khối `DocAnhMat` cũ trong khảo sát bỏ.
- Thoả thuận `lib/dong-y-anh-mat.ts` (bản `am1`), xoá theo `xoaHoSo()`; "Dữ liệu của tôi" có dòng rút; Chính sách riêng tư `#anh-mat` viết lại (3 góc, thoả thuận riêng, máy chủ từ chối lượt thiếu).
- Kiểm: engine `test_anh1_nhieu_goc_va_kiem_tra_mat` + API 422/200; e2e `anh-chan-dung.spec.ts` (engine tắt thật → chờ bật; bật giả lập bằng route mock: không tích sẵn, chưa đồng ý không gửi, thân gửi có `dong_y` + góc + jpeg đã thu nhỏ, lọc mã lạ, xác nhận → khảo sát, nhớ thoả thuận, rút); QC ảnh 1280 / 390.

## 4. Việc của chủ dự án

Mục 4aa `docs/VIEC-CUA-ANH.md`: bật `NHAN_TUONG_DOC_ANH=1` trên Render **sau** khi có ý kiến luật sư về dữ liệu sinh trắc (hợp đồng xử lý với nhà cung cấp AI, hồ sơ đánh giá tác động, chuyển dữ liệu ra nước ngoài); duyệt (hoặc không) dependency MediaPipe cho phương án A ở GĐ2.
