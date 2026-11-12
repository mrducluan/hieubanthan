# Kiểm kê tri thức Tarot · Phong thuỷ · Huyền Không phi tinh (PT-NG1, 2026-11-12)

Mục tiêu chủ dự án giao: rà lại toàn bộ tri thức ba mảng đã nạp vào engine, đối chiếu với nguồn uy tín, bổ sung phần
thiếu; nguồn nào không tự lấy được thì báo để chủ dự án gửi. **Không nạp nguồn ít uy tín, chưa kiểm chứng.**

Khâu của vòng tăng trưởng: **nền móng cho QUAY LẠI** (lời luận có căn cứ thì người dùng mới tin và hỏi tiếp).
Đo bằng: số bảng tính / câu trích có test đối chiếu nguyên văn; về sau là tỉ lệ "Đúng với mình" của `ds.phongthuy.*`, `ds.tarot.*`.

## 1. Cách làm

1. Đọc cấu trúc và dòng nguồn của từng tệp KB + các hàm tính (CALC).
2. Thử mọi kho sách từ mạng của phiên làm việc. Kết quả: ctext, Wikisource, archive.org, Gutenberg, sacred-texts đều
   **bị chặn**; còn mở: kho Tứ khố toàn thư số hoá **kanripo** (qua GitHub).
3. Tải 10 bộ sách bản **Văn Uyên Các Tứ khố toàn thư**, cắt đúng các câu then chốt thành
   `engine/fixtures/nguon/phongthuy_co_thu.json` (script `engine/scripts/nap_nguon_phongthuy.py`).
4. Viết test `engine/tests/test_phongthuy_nguon.py` so từng bảng engine đang dùng với quy tắc ghi trong sách.
5. Chỉ thêm vào KB những gì đã có nguyên văn; phần chưa có nguồn ghi vào danh sách chờ (mục 4).

## 2. Kết quả đối chiếu

### 2.1 Phong thuỷ + Huyền Không — phép tính

| Phép tính trong engine | Nguồn đối chiếu (bản Tứ khố) | Kết quả |
|---|---|---|
| Bảng 8 du niên của cả 8 mệnh quái (`phongthuy.bang_huong`) | Hiệp Kỷ Biện Phương Thư, "Đại du niên biến quái" | **Khớp 8/8 quẻ** |
| Đông tứ / Tây tứ | Hiệp Kỷ: "nhị lão tương phối vi Tây tứ trạch…" | Khớp |
| Cung phi nam – nữ theo tam nguyên (`menh_quai`) | Hiệp Kỷ, "Nam nữ cửu cung" | Khớp (1864, 1924, 1984; nam lùi, nữ tiến) |
| 24 sơn thuộc 8 quẻ (`huyen_khong.QUAI`) | Hiệp Kỷ | Khớp 24/24 |
| Sao năm (`luu_nien`) | Hiệp Kỷ, tam nguyên tử bạch | Khớp |
| Sao tháng (`luu_nguyet`) | Hiệp Kỷ: Tý Ngọ Mão Dậu khởi 8, Thìn Tuất Sửu Mùi khởi 5, Dần Thân Tỵ Hợi khởi 2 | Khớp |
| Tam sát (`tuoi_dan_gian.han_nam`) | Hiệp Kỷ | Khớp |
| Bảng thế tinh (thế quái) | Thanh Nang Áo Ngữ, bốn câu ai tinh | **Khớp 12/24 sơn**; 12 sơn còn lại chỉ có trong Thẩm thị — chưa có nguyên văn |
| Hạ quái, phản – phục ngâm, nhập tù, hợp thập, đả kiếp | Thẩm Thị Huyền Không Học | **Chưa đối chiếu được** (không lấy được sách) |

Không phát hiện phép tính nào sai so với nguồn đã đọc.

### 2.2 Phong thuỷ — lời trong KB

