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

## 9. Đợt 5 (PT-NG5, 2026-11-13) — nhãn Tuế Phá / Thụ Tử + đưa tri thức cổ thư ra bài đọc

Anh duyệt làm nhãn và giao em tự chọn việc làm tăng giá trị cho người dùng.

**Hai nhãn ngày (Xem ngày tốt).** Em tìm được căn cứ ở chính Hiệp Kỷ Biện Phương Thư (bản Tứ khố):

- *Thụ Tử* (quyển 6): lịch cũ có thần này — tháng Dần khởi ở Tuất, sáu tháng dương đi Tuất → Mão, sáu tháng âm đi Thìn → Dậu — và
  sách triều Thanh **đã bỏ** khỏi bộ thần chính. Bảng em dùng khớp đúng quy tắc này (có test).
- *Tuế Phá* (quyển 3): sách chỉ nói đây là **phương** đối diện Thái Tuế; gọi "ngày Tuế Phá" (chi ngày xung chi năm) là thói quen của
  sách chọn ngày dân gian.

Cách làm: trường riêng `nhan_tap_quan` (không nằm trong danh sách kiêng dân gian) → **không loại ngày, không đổi "ngày đẹp",
không đổi kết quả chọn ngày theo việc**. Trang ngày hiện một dòng gập "Sách chọn ngày dân gian còn ghi: …", mở ra có nghĩa,
gốc gác và câu "hệ thống không loại ngày vì nhãn này". Mỗi nhãn rơi vào khoảng 1/12 số ngày.

**Tri thức đã nạp nay hiện cho người đọc** (trước chỉ nằm trong kho):

| Việc | Ở đâu |
|---|---|
| Mỗi chương báo cáo "Nhà của bạn" có một câu cổ thư (nguyên văn + phiên âm + nghĩa) | "Vì sao nói vậy" của 4 chương đầu: Bát trạch · hình thế · nhà ở · lịch năm |
| Bàn bài Tarot có ba / bốn lá cùng số → hộp nghĩa nền của cả bàn (Book T) | chương Tổng quan, mã kiểm chứng `ds.tarot.tong_quan.lap_la.*` |
| Một bộ chiếm quá nửa bàn → câu "A Majority of…" của Book T | "Vì sao nói vậy" của hộp Nguyên tố trội |

Không đổi mức, không đổi phép tính nào. Bản tiếng Anh giữ cùng cấu trúc (câu cổ thư chỉ hiện nguyên văn chữ Hán vì chưa có lời dịch được duyệt).

## 10. Đợt 6 (WS-1, 2026-11-13) — tự dò Wikisource tiếng Trung và nạp kho nguồn

Anh giao: "sách nào còn thiếu tri thức thì tự tìm Wikisource để nạp đầy đủ". Em thử **khoảng 140 tên sách** (cả tên gọi khác) trên
`zh.wikisource.org`, tải wikitext thô từng trang (trang bị giới hạn tốc độ nên tải chậm), làm sạch vỏ wiki — **không sửa chữ của sách** —
rồi đưa vào `engine/fixtures/nguon/`. Bộ nạp: `engine/scripts/nap_wikisource.py`; test: `engine/tests/test_ws1_kho_nguon_wikisource.py`.

### Đã nạp (14 sách, đều `can_doi_chieu: true` — bản gõ lại của người dùng Wikisource, chưa so bản khắc)

| Tệp kho nguồn | Sách | Môn | Số thiên · chữ | Ghi chú |
|---|---|---|---|---|
| `tang_san_boc_dich.json` | 增刪卜易 Tăng San Bốc Dịch | Kinh Dịch (Lục Hào) | 34 · 119.000 | trước chỉ có 4 chương; nay đủ 4 quyển. Người gõ tự ghi làm từ bản in nhiều lỗi; lời người gõ + phần "增訂" thời nay không nạp |
| `hoang_kim_sach.json` | 黃金策 Hoàng Kim Sách | Lục Hào | 33 · 22.000 | |
| `hoa_chau_lam.json` | 火珠林 Hoả Châu Lâm | Lục Hào | 74 · 20.500 | giản thể |
| `kinh_thi_dich_truyen.json` | 京氏易傳 Kinh Thị Dịch Truyện | Lục Hào (gốc nạp giáp, bát cung) | 67 · 27.500 | đủ 64 quẻ theo tám cung |
| `mai_hoa_dich_so.json` | 梅花易數 Mai Hoa Dịch Số | Mai Hoa | 111 · 40.000 | |
| `dia_ly_bien_chinh.json` | 地理辨正 Địa Lý Biện Chính | Huyền Không | 6 · 10.000 | Wikisource mới có Thanh Nang Kinh + Thanh Nang Tự kèm chú Tưởng Đại Hồng; chưa có Áo Ngữ, Thiên Ngọc, Bảo Chiếu |
| `thien_ngoc_kinh_noi_truyen.json` | 天玉經內傳 Thiên Ngọc Kinh Nội Truyện | Huyền Không | 3 · 9.900 | có lời chú |
| `thanh_nang_kinh.json` | 青囊經 Thanh Nang Kinh | Huyền Không | 1 · 6.100 | |
| `huyen_co_phu.json` | 玄機賦 Huyền Cơ Phú | Huyền Không (đoán sao) | 1 · 550 | |
| `ham_long_kinh.json` | 撼龍經 · 疑龍經 · 葬法倒杖 | Hình thế | 13 · 30.000 | |
| `nhan_tu_tu_tri.json` | 人子須知 Nhân Tử Tu Tri | Hình thế | 9 · 14.000 | giản thể, mới có phần đầu sách |
| `trich_thien_tuy.json` | 滴天髓 Trích Thiên Tuỷ | Bát tự | 51 · 13.500 | |
| `trich_thien_tuy_xien_vi.json` | 滴天髓闡微 Xiển Vi | Bát tự | 63 · 96.000 | giản thể |
| `than_phong_thong_khao.json` | 神峰通考 Thần Phong Thông Khảo | Bát tự | 1 · 154.000 | giản thể, một trang liền |

