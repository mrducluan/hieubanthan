# Đề xuất: lấy Ý (quy tắc) từ bài giảng Tử vi hiện đại, viết lại bằng lời mình, lối khơi gợi

> Trạng thái: **NHÁP, chờ chủ dự án duyệt.** Chưa nối vào RULES / NARRATIVE / web nào.
> Tệp nháp: `engine/app/kb/data/tuvi_y_bo_sung.json` (200 mục, TV-YBS đã nối theo trường `hien_thi`) · bộ đọc `engine/app/kb/tuvi_y_bo_sung.py` · test: `engine/tests/test_kb_y_bo_sung.py`.
> Đối chiếu mục tiêu tăng trưởng: nền móng cho khâu **QUAY LẠI + NẠP Sao** — lời luận Tử vi có thêm chi tiết cụ thể
> (ai ảnh hưởng hôn nhân, khi nào hợp thi / hợp tác / di chuyển, nghề nào hợp) thì chương đời sống đáng đọc tiếp hơn;
> đo bằng tỉ lệ "Đúng với mình" của các hộp mới (`ds.*`) và `reading_completed{mo_dun=tuvi}`.

## 1. Câu hỏi của chủ dự án và trả lời ngắn

**Hỏi:** Bài giảng Tử vi *Thiên Kỷ* của Nghê Hải Hạ (bản chép trong repo `Renhuai123/ziwei-doushu`, giấy phép
CC BY-NC-SA — cấm thương mại, mà mình bán Sao) — có lấy được **ý** rồi viết lại bằng lời mình, đổi lời phán nặng /
lời về bệnh thành lời gợi mở không?

**Trả lời:** Được, **ở mức quy tắc** (điều kiện → ý nghĩa), với các ràng buộc ở mục 2. Không được lấy **cách diễn đạt**,
**lựa chọn và sắp xếp** của họ. Đây là đánh giá của em, không phải ý kiến pháp lý — nên hỏi luật sư một lần (mục 7, câu 1).

## 2. Lý lẽ pháp lý (để chủ dự án đọc, không phải tư vấn luật)

1. **Quyền tác giả bảo hộ cách thể hiện, không bảo hộ ý tưởng.** Luật SHTT Việt Nam (Điều 15 khoản 3) loại khỏi phạm vi
   bảo hộ "quy trình, hệ thống, phương pháp hoạt động, khái niệm, nguyên lý, số liệu". Công ước Berne và luật Mỹ
   (17 U.S.C. §102(b)) cùng nguyên tắc. Một luật Tử vi kiểu "Hồng Loan ở cung Phụ Mẫu → cha mẹ ảnh hưởng chuyện cưới"
   là một *quy tắc/phương pháp*, không phải *câu văn*.
2. **Giấy phép CC chỉ điều chỉnh việc dùng phần có bản quyền.** Dùng ý tưởng / sự kiện không cần xin phép, nên điều kiện
   NC (phi thương mại) và SA (chia sẻ giống nhau) không áp cho nội dung ta tự viết từ ý — miễn ta không chép câu,
   không dịch sát, không tái tạo cấu trúc.
3. **Cái có thể bị bảo hộ ngoài câu chữ:** tuyển chọn và sắp xếp (bộ "11 quyển", cây đề mục, thứ tự 12 bài theo vị trí
   Tử Vi, các ca thật). Vì vậy tệp nháp **xếp theo khung KB của mình** (sao_cung / hôn nhân / nghề / thời điểm…),
   không theo đề mục nguồn, không mang ca nào, và chỉ lấy một phần nhỏ đã lọc (200 ý trên 1.848 câu).
4. **Phần lớn quy tắc vốn có trong văn học Tử vi chung** (Toàn Thư, các sách phổ thông). Tệp đánh dấu `co_trong_co_thu`
   và `rieng_phai` để ưu tiên đưa vào trước những ý **không đặc thù** của riêng một người.

**Những việc ta KHÔNG BAO GIỜ làm:** trích câu (kể cả một câu ngắn); dịch từng câu; dùng ca thật / tên người được
xem số; dẫn số tập, mốc thời gian video, đường dẫn; ghi tên người giảng hay tên khoá học trên trang công khai (BM-1);
dùng `lib/nihai/renji.ts` (thuốc, châm cứu), `lib/nihai/diji.ts` (phong thuỷ), mọi bài thuốc; dùng bảng "chấm sao hợp
đôi ★" và "tiêu chí điểm" trong `heming-knowledge.ts`; dùng phần xem tướng mặt, khí sắc, "sắc mặt sắp chết".

