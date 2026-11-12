# Rà kho tri thức (668 trang) — KB-TT1, 2026-11-12

Chủ dự án giao: kiểm tra phần "nháp AI", viết lại / kiểm định như chuyên gia E-E-A-T, làm bài dày hơn, thêm hình có alt chuẩn SEO, xem còn thiếu gì, có phải nội dung cho SEO không.

## 1. Điều em KHÔNG làm (và vì sao)

**Không gắn "đã thẩm định" / tên Đức Luân vào bài em viết.** E-E-A-T là tín hiệu về *người thật đã đọc*: khai sai
người kiểm duyệt là rủi ro với Google (nội dung gian dối) và với pháp lý. Quy tắc EEAT-1 / DX-1 trong CLAUDE.md giữ nguyên.
Số "chuyên gia thẩm định: 0" trên bảng quản trị là đúng thực tế; muốn nó tăng phải qua Phòng duyệt
(`scripts/ap_duyet.py`) — em chỉ có thể làm bài đủ tốt để anh duyệt nhanh.
Em cũng không bịa "kinh nghiệm cá nhân" — phần đó chỉ chuyên gia thật viết được (`goc_nhin`, GN-1).

## 2. Hiện trạng đo được (engine, trước đợt này)

| Họ trang | Số | Chữ/trang (trung vị) | Phần riêng | Bảng | Trích sách | Ảnh tóm tắt |
|---|---|---|---|---|---|---|
| Sao ở cung | 168 | 818 | 0,38 | 82 | không | **không** |
| Mệnh theo năm | 78 | 976 | **0,34** (ngưỡng noindex 0,30) | không | không | **không** |
| Lá bài | 78 | 827 | 0,68 | 78 | không | có |
| Quẻ Kinh Dịch | 64 | 872 | — | có (cấu trúc quẻ) | chỉ ghi nguồn | **không** |
| Bộ vị nhân tướng | 25 | 640 | 0,65 | 22 | không | **không** |
| 14 chính tinh | 14 | 827 | — | không | không | **không** |
| 12 cung | 12 | 669 | 0,96 | không | không | **không** |
| 11 họ đã có bổ sung SEO-M | 223 | 730–1.190 | 0,53–0,93 | có | có | có |

Kết luận: không có trang mỏng dưới 600 chữ (trừ vài bộ vị), nhưng **361 trang chưa có ảnh tóm tắt** và
2 họ lớn (mệnh theo năm, sao ở cung) có phần riêng sát ngưỡng — rủi ro bị hạ noindex khi KB đổi.

## 3. Đã làm trong PR này

1. **Ảnh tóm tắt cho 361 trang** (`kb/y_chinh_tu_dong.py`): 3–5 ý chính **rút nguyên từ chính trang**, không thêm dữ kiện
   → ảnh `/og/y-chinh` (có QR + hieuban.com) + `ImageObject` trong schema. Hiện 100 % họ trang (trừ Cốt Tuỷ Phú) có ảnh.
2. **Alt ảnh** đổi từ chuỗi dài tới ~450 ký tự sang ngắn: `Infographic {tên trang}: {hai ý đầu}` (Google khuyên alt ngắn,
   mô tả đúng ảnh; đủ các ý nằm trong chữ của trang).
3. **26 trang trụ viết thêm tay** (14 chính tinh, 12 cung): mục trả lời câu người ta gõ ("Sao X khác sao Y?", "Hợp nghề nào?",
   "Cung Z có đoán được … không?"), ví dụ lá số giả định, việc làm được trong tuần, bảng dữ kiện thật (sao phụ đi cùng;
   cung đối diện / tam hợp / kề — tính từ vòng 12 cung), hỏi đáp thêm (có câu "năm can nào sao X hoá Lộc/Quyền/Khoa/Kỵ"
   tính từ bảng tứ hoá của engine; Thiên Tướng, Thất Sát không có tứ hoá được nói rõ), trích *Tử Vi Đẩu Số Toàn Thư*.
   Chữ/trang: sao 827 → 1.450, cung 669 → 1.175. Qua đủ luật `test_kb_bo_sung.py` (không giọng AI, không cụm cấm, SK-1, BM-1).

## 4. "Phần này có cho SEO không?"

Có — đây là lớp trang đuôi dài (≈ 670 URL, sitemap theo cụm) và cấu trúc kỹ thuật đã tốt: Article + FAQPage + Breadcrumb,
bản `.md`, canonical, ngày đăng/sửa thật, bộ rà `kiem-tra-seo.mjs` 0 lỗi. Việc này **không** đảm bảo thứ hạng. Rủi ro còn lại:

