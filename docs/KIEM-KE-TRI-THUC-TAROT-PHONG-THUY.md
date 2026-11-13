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

**Cập nhật cùng ngày:** chủ dự án đã duyệt mở mạng tới Wikisource, archive.org, Gutenberg. Dò lại:

- **Em tự tải được** (làm ở đợt 2, không cần anh gửi): Papus *The Tarot of the Bohemians* (archive.org, bản 1892), Wirth
  *Le Tarot des imagiers du Moyen Âge* (1927), Waite bản Gutenberg, Địa Lý Biện Chính (Wikisource chữ Hán).
- **Tìm không ra bản chữ** trên Wikisource / archive.org: Thẩm Thị Huyền Không Học, Dương Trạch Tam Yếu, Bát Trạch Minh
  Kính, Lỗ Ban Kinh; Case 1920 và Liber 78 cũng chưa thấy → **cần anh tải PDF lên Google Drive** (thư mục "Phong thuy
  nguon", "Tarot nguon"), các dòng ưu tiên 1, 2, 3, 6, 8, 9 trong bảng dưới.

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

## 6. Đợt 2 — bảy tệp chủ dự án gửi lên Drive (PT-NG2, 2026-11-12)

| Tệp | Đọc được | Dùng được gì |
|---|---|---|
| **Liber LXXVIII** (Crowley, The Equinox I:8, 1912) | Đủ 46 trang | Phạm vi công cộng. Cùng văn bản với Book T → bản chép thứ hai để soát. **Đã nạp** (dưới đây). |
| **Bát Trạch Minh Kính** (bản dịch Việt) | ~80 trang đầu | Bản dịch còn bản quyền → chỉ lấy dữ kiện. **Đã đối chiếu** (dưới đây). |
| Papus, *The Tarot of the Bohemians* (1919) | Chỉ ~44/350 trang (tệp 18 MB, trình đọc Drive cắt) | Chưa tới phần nghĩa lá. Em sẽ lấy bản chữ đủ từ archive.org. |
| Paul Foster Case, *The Tarot* (1947) | Chỉ tới lá số 2 (tệp 13 MB bị cắt) | Sách còn bản quyền ở Mỹ → chỉ tóm ý. Cần bản đủ. |
| Wirth, *Tarot of the Magicians* (bản dịch Anh 1985) | Tới lá XIX | Bản dịch còn bản quyền → chỉ tóm ý cho lớp Marseille; chưa làm ở đợt này. |
| **Dương Trạch Tam Yếu** (91 MB) | **Không** — ảnh quét, không có lớp chữ | Cần bản có chữ (PDF chữ, Word, txt) hoặc bản dịch Việt gõ chữ. |
| **Thẩm Thị Huyền Không Học** (1 MB) | Chỉ là bản xem thử vài trang (lời tựa + quảng cáo) của một sách viết lại năm 2010 | **Không dùng được.** Vẫn cần nguyên tác (bản 4 hoặc 6 quyển) hoặc bản dịch Việt đủ. |

Giới hạn kỹ thuật: công cụ đọc Drive của em cắt tệp lớn và không tải được tệp trên 10 MB. Tệp nhỏ hơn 10 MB, có lớp chữ, là đọc được trọn.

### Đã làm từ Liber 78

- `engine/fixtures/nguon/tarot_liber_78.json`: bảng 36 lá số (tên, hành tinh, cung), 22 ẩn chính (danh hiệu, chữ Hebrew, ứng chiêm tinh), luật phẩm giá, bảng đa số, bảng ba / bốn lá cùng số.
- Test mới trong `tests/test_tarot_nguon.py`: decan của **36/36** lá số, chiêm tinh **22/22** ẩn chính, luật phẩm giá trong engine đều khớp bản chép thứ hai này.
- Phát hiện và sửa 2 lỗi chép tên trong KB + tệp Book T cũ: "…; **he** King of the Spirits of Air" → "The King…" (Hiệp sĩ Kiếm); "THE LORD OF MATERIAL TROUBLE" viết hoa (5 Tiền).
- KB `tarot_kb.lap_la`: 28 câu "ba / bốn lá cùng số" của Book T (nguyên văn + nghĩa Việt trung tính) — thay cho bảng "lá lặp" của Waite đã loại ở đợt 1. Hỏi đáp nhận câu "ba lá số 7 nghĩa là gì", "bốn lá Át thì sao" (trước đây bị hiểu nhầm là hỏi trải bài ba lá).

### Đã làm từ Bát Trạch Minh Kính

- `engine/fixtures/nguon/phongthuy_bat_trach_minh_kinh.json` (chỉ dữ kiện): bài ca du niên 8 cung, xếp hạng tám sao, lệ gửi cung.
- Test: bảng hướng của engine khớp bài ca du niên **56/56 ô** (nguồn thứ hai, độc lập với Hiệp Kỷ); lệ "nam cung 5 gửi Khôn, nữ cung 5 gửi Cấn" nay có nguồn (câu quyết "nam ngũ ký nhị, nữ ký bát").
- **Không nạp**: câu "xoay bếp về Thiên Y thì bệnh không cần thuốc cũng giảm" (trái quy tắc sức khoẻ); phần cô hư sát, giá thú chu đường (ngoài phạm vi nhà ở).

### Còn thiếu sau đợt 2

1. **Thẩm Thị Huyền Không Học** bản đủ — vẫn là thiếu hụt lớn nhất (hạ quái, 12 sơn thế quái còn lại, nghĩa 81 cặp sao).
2. **Dương Trạch Tam Yếu** bản có chữ.
3. Dương Trạch Thập Thư, Lỗ Ban Kinh (chưa gửi).
4. Case, Papus: bản dưới 10 MB hoặc tách nhỏ; Papus em tự lấy từ archive.org.

## 7. Đợt 3 (PT-NG3, 2026-11-13) — hai kho mã GitHub anh gửi cho phần Thẩm thị

Anh gửi `xuanfu-web/dsh-metaphysics` (giấy phép MIT) và `voidforall/fengshui.skill` (không ghi giấy phép).

**Hai kho này không chứa nguyên văn Thẩm Thị Huyền Không Học.** Cả hai là phần mềm lập bàn phi tinh, và tự ghi rõ:
`fengshui.skill/references/sources.md` đánh dấu «沈氏玄空學 — chưa lấy được nguyên văn»; tài liệu đối chiếu của
`dsh-metaphysics` dẫn bài viết trên mạng (163, CSDN, Zhihu) và ghi «chưa so hàng loạt với bàn của bên thứ ba».
Vì vậy em **không nạp chúng như nguồn tri thức** — dùng làm **bộ đối chiếu độc lập** (như đã làm với lasotuvi cho Tử vi).
Máy phiên không cho chạy mã ngoài, nên em đọc quy tắc trong mã rồi so bằng test của mình.

| Hạng mục | Kết quả |
|---|---|
| Bảng thế tinh 24 sơn (khẩu quyết «子癸甲申貪狼一路行…») | khớp cả hai kho **24/24** (trước chỉ có 12/24 so được với Thanh Nang Áo Ngữ) |
| Hạ quái: quy tắc thuận – nghịch (sơn cùng nguyên trong cung của sao vận; sao 5 theo chính sơn) | cùng quy tắc ở cả ba bản |
| Cục vượng sơn vượng hướng, 9 vận × 24 sơn = 216 bàn | trùng bảng thông hành **9/9 vận** |
| Thượng sơn hạ thuỷ vận 7, vận 8; vận 9 toàn song tinh | trùng |
| Ba vận 20 năm từ 1864 | trùng |

**Ba chỗ các bản KHÁC nhau** (ghi ở `fixtures/nguon/phongthuy_huyen_khong_bang.json`, engine chưa đổi gì):

1. Ngưỡng kiêm hướng: engine và `fengshui.skill` 3°, `dsh-metaphysics` 4,5°.
2. Thế quái tra thế tinh của sơn nào: engine và `fengshui.skill` tra **sơn gốc** (đúng cách đọc phổ biến của Thẩm thị);
   `dsh-metaphysics` tra chính toạ / hướng sơn — bàn thế quái của kho này sẽ khác engine.
3. Sao 5 nhập trung khi thế quái: engine thay bằng thế tinh của chính sơn; `fengshui.skill` không thay.

Chỗ 2 và 3 chỉ nguyên văn Thẩm thị mới phân xử được → bàn thế quái vẫn mang cờ `chua_doi_chieu_oracle`.
Phần còn thiếu của Thẩm thị (81 cặp sao, lời đoán từng cục, ví dụ bàn thế quái) **vẫn thiếu** sau đợt này.

## 8. Đợt 4 (PT-NG4, 2026-11-13) — phần engine còn thiếu so với `fengshui.skill`

Anh giao nạp phần còn thiếu, có sách thì đối chiếu và sửa sau. Kho này **không ghi giấy phép**, nên em không chép chữ hay mã:
chỉ lấy đầu mục (tên tình huống, quy tắc truyền thống — vốn là điều chung của nghề) rồi tự viết lời theo khuôn của dự án.

So từng mục của kho với engine:

| Mục của `fengshui.skill` | Engine | Việc đã làm |
|---|---|---|
| Lập bàn phi tinh, thế quái, 4 cục, phản – phục ngâm, hợp thập | đã có | so chéo ở mục 7 |
| Tử bạch năm – tháng, Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng | đã có (khớp Hiệp Kỷ) | — |
| Bát trạch, cung phi, nạp âm, hợp – xung địa chi | đã có | — |
| Khe hẹp giữa hai toà nhà cao (天斬) | **thiếu** | thêm `bo_tri.thien_tram` |
| Đường / sông cong lưng vào nhà (反弓) | **thiếu** | thêm `bo_tri.phan_cung` |
| Đầu giường sát tường nhà vệ sinh | **thiếu** | thêm `bo_tri.dau_giuong_sat_wc` |
| Long – huyệt – sa – thuỷ – hướng (Địa Lý Ngũ Quyết) | **thiếu** | thêm `giai_thich.ngu_quyet` (`can_doi_chieu`) |
| Góc nhọn, cạnh tường chĩa vào (尖角, 壁刀) · đường đâm · cửa thông cửa · xà ngang · gương đối giường | đã có | — |
| Ngày Tuế Phá, ngày Thụ Tử (受死) trong chọn ngày | **chưa làm** | xem dưới |
| Nhà vệ sinh rơi vào cung có sao vượng | **chưa làm** | xem dưới |
| Tên gọi các cặp sao (二五交加…) | đã có 81 cặp | kho kia cũng chỉ liệt kê tên, chưa có nguyên văn |

Ba mục `bo_tri` mới đủ khuôn (lời đời thường, giải thích theo đời sống, ba việc theo chi phí, không vật phẩm). Hai mục
gọi theo tên của giới phong thuỷ Hồng Kông – Đài Loan thời nay được ghi rõ là **không có trong cổ thư**.

**Hai mục em chưa làm, kèm lý do:**

- *Ngày Tuế Phá, ngày Thụ Tử*: đưa vào là đổi kết quả trang Xem ngày tốt đang chạy; chính kho kia ghi hai mục này là
  "tục kỵ của thông thư, không thuộc hệ Hiệp Kỷ". Cần anh quyết có hiện như nhãn tập quán (không loại ngày) hay không.
- *Nhà vệ sinh ở cung sao vượng*: phải ghép mặt bằng với bàn phi tinh; lời đoán cần nguyên văn Thẩm thị.
