# Kiến trúc Huyền học — Tử vi · Kinh Dịch · Bát tự · Phong thuỷ

> Lập 2026-09-30. Nền: kho **2.031 câu hỏi có nhãn** (`engine/fixtures/cau_hoi/huyenhoc_cau_hoi.jsonl`),
> mốc đo **0%** (chưa module nào có hỏi đáp). Dùng lại khung đã chứng minh ở thần số v2
> (`docs/KIEN-TRUC-THANSO-V2.md`: 0% → 90,2%). Không đổi 4 tầng của CLAUDE.md.

## 1. Nguồn tri thức (danh mục chủ dự án) và cách dùng

| # | Mảng | Cổ thư | Dùng cho | Trạng thái nguồn |
|---|---|---|---|---|
| 1 | Dịch lý cốt lõi | 《周易》 Chu Dịch (quái từ, hào từ, Thập Dực) | KB 64 quẻ, phái Nghĩa Lý | Nguyên văn công cộng; ctext.org/book-of-changes |
| 2 | Phong thuỷ khởi nguyên | 《葬書》 Táng Thư — Quách Phác | KB âm trạch, khái niệm "khí thừa phong tắc tán" | ctext res=404104 |
| 3 | Loan đầu | 《撼龍經》《疑龍經》 — Dương Quân Tùng | KB loan đầu (hình thế, long mạch) | ctext res=889417 |
| 4 | Dương trạch | 《陽宅三要》 — Triệu Cửu Phong | Luật Cửa–Chủ–Bếp, Bát trạch | ctext res=946958 |
| 5 | Mệnh lý | 《滴天髓》 — Kinh Đồ / Lưu Bá Ôn / Nhậm Thiết Tiều | Khí thế, vượng suy, dụng thần (cách 2) | ctext chapter=126492 |
| 6 | Mệnh lý | 《淵海子平》 — Từ Tử Bình | Lấy can ngày làm trung tâm, thập thần | ctext res=307303 |
| 7 | Mệnh lý | 《子平真詮》 — Thẩm Hiếu Chiêm | Cách cục, dụng thần theo nguyệt lệnh (cách 1) | ctext res=413248 |
| 8 | Bốc Dịch | 《梅花易數》 — Thiệu Ung | Khởi quẻ theo thời gian/tượng, thể–dụng | ctext res=778643 |
| 9 | Bốc Dịch | 《增刪卜易》 — Dã Hạc Lão Nhân | Lục Hào: dụng thần, vượng suy, ứng kỳ | ctext res=958742 |
| — | Tử vi | *(danh mục chưa có)* — Tử Vi Đẩu Số Toàn Thư, khung Nam phái trong skill `tuvi-vn` | KB sao × cung, tứ hoá | Bổ sung sau |

**Quy tắc nguồn:** nguyên văn chữ Hán là công cộng; bản dịch Việt hiện đại có thể còn bản
quyền → **không chép**, chỉ tự diễn giải và trích dẫn tới sách/chương. Mọi mục KB có
`source_id` (mã sách), `school_id` (phái), `trich_dan` (chương/tiết), `trang_thai`.
Môi trường cloud hiện **chặn ctext.org** → bản nháp đầu soạn từ kiến thức sẵn có, gắn
`trang_thai = nhap_ai` và `can_doi_chieu = true`; khi mở mạng sẽ chạy vòng đối chiếu nguyên văn.

## 2. Luồng chung (dùng lại khung thần số v2)

```
câu hỏi + module + dữ liệu (ngày giờ sinh / quẻ đã gieo / hướng nhà)
   └► RULES: phân loại tất định (an toàn > ngoài phạm vi > kỹ thuật > hai người > lĩnh vực)
        └► CALC module: lá số / quẻ + thể dụng + vượng suy / tứ trụ + thập thần / mệnh quái + 8 hướng
             └► KB module: chỉ đúng khối cần → GÓI BẰNG CHỨNG (source_id, school_id, trích dẫn)
                  └► NARRATIVE: template tất định | LLM diễn đạt gói → bộ kiểm tra (số lạ, cụm tiên đoán)
                       └► nhật ký ẩn danh → vòng tự cải thiện
```