- **Chưa được Google lập chỉ mục** (audit 2026-11-05: ~862 URL "Đã phát hiện – chưa lập chỉ mục", suất thu thập thấp) — do tín hiệu
  site mới, không do lỗi kỹ thuật. Cách đỡ: link nội bộ từ trang trụ, IndexNow, backlink thật.
- **Chính sách nội dung hàng loạt**: trang dựng theo khuôn + nháp ban biên tập. Đỡ rủi ro bằng phần riêng ≥ 30 %, bảng dữ kiện
  tính thật, hỏi đáp riêng từng trang — và quan trọng nhất là **người thật thẩm định** (mục 5).
- **Em chưa có số thật** (Search Console đang nối với một website khác, không phải hieuban.com) nên không đánh giá được trang nào
  đang có hiển thị. Anh nối đúng property thì em đo và xếp ưu tiên theo số.

## 5. Còn thiếu / đề xuất (xếp theo giá trị)

1. **Thẩm định thật (E-E-A-T lớn nhất)**: Đức Luân đọc 26 trang trụ + 12 trang đã duyệt, viết `goc_nhin` 2–4 câu kinh nghiệm thật;
   hàng đợi xếp theo Search Console (`scripts/tham_dinh.py hang-doi --gsc`). Em đề xuất duyệt theo cụm 20–30 trang/lần.
2. **Đợt 2 nội dung** cùng khuôn: mệnh theo năm (78, phần riêng thấp nhất — thêm bảng "tuổi hợp theo cung phi" + so với năm
   sinh liền kề), quẻ (64 — ví dụ hỏi việc, quẻ biến thường gặp), sao ở cung (168 — ví dụ + bảng sao phụ theo cung), lá bài (78),
   bộ vị (25 — thêm trích Ma Y / Thần Tướng Toàn Biên có nguyên văn đã đối chiếu).
3. **Đối chiếu nguyên văn** các trích dẫn mới với bản ctext (mới ghi tên sách + chương, chưa chép nguyên văn; "Chư tinh vấn đáp luận" cần xác nhận lại tên mục trên bản khắc).
4. **Ảnh minh hoạ có hồn hơn**: hiện là infographic vẽ bằng code (nhất quán, có QR). Ảnh AI cho vài trang trụ cần dịch vụ tạo ảnh
   (chờ anh chọn; không bịa ảnh "người thật").
5. Gỡ nhãn "nháp" khỏi tiêu đề trang chỉ sau khi trang có tên người thẩm định; trước đó giữ nhãn trung thực.
6. Liên kết nội bộ: trang cung ↔ trang sao ↔ trang "sao ở cung" đã có; thêm khối "đọc cùng" 3 link cuối bài ở trang mệnh theo năm.

## 6. Cập nhật 2026-11-12 (sau khi nối Search Console hieuban.com)

Số thật 90 ngày (14/08–12/11): **1.650 lượt hiển thị, 47 nhấp, 284 trang có hiển thị**. Nhóm kho tri thức có hiển thị: dấu hiệu nhà (20 trang, 186),
mệnh theo năm (14 trang, 96), cặp số (13, 62), tứ hoá (9, 23), sao ở cung (10/168 trang, 16), quẻ (5/64, 12).
Site còn rất nhỏ nên chưa kết luận được trang nào "thắng"; ưu tiên viết dày theo họ có hiển thị trước.

- **Mệnh theo năm (78 trang)**: thêm bảng "tuổi mụ và năm âm lịch 2026–2031 so với tuổi bạn" + hai câu hỏi đáp tính từ năm sinh
  (tuổi năm 2027; năm cùng mệnh). Em đã thử thêm bảng "năm sinh liền kề" nhưng bảng này trùng giữa các trang kề nhau và kéo 31 trang xuống dưới
  ngưỡng phần riêng (sẽ bị noindex) nên bỏ. Kết quả: phần riêng 0,34 → 0,35, trang thấp nhất 0,31 (cũ 0,30), cả 78 trang vẫn index, chữ 976 → 1.183.
  **Muốn nâng phần riêng thật sự phải bớt khuôn chung của họ trang này (việc lớn hơn)**, chỉ thêm chữ không giải quyết được.
- **Chưa làm được**: (3) đối chiếu nguyên văn — ctext chặn bot, Wikisource không truy cập được từ môi trường này; (4) ảnh AI — không có dịch vụ tạo ảnh kết nối.
- **Không làm**: viết "kinh nghiệm 30 năm" dưới tên chuyên gia. Đó là tín hiệu E-E-A-T giả; `goc_nhin` chỉ do chính người đó viết (GN-1).
