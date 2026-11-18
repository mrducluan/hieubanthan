# Kỳ Môn Độn Giáp — nguồn tri thức (KM-0, 2026-11-18)

Chủ dự án quyết 18/11/2026: làm **mảng Kỳ Môn đầy đủ** và đưa tri thức Kỳ Môn vào các phần đang có (Hôm nay, Xem ngày tốt,
la bàn Phong thuỷ, Thời gian tới). Tài liệu này ghi nguồn đã nạp, nguồn bị loại, sách cần anh gửi và thứ tự làm.
Nguyên tắc như các mảng khác: **kho nguồn trước, lời sau**; cổ thư dùng nguyên văn, sách còn bản quyền chỉ rút quy tắc.

## 1. Đã nạp vào `engine/fixtures/nguon/` (đều `can_doi_chieu`, chưa có lời nào hiện cho người dùng)

| Tệp | Sách | Nguồn lấy | Cỡ | Dùng để |
|---|---|---|---|---|
| `don_giap_dien_nghia.json` | 遁甲演義 — Độn Giáp Diễn Nghĩa, Trình Đạo Sinh (Minh), 4 quyển | Bản Văn Uyên Các Tứ khố toàn thư, Kanseki `KR3g0048` | 34.217 chữ Hán (đủ như bản gõ) | Nguồn gốc độn giáp, định cục, siêu thần – tiếp khí – trí nhuận, trực phù – trực sử, cách cục |
| `ky_mon_co_kim_do_thu.json` | Phần 奇門遁甲 của Cổ Kim Đồ Thư Tập Thành (1725), 藝術典 quyển 703–714 + 2 mục tổng luận quyển 745 | Wikisource tiếng Trung (gõ từ bản chụp in đồng), bỏ chấm câu thời nay | 411 mục, ~140.000 chữ | Xem bảng dưới |

Trong 12 quyển Cổ Kim Đồ Thư:

| Quyển | Nội dung | Giá trị |
|---|---|---|
| 703–704 | 煙波釣叟歌句解 — bài ca Yên Ba Điếu Tẩu kèm lời giải từng câu | Khẩu quyết gốc của cả môn; dùng làm câu trích |
| 705 | 景祐遁甲符應經纂 — trích sách đời Tống của Dương Duy Đức, 56 mục «釋…» | Định nghĩa từng cách cục (thiên độn, địa độn, phản ngâm, phục ngâm, môn bách, kỳ nhập mộ…) |
| 706 | 遁甲穿壬 | Lời ứng theo cửa, sao, kỳ nghi |
| 707 | Thơ đoán tám cửa, chín sao, tam kỳ lục nghi; ~100 mục «占…» theo việc | Kho lời theo việc (cầu tài, thi cử, hùn vốn, vay mượn, đi xa…) — nhiều lời nặng, phải qua khuôn SX-C |
| 708 | 凡例, 口訣, 閏奇超神接氣直指, 諸格 | Cách lập bàn và phép trí nhuận, viết thành quy tắc |
| 709–712 | **Bảng đủ 18 cục × 60 giờ**: trực phù, trực sử, cửa, cách cục từng giờ | Golden cho phép tính, lấy thẳng từ sách |
| 713–714 | 日家奇門 — Kỳ Môn theo ngày | Dùng cho lớp "ngày" ở Xem ngày tốt |

Đã kiểm (`engine/tests/test_km0_kho_nguon_ky_mon.py`): đủ 18 cục; 108 ô trực phù / trực sử đầu sáu tuần của 18 cục khớp
quy tắc "dương độn lục nghi đi thuận, âm độn đi nghịch" (quy tắc viết từ khẩu quyết, không lấy từ engine). Bộ đọc nhận ra
1.074 / 1.080 dòng giờ; vài dòng bản gõ sai khuôn (vd 輛 thay 輔, một chỗ ghi 〔缺〕) — sẽ soát khi dựng golden.

Chưa có: chữ nằm trong HÌNH bàn (Wikisource vẽ thành ảnh) không vào kho. Phần bùa chú, bước cương, phép trận (quyển 4
Độn Giáp Diễn Nghĩa, một số mục quyển 705–707) chỉ để đối chiếu, **không ra lời**.

## 2. Đã xem và loại