### Engine khớp chữ sách (test mới)

- Bảng **nạp giáp** tám quẻ khớp «渾天甲子章» của Tăng San Bốc Dịch 8/8 dòng. Bản gõ chép nhầm 艮 thành 辰 ở một dòng (ba chi là của quẻ Cấn) — đã ghi lại.
- **Lục thân theo cung** khớp «六親歌章» 25/25.
- **Mai Hoa**: chia 8 lấy quẻ (dư 0 là Khôn), chia 6 lấy hào động, lệ năm – tháng – ngày – giờ khớp chữ sách.

### Đã xem và KHÔNG nạp (giữ đúng "không nạp nguồn ít uy tín")

| Sách | Lý do |
|---|---|
| 五行精紀, 入地眼全書, 靈城精義 | bản gõ đổi giản → phồn bằng máy, sai kiểu 乙丑 → 乙醜, 吉凶 → 吉兇, 周 → 週 (Ngũ Hành Tinh Kỷ sai hơn 300 chỗ). Linh Thành Tinh Nghĩa là sách Tứ khố → nên lấy bản Kanripo |
| 玉匣記 | bản biên tập thời nay có lời dẫn hiện đại; nội dung chủ yếu bùa chú, ngày cúng — trái quy tắc không vật phẩm / giải hạn |
| 平砂玉尺經 | giản thể, không ghi bản; sách bị chính Tưởng Đại Hồng bác |
| 淵海子平, 窮通寶鑑 | trang ghi "No source" / không ghi bản, giản thể — không hơn bản kho đang có |
| 卜筮正宗 | mới gõ phần đầu quyển |
| 葬書, 宅經, 三命通會, 紫微斗數全書, 青囊奧語, 青囊序, 月波洞中記 | kho đã có bản Tứ khố / bản đủ hơn |

### Wikisource KHÔNG có (vẫn cần anh gửi bản gõ chữ)

沈氏玄空學 (Thẩm thị) · 陽宅三要 · 八宅明鏡 · 陽宅十書 · 魯班經 · 都天寶照經 · 飛星賦 · 玄空秘旨 · 紫白訣 · 雪心賦 · 子平真詮 (kho đã có từ nguồn khác) ·
麻衣相法 · 神相全編 · 柳莊相法 · 水鏡神相 · 相理衡真 · 協紀辨方書 (kho có phần trích bản Tứ khố).

### Chưa làm trong đợt này

Mới là **kho nguồn** (để đối chiếu và trích về sau), chưa có lời nào mới hiện cho người dùng. Việc nên làm tiếp, theo giá trị:
1. Huyền Cơ Phú + Thiên Ngọc Kinh Nội Truyện → đối chiếu 81 tổ hợp sao và thêm câu sách vào "Vì sao nói vậy" của báo cáo nhà.
2. Trích Thiên Tuỷ → câu sách cho 10 trang nhật chủ và chương "Con người bạn" của Bát tự.
3. Hoàng Kim Sách → câu sách theo 20 chủ đề hỏi quẻ.
4. Mai Hoa Dịch Số «八卦萬物類占» → đối chiếu loại tượng tám quái đang dùng.


## 11. Đợt 7 (WS-2, 2026-11-14) — sách không có trang riêng trên Wikisource: tìm nơi chép trọn

Nguyên tắc vẫn như cũ: chỉ nạp bản có nguồn gốc kiểm được (bộ sách khâm định / bản Tứ khố), không nạp bản trôi nổi.

### Đã nạp (đều `can_doi_chieu: true`)