## 3. Cách làm

1. Đọc toàn bộ `docs/tianji-ziwei/entries.jsonl` (1.848 câu ngắn, tiếng Trung), `lib/ziwei/heming-knowledge.ts` (hôn nhân
   theo sao ở Phu Thê, có nhiều câu phán nặng) và phần Tử vi của `lib/nihai/tianji.ts` (4 chương tóm tắt).
2. Phân loại câu theo kiểu quy tắc (mục 4), bỏ phần ngoài phạm vi.
3. So với KB đang có: `tuvi_kb.json`, `tuvi_doi_song_kb.json` (14 sao × 12 cung × sáng/hãm), `tuvi_cach_cuc.json`
   (75 cách), `tuvi_phi_hoa_kb.json`, `tuvi_hai_nguoi_kb.json`. Chỉ giữ ý **ta chưa có**, hoặc có rồi nhưng ý nguồn thêm
   một sắc thái cụ thể (khi đó `trung_voi` trỏ vào mục KB đang có — 130/200 mục).
4. Viết lại từng ý bằng lời mình: `y_goc_tom_tat` (ý nguồn, tóm trung tính, được dùng thuật ngữ) → `loi_doi_thuong`
   (1–2 câu đời thường, không tên sao/cung, không số) → `viec_nen_lam` (một việc cụ thể).
5. Test khoá ranh giới (mục 6).

## 4. Kiểm kê nguồn (phân loại theo đề mục + từ khoá, xấp xỉ)

| Nhóm | Số câu | Ghi chú |
|---|---:|---|
| Phương pháp, quan điểm, lời dặn người học | 330 | Lấy ~12 nguyên tắc (đọc cung đối, đại hạn chính, "mệnh tốt không bằng hạn tốt"…) |
| Hôn nhân (Phu Thê, Phúc Đức, Hồng Loan/Hỷ, hợp lá số) | 206 | Nhiều câu "sinh ly tử biệt", "khắc", "làm lẽ" — chỉ lấy ý, đổi lời |
| Sao ở cung | 197 | |
| Cặp sao / cách cục | 156 | Đa số đã có trong 75 cách của ta |
| Tính chất sao | 151 | |
| Tứ hoá | 144 | |
| Nghề nghiệp, tiền bạc (Tài Bạch, Quan Lộc) | 99 | |
| Thời điểm (đại hạn, lưu niên, tiểu hạn, "qua Kỵ") | 64 | |
| Sức khoẻ — gắn chi với tạng phủ, sát tinh vào Tật Ách | 66 | Bỏ mọi tên bệnh, "trí mạng"; giữ bộ phận + đi khám |
| Độ sáng sao | 35 | |
| **Ngoài phạm vi** — tướng mặt, khí sắc, tay | 224 | Không dùng |
| **Ngoài phạm vi** — phong thuỷ / dương trạch | 145 | Không dùng (đã có mảng Phong thuỷ riêng) |
| **Ngoài phạm vi** — bói quẻ, nghĩa lý | 31 | Không dùng |
| **Tổng** | **1.848** | Nhiều câu là lời kể ca, không thành quy tắc |

`heming-knowledge.ts`: 14 sao ở Phu Thê + 4 hoá ở Phu Thê + "phương pháp hợp lá số" + 9 sao phụ hôn nhân + thang ★.
Lấy: Thiên Tướng → bạn đời từ người quen; Thiên Cơ → chênh tuổi bù nhau; Thiên Lương → mối đầu dễ dang dở; Thất Sát →
nhanh đến nhanh nguội; Phu Thê người này ↔ Mệnh người kia; hai người cùng Sát Phá Tham; đại hạn hai người cùng thuận;
Cô Thần/Quả Tú. Không lấy: thang ★, "tiền kiếp nợ nhau", tuổi cưới bằng con số.

## 5. Tệp nháp — con số