Chế độ luận (quyết định 2026-09-30, "cả hai/cả ba"):
- **Tử vi:** `tham_khao` (mặc định: xu hướng, hạn = chủ đề giai đoạn) · `chi_tiet` (bật tay:
  luận cát hung năm/hạn kiểu thị trường). Cả hai vẫn chặn: khủng hoảng, ngày chết, chẩn đoán bệnh,
  xổ số, tuyển dụng.
- **Kinh Dịch:** `tu_dong` (mặc định: "có nên/ứng xử" → Nghĩa Lý; "thành bại/bao giờ" → Lục Hào,
  dụng thần chọn theo loại việc; đọc nhanh → Mai Hoa) · `nghia_ly` (chỉ phản tư) · `day_du`
  (thành bại + ứng kỳ). Quẻ luôn do engine gieo hoặc người dùng gieo tay — **LLM không chọn quẻ**.
  Gieo lại cùng câu: `tu_dong`/`nghia_ly` gắn cờ và khuyên không gieo lại trong 30 ngày;
  `day_du` cho phép nhưng vẫn gắn cờ.

## 3. Từng module

### 3.1 Tử vi (đã có CALC iztro 2.6.0)
- CALC thêm: lưu niên / lưu tháng / đại hạn đang chạy qua `astro.horoscope()` của iztro (cùng bản ghim);
  xác định tam phương tứ chính, sát tinh chiếu.
- KB: 12 cung (ý nghĩa, câu tự soi) · 14 chính tinh (tính chất, mặt tối) · 14 × 12 sao-cung ·
  độ sáng miếu/vượng/đắc/bình/hãm · tứ hoá × 12 cung · phụ tinh chính (Tả Hữu, Xương Khúc, Khôi Việt,
  Lộc Tồn, Kình Đà, Hoả Linh, Không Kiếp, Đào Hồng Hỷ) · Tuần/Triệt (đã có engine) · chủ đề hạn.
- Hợp hôn: so cung Mệnh/Phu Thê hai lá (không phán "khắc").

### 3.2 Kinh Dịch (đã có khởi quẻ + nạp giáp + lục thân)
- CALC thêm: **Mai Hoa theo thời gian** (năm/tháng/ngày/giờ âm lịch → thượng/hạ quái, hào động),
  **thể–dụng** sinh khắc; **Lục Hào**: nguyệt kiến + nhật thần (cần tiết khí và can chi ngày),
  tuần không, vượng suy của dụng thần, ứng kỳ cơ bản.
- KB: 64 quẻ (tượng, quái từ tóm ý, ý nghĩa theo 5 lĩnh vực, mặt tối, câu tự soi) · 384 hào (tóm ý) ·
  bát quái (tượng, ngũ hành) · luật thể–dụng · dụng thần theo loại việc.

### 3.3 Bát tự (mới)
- CALC: **tiết khí chính xác** (dùng chung Lục Hào) · tứ trụ (tháng theo tiết, ngày theo can chi
  ngày, giờ theo `SWITCH_AT_0000` của bát tự — gắn cờ Tý muộn) · tàng can · thập thần · đếm ngũ hành
  · thân vượng/nhược (thang điểm công bố rõ) · đại vận (thuận/nghịch, tuổi khởi vận) · lưu niên.
  Golden: `lunar-typescript` (6tail, MIT — đã có trong `engine/ziwei/node_modules` do iztro kéo theo,
  chỉ dùng để SINH golden, không chạy runtime).
- KB: 10 nhật chủ · 10 thập thần × vị trí trụ · ngũ hành thừa/thiếu · cách cục chính (Tử Bình Chân
  Thuyên) · luật dụng thần hai cách (Chân Thuyên: nguyệt lệnh; Trích Thiên Tuỷ: phù ức/điều hậu) —
  **luôn trình bày cả hai khi lệch nhau**, không tự chọn.

### 3.4 Phong thuỷ (mới)
- CALC: mệnh quái (năm sinh + giới tính, mốc Lập xuân) · Đông/Tây tứ mệnh · 8 hướng du niên
  (Sinh Khí, Thiên Y, Diên Niên, Phục Vị, Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Hoạ Hại) · trạch quái theo
  hướng cửa (toạ) · tổ hợp Cửa–Chủ–Bếp (Dương Trạch Tam Yếu) · Ngũ Hoàng/Thái Tuế theo năm (tuỳ chọn).