| Phần KB | Tình trạng |
|---|---|
| `co_thu` (27 câu mới: Táng Thư, Trạch Kinh, Thanh Nang, Thiên Ngọc, Hiệp Kỷ) | Nguyên văn + phiên âm + nghĩa, test khoá từng chữ |
| `giai_thich` — 5 mục mới (phong thuỷ là gì · ngũ hư ngũ thực · du niên từ đâu · 24 sơn · tử bạch) | Có nguồn, hỏi đáp tự nhận theo từ khoá |
| `du_nien`, `quai`, `giai_thich` cũ (ghi nguồn "Dương Trạch Tam Yếu") | Tóm ý, **chưa có nguyên văn Dương Trạch Tam Yếu** |
| `bo_tri` 54 mục: 38 dân gian (đã ghi rõ), 16 ghi "cổ thư" | 16 mục "cổ thư" chưa có câu trích; phần lớn thuộc Dương Trạch Thập Thư — cần sách |
| `to_hop_81` (81 cặp sao), `sao`, `cuc`, `to_hop` | Viết lại từ Tử Bạch Quyết / Phi Tinh Phú / Thẩm thị — **chưa có nguyên văn** |
| Âm trạch | 3 mục, câu Táng Thư đã khớp nguyên văn |

Điểm cần sửa lời (chờ chủ dự án duyệt vì đổi chữ đang hiển thị):

- `bo_tri.tu_linh` ghi "trái (Thanh Long) nên cao hơn phải (Bạch Hổ)" và gắn nhãn cổ thư. Táng Thư chỉ nói bốn phía
  "Huyền Vũ cúi đầu, Chu Tước bay múa, Thanh Long uốn lượn, Bạch Hổ nằm phục" — **không** nói bên nào cao hơn. Ý "Long cao
  hơn Hổ" là câu truyền miệng đời sau → nên đổi nhãn thành dân gian hoặc sửa lời theo Táng Thư.
- `giai_thich.ngu_hoang`, `la_ban` đang ghi `source_id = duong_trach_tam_yeu` dù nội dung không thuộc sách đó → đổi nhãn nguồn.

### 2.3 Tarot

| Lớp | Tình trạng |
|---|---|
| Waite 1910 — 78 lá xuôi / ngược | Đã đối chiếu nguyên văn (TR-1b) |
| Book T — 52 lá, phẩm giá, decan | Đã đối chiếu (bản OCR archive.org) |
| Mathers 1888 — 78 lá | Đã đối chiếu (5/6 chương, thiếu Introduction) |
| **Lớp "đa số" của Book T** (bàn bài nghiêng về một bộ) | Có trong nguồn đã lưu nhưng KB chưa dùng → **đã thêm** `da_so` + hỏi đáp |
| Bảng "lá lặp" của Waite (4 Vua, 3 Hậu…) | Có trong nguồn; **không nạp**: lời kiểu bói bài cũ ("bệnh nặng", "bị phụ nữ lừa"), trái quy tắc không phán, không tên bệnh |
| Lớp Marseille (tên, hướng nhìn Conver, lời) | Tóm ý, chưa đối chiếu — cần Papus 1889, Wirth 1927 |
| Lớp Thoth (lời Crowley) | Tóm ý, chưa đối chiếu — cần Liber 78 (Equinox 1912) |
| Lớp B.O.T.A. (Case) | Tóm ý, chưa đối chiếu — cần Case 1920 |

## 3. Đã bổ sung trong đợt này

- `engine/fixtures/nguon/phongthuy_co_thu.json` — 27 đoạn nguyên văn từ 6 bộ sách bản Tứ khố.
- `engine/tests/test_phongthuy_nguon.py` — 44 ca: câu trích là nguyên văn; du niên, cung phi, 24 sơn, tử bạch, Tam sát,
  nửa bảng thế tinh khớp sách.
- `phongthuy_kb.json`: mục `co_thu` (27 câu), `doi_chieu` (sổ đã / chưa đối chiếu), 5 mục `giai_thich` mới.
- `phongthuy_huyen_khong.json`: mục `doi_chieu`.
- `tarot_kb.json`: mục `da_so` (7 câu Book T) + khái niệm hỏi đáp "nhiều lá cùng bộ nghĩa là gì".
- Không đổi phép tính, không đổi lời đang hiển thị → không tăng `ENGINE_VERSION`.

## 4. Nguồn còn thiếu — cần chủ dự án hỗ trợ

Hai cách, chọn một:

**Cách A (nhanh nhất): mở mạng** cho môi trường làm việc tới `zh.wikisource.org`, `en.wikisource.org`, `archive.org`,
`www.gutenberg.org`. Khi đó em tự tải và đối chiếu.

**Cách B: anh tải PDF / bản chữ lên Google Drive** (thư mục "Phong thuy nguon" và "Tarot nguon"):