- **200 mục**: sao_cung 42 · hon_nhan 38 · thoi_diem 29 · nghe_nghiep 27 · suc_khoe_phong_ngua 22 · cap_sao 17 ·
  phuong_phap 15 · tu_hoa_cung 10.
- `co_trong_co_thu`: có 47 · không 20 · chưa rõ 133 (người rành Toàn Thư cần đánh dấu lại — em không được tra ctext).
- `rieng_phai`: 103 mục có vẻ riêng của trường phái này; 97 mục là ý chung.
- `dieu_kien.co_the_tinh`: 190 mục engine đã có đủ dữ kiện để kiểm (sao, cung, độ sáng Nam phái, hoá, chi, hạn);
  10 mục là lời diễn giải không cơ học hoá được.
- Mọi mục: `source_id = tham_khao_hien_dai`, `school_id = trung_chau_hien_dai` (tên tạm), `trang_thai = nhap`,
  `can_duyet = true`.

## 6. Test (`engine/tests/test_kb_y_bo_sung_nhap.py`)

Đủ trường; mã không trùng; `trung_voi` trỏ đúng mục KB đang có; **không một chữ Hán** trong cả tệp (không trích);
không tên người giảng / khoá học / số tập / mốc giờ; lời đời thường qua `cum_cam` chung + `cum_chung_chung` + danh sách
doạ/bệnh của các test KB đang có (`DOA`, `BENH`, `CAM_KB`, `_CAM_DOA`) + danh sách doạ riêng của nguồn ("sinh ly",
"tử biệt", "làm lẽ", "tái hôn", "tự sát", "sẽ ốm"…); không thuật ngữ, không tên sao/cung, không con số trong lời;
1–2 câu; **sức khoẻ** (quy tắc chủ dự án cập nhật 2026-11-04): không tên bệnh, được nêu bộ phận / hệ cơ quan và gợi
đi khám, được gợi thời điểm như lời phòng ngừa, mọi câu có nói tới sức khoẻ kết thúc bằng "không thay lời bác sĩ".

## 7. Mười ví dụ trước → sau

Cột trái chỉ tả ý nguồn bằng vài chữ của em, không trích.

| # | Ý nguồn (tả lại) | Lời của ta (`loi_doi_thuong`) · việc nên làm |
|---|---|---|
| 1 | Liêm Tham / Liêm Phá ở Phu Thê: hôn nhân chắc chắn đứt, hoặc xa nhau hoặc mất người | Mối quan hệ dễ có những giai đoạn xa cách hoặc thay đổi lớn; điều giữ được nhau là chủ động kết nối và nói rõ kỳ vọng. · Đặt lịch hai người nói chuyện thẳng về kỳ vọng mỗi quý. |
| 2 | Lá nữ, Thái Dương Hoá Kỵ trong đại hạn: cha, chồng, con trai đều gặp chuyện lớn mười năm ấy | Giai đoạn này bạn dễ bận lòng về những người nam thân thiết; quan tâm sớm giúp bạn yên tâm hơn. · Hỏi thăm cha và người bạn đời thường xuyên hơn. |
| 3 | Liêm Sát hãm: kiểu chết dọc đường | Khi đang nóng hoặc vội, bạn dễ quyết liều; đi lại và làm việc tay chân nên có quy tắc an toàn của riêng mình. · Không lái xe, không ký giấy khi đang giận. |
| 4 | Liêm Tham hãm chiếu Mệnh: mất giữa đời, tự tìm đến cái chết | Khi áp lực dồn lại, bạn dễ thu mình và thấy mọi thứ bế tắc hơn thực tế; đó là lúc nên nói ra với người tin được hoặc một chuyên gia tâm lý — không thay lời bác sĩ. |
| 5 | Năm gặp Kình Đà: phải mổ, thấy máu | Năm có nét này nên chú ý sức khoẻ bản thân và những va chạm nhỏ, sắp xếp đi khám tổng quát — không thay lời bác sĩ. |
| 6 | Cự Môn hãm: ngồi tù; Cự gặp Thiên Mã: tai nạn xe | Khi tối, lời nói dễ thành chuyện qua lại, hiểu lầm (chốt việc bằng văn bản). · Ngày đang có tranh cãi mà phải đi nhiều: đi xe công cộng hoặc nhờ người lái. |
| 7 | Một mình Tả Phù/Hữu Bật ở Phu Thê: chắc chắn hai đời chồng/vợ | Chuyện đôi lứa dễ có những giai đoạn rất khác nhau; ở giai đoạn sau, bạn thường chọn người hợp hơn. |
| 8 | Hồng Loan/Thiên Hỷ ở Phúc Đức: lấy nhiều lần | Đời tình cảm của bạn có thể có nhiều chương… · Giữ sự rõ ràng, tôn trọng khi khép lại một mối quan hệ. |
| 9 | Cung chi Ngọ nhiều sát: bệnh tim là chỗ trí mạng | Sách y xưa gắn giờ Ngọ với tim; khi phần này trên lá số có nhiều nét khó, nên chăm sóc phòng ngừa và khám định kỳ — không thay lời bác sĩ. · Đi bộ đều, ngủ đủ, khám tim mạch định kỳ. |
| 10 | Lá nam, Thái Âm Hoá Kỵ: mẹ chồng nàng dâu bất hoà tới mức con dâu tìm đến cái chết | Mẹ và người bạn đời dễ có cách nghĩ khác nhau về việc nhà, và bạn hay bị kẹp ở giữa. · Đừng làm người chuyển lời; để hai người tự bàn việc chung. |