| Nguồn | Lý do |
|---|---|
| Wikisource 《奇門遁甲統宗》, 《遁甲演義》, 《奇門遁甲元靈經》 | Bản gõ **giản thể**, kèm lời tựa thời nay, không ghi bản in — cùng loại đã loại ở WS-1. Độn Giáp Diễn Nghĩa đã có bản Tứ khố thay |
| Wikisource 《煙波釣叟歌》 (trang riêng) | Chỉ có bài ca, không ghi bản; bản có lời giải ở quyển 703–704 tốt hơn |
| Đạo Tạng (các kinh "độn giáp" trong Kanseki KR5) | Sách pháp thuật, bùa chú — trái quy tắc không nạp bùa, trấn yểm |
| Sách Kỳ Môn "chuyển vận", bày vật phẩm; lá số Kỳ Môn trọn đời | Thuyết hiện đại, không có cổ thư; trái quy tắc vật phẩm |

## 3. Em tự lấy được thêm (chưa làm)

- 太白陰經 (Lý Thuyên, Đường; Kanseki `KR3b0011`) và 武經總要 (Tống; `KR3b0012`) — có thiên độn giáp, là bản chép sớm
  nhất còn lại; dùng để đối chiếu quy tắc với sách Minh – Thanh.
- 協紀辨方書 đã có trong kho: các đoạn bàn về siêu thần – tiếp khí – trí nhuận.

## 4. Sách cần anh gửi (Drive, PDF bôi đen được chữ hoặc tệp chữ, mỗi tệp dưới 10 MB)

Tên tác giả em ghi theo trí nhớ, anh kiểm lại khi tìm sách.

| Ưu tiên | Sách | Vì sao cần |
|---|---|---|
| 1 | 御定奇門寶鑑 — Ngự Định Kỳ Môn Bảo Giám (Thanh) | Bản tổng hợp của triều Thanh, lời đoán theo việc có hệ thống |
| 1 | 奇門遁甲統宗 — Kỳ Môn Độn Giáp Thống Tông (Minh), bản **phồn thể có ghi bản in** | Sách thực hành đầy đủ nhất; bản Wikisource không dùng được |
| 2 | 奇門遁甲秘笈大全 — Bí Kíp Đại Toàn (đề Lưu Bá Ôn) | Sách phổ biến nhất ở Việt Nam (có bản dịch); cần chữ Hán để trích |
| 2 | 景祐遁甲符應經 — bản đủ 3 quyển (Dương Duy Đức, Tống) | Kho hiện chỉ có phần trích ở quyển 705 |
| 3 | 奇門旨歸 (Chu Hạo Văn, Thanh) · 奇門法竅 (Tích Mạnh Trĩ, Thanh) · 奇門一得 (Cam Thời Vọng, Thanh) | Giải thích phép trí nhuận và chuyển bàn rõ nhất; giúp chọn phái mặc định |
| Tham khảo | Sách Việt (Đàm Liên, bản dịch Nguyễn Mạnh Bảo), sách hiện đại Trung – Anh | Còn bản quyền: chỉ lấy thuật ngữ Hán Việt / tiếng Anh và quy tắc, không chép câu, không đưa tệp vào repo |

## 5. Việc cần chốt trước khi viết phép tính

1. **Phép định cục mặc định**: trí nhuận (sách Tứ khố và quyển 708 trình bày) hay sách bổ (phần mềm ngày nay hay dùng).
   Em đề xuất làm cả hai, người dùng đổi được như khung Trường phái của Tử vi; chọn mặc định sau khi đọc nguyên văn.
2. **Chuyển bàn hay phi bàn**: bảng 18 cục của Cổ Kim Đồ Thư là căn cứ; em sẽ báo bảng ấy theo lối nào khi dựng golden.
3. **Bộ đối chiếu**: `kinqimen` (PyPI ghi MIT) chỉ để sinh golden, không chạy runtime — cần anh duyệt, em sẽ đọc tệp
   giấy phép trước khi dùng.

## 6. Thứ tự làm (mỗi bước một PR, anh duyệt riêng)

| Bước | Việc | Khâu |
|---|---|---|
| KM-0 (PR này) | Kho nguồn + test | Nền móng |
| KM-1 | CALC lập bàn giờ (test trước; golden = bảng 18 cục của sách + bộ đối chiếu) | Nền móng |
| KM-2 | KB tám cửa, chín sao, tám thần, cách cục (câu trích khớp kho nguồn, lời theo SX-C / CY-1) + bài đọc + trang `/ky-mon` + cụm kiến thức | Thu hút, Quay lại |
| KM-3 | Đưa vào Hôm nay (giờ và hướng), Xem ngày tốt (giờ + hướng theo việc), la bàn Phong thuỷ, Thời gian tới | Quay lại |
| KM-4 | Hỏi việc theo Kỳ Môn, cổng Sao, bản `/en` | Nạp Sao |