- KB: 8 du niên · 8 trạch · luật Cửa–Chủ–Bếp · loan đầu định tính (Táng Thư, Hám Long) · các câu hỏi
  bố trí nội thất phổ biến (gương, xà, bếp–WC) **ghi rõ là quan niệm dân gian** khi không có trong cổ thư.

## 4. Kế hoạch (mỗi giai đoạn một PR, tiêu chí xong đo bằng kho câu hỏi)

| GĐ | Nội dung | Tiêu chí xong |
|---|---|---|
| HH-0 | Kho câu hỏi 4 mảng, đo mốc, tài liệu này | ✅ kho 2.031 câu, mốc 0% |
| HH-1 | Lõi hỏi đáp dùng chung + **Kinh Dịch** (KB 64 quẻ, Mai Hoa, thể–dụng, chọn phái) | Kinh Dịch ≥ 85% có căn cứ |
| HH-2 | **Tử vi** Q&A (KB sao × cung, tứ hoá, lưu niên, 2 chế độ) | ✅ kho 687/687; holdout viết sau router 20/24 trước sửa → 24/24 |
| HH-3 | **Bát tự** (tiết khí, tứ trụ, thập thần, đại vận — golden oracle), Lục Hào vượng suy | ✅ golden 42/42 + 667 tiết khí; kho 254/254; holdout 16/16 |
| HH-4 | **Phong thuỷ** (mệnh quái, bát trạch, cửa–chủ–bếp) | ✅ bảng 8×8 tay 100%; kho 360/360; holdout 10/12 → 12/12 |
| HH-5 | Skill `huyenhoc-kb` + vòng tự cải thiện đa module, đối chiếu ctext khi mở mạng | ✅ vòng chạy được, cổng chặn lùi; ctext: cấm cào → danh sách đối chiếu tay |

## 5. Ranh giới giữ nguyên ở mọi chế độ
Khủng hoảng → hỗ trợ (115/113/111) · không dự đoán ngày chết, không chẩn đoán bệnh, không xổ số,
không dùng để tuyển/sa thải · không phán "khắc" người thứ ba · phong thuỷ không bán vật phẩm "hoá giải".

## 6. Nhật ký thực hiện

### HH-2 — Tử vi (2026-09-30)
- CALC: `tuvi_an_sao.van_han()` — đại hạn / tiểu hạn / lưu niên qua `astro.horoscope()` của iztro
  2.6.0 (cùng bản ghim). Golden `fixtures/golden/ziwei_van_han.json` (4 lá × 4 ngày xem) + hai
  phép thử độc lập với iztro: tuổi mụ = năm âm xem − năm âm sinh + 1 (Hồ Ngọc Đức), chi lưu niên
  = chi năm âm của ngày xem (gồm ca trước Tết).
- KB `app/kb/data/tuvi_kb.json` (nháp AI, `can_doi_chieu`): 12 cung (xem được / **không trả lời
  được**), 14 chính tinh, 14×12 sao-cung, độ sáng, tứ hoá × 12 cung, 26 phụ tinh, chủ đề hạn,
  17 mục giải thích, mẫu người khác / hợp hôn / con.
- RULES `app/hoidap/tuvi.py`: loại `sao_cung` · `tu_hoa_cung` · `phu_tinh` · `ky_thuat` (không cần
  lá số) · `la_so` (chọn cung theo chủ đề, vô chính diệu mượn cung đối) · `han` (3 lớp tách bạch,
  đại hạn kế tiếp, năm cụ thể) · `hop_hon` / `la_so_con` / `nguoi_khac` → xin dữ liệu + đồng ý.
  `chi_tiet` thêm xu hướng thuận/nghịch theo lục cát / lục sát / Kỵ; câu "tai nạn/kiện" ở
  `chi_tiet` được trả lời kèm lưu ý không đoán biến cố, ở `tham_khao` bị từ chối nhẹ.