Không đưa vào dưới bất kỳ lời nào: đếm số con trai, "không có con", "anh em yểu", ngày/tuổi chết, sắc mặt báo tử,
"đi tu cho đỡ", chọn giờ mổ đẻ, chuyển giường / nhà để "đổi số".

## 8. Nên nối mục nào trước, hiện ở đâu

**Đợt 1 — hộp đời sống Tử vi** (`luangiai/tuvi_doi_song.py`, khuôn `doi_song_1`, có mã kiểm chứng `ds.*`):
mục ý chung (`rieng_phai = false`) và `co_the_tinh = true`:
- Hôn nhân: Phu Thê đọc cùng Phúc Đức (cụm `cung.phu_the_*`, `hon.*Phu Thê`), Hồng Loan nằm cung nào → ai ảnh hưởng
  chuyện cưới (`hon.hong_loan_*`), Cô Thần/Quả Tú, Thiên Tướng/Thiên Lương/Thất Sát ở Phu Thê.
- Nghề, tiền: Quyền+Lộc ở Tài Bạch vs chỉ Quyền (`cung.tai_bach_*`), Khoa không Quyền / Khoa+Quyền (`hoa.khoa_*`),
  Xương Khúc ở Tài Bạch, Nô Bộc → hợp tác & bảo lãnh (`cung.no_boc_*`).
- Tính cách: Kình Đà giáp Mệnh (đọc là "nhẹ tai"), nhật nguyệt phản bối, Thất Sát ở cung Thân, Tử Phủ giáp Mệnh.
- Thêm hộp = thêm mã kiểm chứng → `tests/test_ma_mau_golden.py` đổi có chủ đích; mã hộp cũ không đổi.

**Đợt 2 — thời điểm** (chương "Năm nay & 3 tháng tới", "Vận hạn", hỏi đáp Tử vi): năm thi (Hoá Khoa / Văn Xương vs
Xương Kỵ), năm Không Kiếp khi kinh doanh, năm vào Thiên Di, Hỏa Linh năm (cộng sự), Khôi Việt năm (được nâng),
Hồng Loan đại + tiểu hạn, "năm thuận dễ lơ là". Sức khoẻ theo hạn (`sk.tat_ach_sat_dai_han`, `sk.dai_tieu_han_trung_cung`,
`sk.kinh_da_nam_kham`) vào chương Sức khoẻ / Vận hạn dưới dạng "nên đi khám tổng quát" — **không đổi mức** năm.

**Đợt 3 — trang "sao ở cung"** (`kb/trang_tuvi.py`, phần bổ sung ban biên tập): sắc thái riêng như Tham Lang ở Tý/Hợi
khác Ngọ, Thái Dương ở Phu Thê lá nữ — thêm phần riêng cho 168 trang (giúp SEO-K/M "phần riêng").
→ **Đã làm (2026-11-04)**: bộ lọc tĩnh `trang_tuvi.noi_y_bo_sung` — mục "Thêm một cách đọc" (`hop`) và mục gập
"Góc nhìn khác (tham khảo)" (`goc_nhin_khac`, ≤ 3 ý mỗi mục) trên trang sao / cung / sao ở cung / Hoá ở cung; mỗi ý
MỘT trang (trang đầu khớp điều kiện) để không lặp chữ giữa các trang cùng họ. Bỏ qua ý cần hai lá, ý theo nhóm, ý chỉ
có ghi chú. Test `tests/test_tuvi_y_bo_sung_trang.py`.