| Tệp `fixtures/nguon/` | Sách | Lấy từ | Cỡ |
|---|---|---|---|
| `duong_trach_thap_thu.json` | 陽宅十書 Dương Trạch Thập Thư (Vương Quân Vinh, Minh) — đủ 10 thiên, từ «論宅外形第一» tới «論符鎮第十» | 《欽定古今圖書集成》 (1725) 藝術典 quyển 675–678 trên Wikisource | 91 mục, ~23.800 chữ |
| `than_tuong_toan_bien.json` | 神相全編 Thần Tướng Toàn Biên (Viên Trung Triệt đính chính, Minh) — đủ 14 phần | cùng bộ, quyển 631–644 | 445 mục, ~145.700 chữ |
| `chieu_dam_kinh.json` | 照膽經 Chiếu Đảm Kinh (sách tướng) | cùng bộ, quyển 645–646 | 60 mục, ~24.000 chữ |
| `kham_du_tu_kho.json` | 靈城精義 Linh Thành Tinh Nghĩa (Hà Phổ, Nam Đường) · 催官篇 Thôi Quan Thiên (Lại Văn Tuấn, Tống) · 發微論 Phát Vi Luận (Thái Nguyên Định, Tống) | bản Văn Uyên Các Tứ khố (Kanseki KR3g0025–0027) — thay bản Wikisource của Linh Thành đã loại ở WS-1 | 5 quyển, ~46.300 chữ |

- Cổ Kim Đồ Thư Tập Thành là loại thư khâm định đời Thanh, in đồng 1725; Wikisource gõ lại từng trang từ bản chụp. **Chấm câu trên
  Wikisource là của người gõ (CC BY-SA 4.0), không phải của sách → bộ nạp bỏ hết**, giữ chữ sách như bản Tứ khố (không chấm câu).
- Bộ nạp: `engine/scripts/nap_co_kim_do_thu.py`, `engine/scripts/nap_kham_du_tu_kho.py`. Test: `engine/tests/test_ws2_kho_nguon_bo_sung.py`
  (đủ chữ, đúng sách, không lẫn sách đứng trước trong cùng quyển, không còn dấu chấm câu thời nay).
- **Không dùng cho lời hiển thị**: thiên «論符鎮第十» của Dương Trạch Thập Thư (bùa trấn, chôn vật) và các câu phán sống chết, khắc hại
  trong Thần Tướng Toàn Biên — chỉ để đối chiếu. Phần dùng được: luận hình thế ngoài nhà, đại du niên, cửa, nước, hình thế trong nhà
  (Dương Trạch Thập Thư thiên 1–8); bộ vị, 12 cung, lưu niên, khí sắc (Thần Tướng Toàn Biên) — đối chiếu được với KB Bát trạch và Nhân tướng.

### Còn phải nhờ anh tải về (không có bản chữ kiểm được trên mạng mở)

Bản trên archive.org là **ảnh quét**, máy phiên này không tải được tệp để kiểm lớp chữ; kinh nghiệm các lần trước: lớp chữ nhận dạng tự động
của các bản quét 2026 không dùng được. Anh tải bản PDF, nếu có lớp chữ thì gửi lên Drive (mỗi tệp < 10 MB):

| Sách | Link |
|---|---|
| 沈氏玄空學 Thẩm Thị Huyền Không Học | `archive.org/details/zengguangshenshi0000shen` (bản in lại, chỉ cho mượn đọc) |
| 陽宅三要 Dương Trạch Tam Yếu (+ 地理五訣) | `archive.org/details/20260507_20260507_0914` |
| 八宅明鏡 Bát Trạch Minh Kính | `archive.org/details/20260507_20260507_0702` |
| 魯班經 Lỗ Ban Kinh | `archive.org/details/02090255.cn` (新鐫工師雕斲正式魯班木經匠家鏡, bản khắc, 3 MB) · `20260605_20260605_0605` · `1_20260605_20260605_0652` · `2_20260605_20260605_0658` |
| 雪心賦 Tuyết Tâm Phú (+ 水龍經…) | `archive.org/details/20260509_20260509_0800` |
| 地理五訣 Địa Lý Ngũ Quyết | `archive.org/details/20211030_20211030_0715` |
| 陽宅大全 Dương Trạch Đại Toàn | `archive.org/details/02094260.cn` … `02094266.cn` · `20260508_20260508_0108` |
| 神相水鏡集 Thần Tướng Thủy Kính Tập | `archive.org/details/20260507_20260507_0042` · `20260503_20260503_1427` |
| 袁柳莊神相全編 (Liễu Trang) | `archive.org/details/20260503_20260503_1414` |

Tài liệu học thuật có bản đọc được (để đối chiếu, có bản quyền → chỉ tóm ý): bản chú giải tiếng Nhật 陽宅十書 (chép từ Cổ Kim Đồ Thư Tập Thành)
`omu.repo.nii.ac.jp/record/4433`, `/4450`; bản dịch chú 魯班経 `omu.repo.nii.ac.jp/record/4354`.

**Chưa thấy bản nào có nguồn gốc rõ**: bản gõ chữ Thẩm Thị Huyền Không Học; 麻衣相法 Ma Y Tướng Pháp, 柳莊相法 Liễu Trang Tướng Pháp
(bản lưu hành là bản biên tập muộn); 都天寶照經, 玄空秘旨, 紫白訣, 飛星賦, 相理衡真. ctext.org có vài sách này nhưng
điều khoản trang cấm tải tự động → em không lấy; anh mở trang đọc được nếu cần.