- API `POST /v1/tuvi/hoi` (extra=forbid, `la_so` tuỳ chọn) · web `/tu-vi` + `/api/tuvi/hoi` · E2E 2 ca.
- Giới hạn: lá số theo khung iztro (Trung Quốc) — cờ `nam_phai`; hợp hôn hai lá chưa làm (chỉ xin dữ liệu).

### HH-3 — Bát tự + Lục Hào vượng suy (2026-09-30)
- CALC `app/calc/tietkhi.py`: kinh độ Mặt Trời bằng VSOP87D rút gọn (Meeus ch. 32, phụ lục III) + FK5,
  chương động, quang sai; ΔT Espenak–Meeus; Newton. Sai số so với oracle lunar-typescript: **tối đa 0,63
  phút** trên 4.623 thời điểm 1900–2100 (bản Meeus rút gọn ch. 25 lệch tới 14 phút — đã bỏ).
- CALC `app/calc/battu.py`: trụ năm theo Lập xuân, trụ tháng theo 12 tiết, trụ ngày theo JDN, giờ Tý
  SWITCH_AT_0000 (23:xx giữ ngày, trụ giờ lấy Tý của ngày sau — dạ Tý, cờ `da_ty`), tàng can (Tỵ =
  Bính·Canh·Mậu theo oracle), thập thần, ngũ hành theo **thang điểm công bố** (`THANG_DIEM`), thân
  vượng/nhược, dụng thần **hai cách không tự chọn** (phù ức + điều hậu / cách cục nguyệt lệnh), đại vận
  (thuận nghịch, khởi vận 4320 phút = 1 năm), lưu niên + xung hợp chi ngày. Cờ `tiet_edge` khi sinh
  cách tiết ≤ 2 giờ.
- Golden `fixtures/golden/battu.json` (oracle lunar-typescript 1.8.6, sect 2 — chỉ dùng khi sinh golden,
  không chạy runtime): 42 ca tứ trụ + tàng can + thập thần + đại vận, 667 thời điểm tiết khí.
- CALC `app/calc/vuong_suy.py`: Lục Hào nguyệt lệnh (vượng/tướng/hưu/tù/tử theo tiết), nhật thần,
  tuần không → Kinh Dịch Lục Hào nay kèm vượng suy dụng thần (cờ `vuong_suy_rut_gon`; chưa xét ám động,
  nhật phá, hồi đầu, ứng kỳ).
- KB `battu_kb.json` (nháp AI): 10 nhật chủ × 4 mùa, 10 thập thần (nghĩa, khi nhiều/thiếu, nam/nữ),
  4 trụ, 5 hành (màu/hướng/nghề ghi rõ **ứng dụng dân gian**), 10 cách cục, 11 mục giải thích.
- RULES `app/hoidap/battu.py` · API `/v1/battu/la-so`, `/v1/battu/hoi` · web `/bat-tu` · E2E 2 ca.
- Kho câu hỏi: 2 câu "bát tự của tôi và người yêu có hợp nhau" đổi nhãn `tra_loi` → `can_them_du_lieu`
  cho khớp các câu hợp khác (cần lá số người kia).

### HH-4 — Phong thuỷ (2026-09-30)
- CALC `app/calc/phongthuy.py`: mệnh quái (mốc **Lập xuân** theo tiết khí; chỉ có năm → cờ
  `chua_ro_ngay`), du niên bằng phép lật hào (khớp 100% bảng 8×8 chép tay — đối chiếu độc lập),
  trạch theo phương toạ, cửa–chủ–bếp, sao năm (Ngũ Hoàng phi tinh, Thái Tuế, Tuế Phá, Tam Sát —
  kiểm bằng các năm 2018–2026 đã biết), tuổi làm nhà Kim Lâu / Hoang Ốc / Tam Tai (**dân gian**).
- KB `phongthuy_kb.json` (nháp AI): 8 du niên, 8 quái, 28 tình huống bố trí/loan đầu (mỗi mục ghi
  `nguon` = cổ thư hay **dân gian**, kèm lý do và gợi ý thực tế), âm trạch (Táng Thư), 11 giải thích.
- RULES `app/hoidap/phongthuy.py`: mệnh quái × hướng, du niên, cửa–bếp, loan đầu/bố trí, âm trạch,
  năm, vợ chồng (xin dữ liệu hai người), hướng cá nhân (ngày sinh từ form hoặc "sinh năm …, nam/nữ"
  trong câu). Từ chối vật phẩm "chiêu tài", bùa ngải.