**Đợt 4 — Xem lá số 2 người**: `hai.*` (Phu Thê ↔ Mệnh, hai Sát Phá Tham, đại hạn cùng thuận) chỉ làm **lời diễn giải**,
không đổi điểm 0–100 (luật chấm công khai `hai_nguoi_1`; đổi điểm = luật mới + golden mới).
→ **Đã làm (2026-11-04)**: `tuvi_hai_nguoi.cach_doc_them` → trường `cach_doc_them` (≤ 4 hộp) của `/v1/tuvi/hop-tham`:
Phu Thê bạn ↔ Mệnh người ấy, hai Mệnh Sát Phá Tham, Sát Phá Tham + Cơ Nguyệt Đồng Lương (cần đủ lá người kia) và một ý
Phu Thê của mỗi lá (chỉ người yêu / vợ chồng). Mã `ds.hai.<ý>.<ban|kia|hai>.<quan hệ>` đi qua ràng buộc `doi_song` có sẵn
(danh mục `hn.*` của 0021 cố định 5 tiêu chí chấm điểm — mã mới sẽ trùng phiếu hộp điểm), không migration. Chưa làm
`hai.dai_han_cung_thuan` (cần mức đại hạn hiện tại của cả hai lá). Test `tests/test_tuvi_hai_nguoi_cach_doc.py`.

**Chưa nên nối**: bảng chi → tạng phủ (12 mục `sk.chi_*`) và bản đồ thân thể (`sk.vung_dau_*`, `sk.nu_vung_bung_duoi`)
— rất đặc thù trường phái, dễ bị đọc như chẩn đoán; tứ hoá "đứng yên" (`pp.tu_hoa_dung_yen`) — ngược với phi hoá ta
đang dùng, chỉ hợp làm "góc nhìn khác".

## 9. Câu hỏi cho chủ dự án

1. **Pháp lý**: anh có muốn hỏi luật sư một lần về cách "lấy ý, viết lại" với nguồn CC BY-NC-SA trước khi nối không?
   (Em nghiêng về: được, nhưng nên có ý kiến bằng văn bản vì ta kinh doanh.)
2. **Ghi nguồn công khai**: em đề xuất **không nêu tên người**; trường phái ghi chung "một trường phái Tử vi Trung Hoa
   hiện đại (tam hợp)" hoặc không ghi gì riêng (gộp vào nguồn "sách và tài liệu tham khảo") — khớp BM-1. Anh chọn tên
   `source_id` / `school_id` chính thức.
3. **Ý riêng trường phái (103 mục)**: gộp thẳng vào lời luận, hay hiện riêng trong khung gập "Góc nhìn khác" có nút
   "Đúng với mình" để học dần? Em đề xuất: ý chung gộp vào hộp; ý riêng vào "Góc nhìn khác", sau ≥ 100 phiếu mới quyết.
4. **Xem lá số 2 người**: nối các luật hôn nhân / thời điểm như lời diễn giải (không đổi điểm) — anh đồng ý không?
5. **Sức khoẻ theo quy tắc mới**: các mục chi → bộ phận và bản đồ thân thể có nên hiện không, hay chỉ giữ mục theo hạn
   ("giai đoạn này nên đi khám tổng quát")?
6. **Duyệt nội dung**: chuyên gia (Đức Luân) đọc 200 mục và đánh lại `co_trong_co_thu` trước đợt 1? Mục nào duyệt xong
   đổi `trang_thai = da_duyet` rồi mới chuyển sang KB chính (`tuvi_doi_song_kb.json`).
7. **Chênh tuổi trong hôn nhân**: nguồn hay khuyên lấy người hơn tuổi nhiều / đã từng có gia đình. Em đã đổi thành "hợp
   người chín chắn". Anh có muốn bỏ hẳn ý này không?