| Ưu tiên | Sách | Dùng để | Tìm ở đâu |
|---|---|---|---|
| 1 | **沈氏玄空學** — Thẩm Thị Huyền Không Học (Thẩm Trúc Nhưng; bản 4 hoặc 6 quyển) | hạ quái, thế quái, thành môn, nhập tù, phản – phục ngâm, đả kiếp; kèm Tử Bạch Quyết, Phi Tinh Phú, Huyền Không Bí Chỉ, Huyền Cơ Phú cho 81 cặp sao | archive.org (tìm tên chữ Hán); bản dịch Việt của Nguyễn Anh Vũ dùng để tóm ý |
| 2 | **陽宅三要** — Dương Trạch Tam Yếu (Triệu Cửu Phong) | cửa – chủ – bếp, lời luận từng tổ hợp | Wikisource chữ Hán; bản dịch Việt |
| 3 | **八宅明鏡** — Bát Trạch Minh Kính | lời tám du niên, đặt bếp, giường | Wikisource / archive.org; bản dịch Việt của Thái Kim Oanh |
| 4 | **陽宅十書** — Dương Trạch Thập Thư | hình thế ngoài nhà (đường đâm, góc nhọn, đất méo…) cho 16 mục `bo_tri` đang ghi "cổ thư" | Wikisource (thuộc Cổ Kim Đồ Thư Tập Thành) |
| 5 | **地理辨正** — Địa Lý Biện Chính (Tưởng Đại Hồng), bản in có chú | cách giải Huyền Không của Thanh Nang, Thiên Ngọc; linh thần – chính thần | archive.org |
| 6 | **魯班經** — Lỗ Ban Kinh (bản khắc Minh / Thanh) | thước Lỗ Ban — chỉ làm công cụ khi có bản đáng tin | archive.org |
| 7 | Papus, *The Tarot of the Bohemians* (1892) hoặc bản Pháp 1889 | lớp Marseille | sacred-texts.com, archive.org |
| 8 | Crowley, *A Description of the Cards of the Tarot* (Liber 78, The Equinox I:8, 1912) | lớp Thoth | hermetic.com, archive.org |
| 9 | Paul Foster Case, *An Introduction to the Study of the Tarot* (1920) | lớp B.O.T.A. | archive.org |
| 10 | Oswald Wirth, *Le Tarot des imagiers du Moyen Âge* (1927) | lớp Marseille (hình, hướng nhìn) | archive.org, Gallica |
| 11 | Mathers 1888 — chương **Introduction** còn thiếu | hoàn tất bản Mathers | sacred-texts.com |

Sách hiện đại (bản dịch Việt, sách còn bản quyền): chỉ tóm ý và ghi nguồn, không chép nguyên văn — như quy tắc đang áp dụng.

Nguồn đã xem và **không dùng**: bản "Lỗ Ban toàn thư" trôi nổi trên mạng (văn bản hỏng, lẫn bùa chú); các bản chép
giản thể không rõ bản in của Địa Lý Biện Chính, Thiên Nguyên Ngũ Ca, Dương Trạch Chỉ Nam (chỉ đọc tham khảo, chưa đưa vào KB).

## 5. Đề xuất (chờ chủ dự án chọn)

1. **Hiện "Sách xưa nói gì"** (nguyên văn + phiên âm + nghĩa) trong báo cáo "Nhà của bạn" và 23 trang dấu hiệu — dùng
   chính mục `co_thu`. Cần sửa RULES + web và sinh lại bản đầu ra đóng băng.
2. **Sửa nhãn nguồn** các mục ở 2.2 (Thanh Long – Bạch Hổ, Ngũ Hoàng, la bàn).
3. **Nối lớp "đa số"** vào chương Tổng quan của bài đọc Tarot (hiện mới trả lời khi người dùng hỏi).
4. **Thành môn quyết, linh thần – chính thần**: thêm vào CALC sau khi có Thẩm thị (test viết trước, đối chiếu ví dụ trong sách) —
   khi đó gỡ được cờ `chua_doi_chieu_oracle` của thế quái.
5. **Thước Lỗ Ban**: nhiều người Việt hỏi, nhưng các cỡ 52,2 / 42,9 / 38,8 cm đang lưu hành không có trong cổ thư đã đọc;
   chỉ làm khi có bản Lỗ Ban Kinh đáng tin, và ghi rõ đâu là lệ thợ Việt.
6. **Sổ đối chiếu cho mọi KB**: mỗi tệp KB có mục `doi_chieu` (đã / chưa) + test nguồn như ba mảng này, để trang quản trị
   hiện được "bao nhiêu phần trăm tri thức đã có nguyên văn".