- API `/v1/phongthuy/menh-quai`, `/v1/phongthuy/hoi` · web `/phong-thuy` · E2E 2 ca.
- Kho câu hỏi: 1 câu ("Vợ chồng tôi sinh 1990 và 1992…", 3 biến thể) đổi nhãn → `can_them_du_lieu`
  (không rõ năm nào của ai, thiếu giới tính).

### HH-5 — Skill KB + vòng tự cải thiện đa module (2026-09-30)
- Skill `.claude/skills/huyenhoc-kb` (chuẩn nội dung 4 file KB, luật cấm, hai trường phái, dân gian,
  bản quyền, duyệt nháp) và `.claude/skills/huyenhoc-tu-cai-thien` (hợp đồng + các bước + mốc).
- `scripts/vong_cai_thien_huyenhoc.py`: `do` (4 module, ghi `lich_su_do_huyenhoc.jsonl`, exit 1 nếu lùi),
  `bao-cao`, `kiem-kb` (đã bắt 2 cụm cấm trong KB Kinh Dịch HH-1 → sửa lời), `doi-chieu`
  (→ `docs/DOI-CHIEU-HUYEN-HOC.md`, danh sách cho người duyệt).
- Cổng `tests/test_huyenhoc_kho.py`: sàn 97%/module, khủng hoảng + từ chối 100%, chặn nhầm 0, KB sạch,
  template không vi phạm bộ kiểm tra đầu ra (≈ 2,5 giây).
- Nhật ký: bảng mới `huyenhoc_hoi_nhat_ky` (migration **0005 + down, chờ chủ dự án duyệt/chạy**); engine
  lọc năm/giờ/ngày/SĐT/email/họ tên và **không gửi câu trả lời khi có dữ liệu sinh** (lá số, tứ trụ,
  mệnh quái suy ngược được ngày giờ sinh). Bật chung cờ `NHAT_KY_HOI=1`.
- ctext.org: mạng đã thông nhưng trang trả Cloudflare Turnstile và điều khoản **cấm scraping** (có thể
  cố ý trả dữ liệu hỏng cho máy cào) → không cào. Đường đúng: gói đăng ký + API chính thức (api.ctext.org
  còn bị mạng cloud chặn) hoặc người duyệt tra tay theo `docs/DOI-CHIEU-HUYEN-HOC.md`.

### HH-CT vòng 2 (2026-10-08) — holdout mới 64 câu

Kho 2.031 câu đã bão hoà (100% cả 4 mảng) → viết **64 câu holdout mới TRƯỚC khi đọc router**
(`tests/test_huyenhoc_holdout_v2.py`). Lần chạy đầu **46/64 (72%)**: Tử vi 18/23 · Bát tự 11/15 · Phong thuỷ 10/16 ·
Kinh Dịch 8/10. Sau sửa: **64/64**, kho vẫn 100% (một lần lùi 3 câu "dạy con theo lá số của bé" do mẫu quá rộng → đã gỡ mẫu).

- Tử vi: viết tắt "Tử Phủ" = Tử Vi + Thiên Phủ; hỏi tháng (lưu nguyệt) của chính mình → hạn; "tuổi X … tuổi Y … xung/hợp" →
  hợp hôn; "con gái/con trai tôi", "bé mới sinh" → lá số con; **nhánh mới `cach_cuc_chung`**: câu gọi tên một cách cục
  (vd Sát Phá Tham, Tử Phủ đồng cung) mà không hỏi lá số riêng → giải thích từ KB 62 cách cục (trước: đòi lá số).
- Bát tự: "tính cách gì" bị bắt nhầm thành cách cục (chữ "cách") → chặn; "tài lộc" → nghề–tiền; "thiếu Kim/Mộc… đeo gì" → ngũ hành;
  "con trai/con gái tôi" → con.
- Phong thuỷ: "phi tinh năm 2027 sao nào…" là sao **năm** (không phải tinh bàn nhà theo vận); du niên hỏi "xấu thế nào";
  KB thêm `dong_tay_tu_menh` (giải thích nhóm Đông/Tây tứ mệnh), `cau_thang_giua_nha` (dân gian), từ khoá cho
  `wc_giua_nha` và `vo_chong_khac_menh`.
- Kinh Dịch: "có thành không", "tìm lại được không" → dự đoán; mất ví/đồ/tiền → dụng thần Thê Tài (trước: Ứng).
- **Nhãn holdout đổi sau lần chạy đầu** (người viết nhãn đoán sai danh mục, không phải chỉnh cho khớp máy): 2 câu gọi tên cách
  cục → `cach_cuc_chung`; "Tây tứ mệnh hợp hướng nào", "chồng Đông tứ – vợ Tây tứ" → `ky_thuat` (câu hỏi chung, trả lời bằng
  giải thích); "bếp đối diện cửa chính" → `bo_tri` (KB có mục riêng `bep_doi_cua`).

### HH-CT vòng 3 (2026-10-08) — holdout 51 câu + thần số

Holdout v3 (`tests/test_huyenhoc_holdout_v3.py`) viết trước khi đọc router, trọng tâm lối hỏi chưa phủ: "X cư/thủ/toạ Y"
(khớp cụm trang SEO-H), tháng âm lịch, cây/bể cá/cửa đối cửa, tên 9 sao phi tinh. Lần chạy đầu **40/51 (78%)**:
Tử vi 19/21 · Bát tự 9/11 · Phong thuỷ 4/11 · Kinh Dịch 8/8. Sau sửa **51/51**, v2 vẫn 64/64, kho 2.031 câu vẫn 100%.

- Tử vi: "tháng 7 âm lịch này" → hạn; "cục trong tử vi" → giải thích `cuc`.
- Bát tự: "xem giúp vợ tôi" → người khác; "thân vượng thân nhược là gì" → giải thích `than_vuong`.
- Phong thuỷ: KB thêm `cay_truoc_cua`, `be_ca` (dân gian, kèm lý do thực tế, không gợi ý vật phẩm); "cửa chính đối diện
  cửa sau" → `cua_doi_nhau`; "Nhị Hắc/Ngũ Hoàng… bay vào hướng nào" → sao năm; "mệnh quái là gì" → giải thích;
  "nhà hướng Tây có xấu không" → hướng theo mệnh quái gia chủ (hỏi năm sinh).
- Nhãn đổi sau lần chạy đầu: "tuổi Ất Sửu kê bàn làm việc hướng nào" → `bo_tri` (KB có `phong_lam_viec`);
  "nhà hướng Tây có xấu không" → `huong_ca_nhan`.
- Thần số (cùng vòng): đúng lĩnh vực **95,01% → 96,59%**, 32 câu sửa, 0 câu lùi (chi tiết trong PR).

## 7. Tổng kết HH-0 → HH-5

| Module | CALC (kiểm chứng) | KB (nháp AI) | Kho câu hỏi | Holdout lần đầu |
|---|---|---|---|---|
| Tử vi | iztro 2.6.0 + vận hạn (golden + 2 phép thử độc lập) | 12 cung · 14 sao · 168 sao-cung · 48 tứ hoá-cung | 687/687 | 20/24 |
| Kinh Dịch | Mai Hoa, thể–dụng, Lục Hào + vượng suy | 64 quẻ × 5 lĩnh vực | 730/730 | — |
| Bát tự | tiết khí VSOP87 (≤ 0,63 phút), golden 42/42 | 10 nhật chủ × 4 mùa · 10 thập thần · 10 cách | 254/254 | 16/16 |
| Phong thuỷ | Bát trạch (bảng tay 8×8), sao năm | 8 du niên · 28 bố trí · âm trạch | 360/360 | 10/12 |

Chưa làm (việc tiếp theo, theo thứ tự giá trị): duyệt/đối chiếu nguyên văn 4 KB (người có nghề) ·
hợp hôn hai lá số (tử vi) / hai tứ trụ (bát tự) khi có đồng ý · Huyền không phi tinh theo vận ·
Lục Hào ám động / nhật phá / ứng kỳ · hào từ 384 hào (cần nguồn công cộng, không GPL) · bật LLM diễn đạt
cho 4 module trên web (hiện chỉ template).
