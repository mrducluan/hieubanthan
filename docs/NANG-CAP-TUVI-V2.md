# Nâng cấp Tử vi V2 — đánh giá bộ tài liệu v2.2 và kế hoạch (TV-V2)

Ngày: 2026-10-19 · Nguồn: 5 tệp chủ dự án gửi (`01_hieuban_astro_kb_v2_2_complete.json`,
`02_supabase_all_in_one_migration_v2_2.sql`, `03_astroEngine_v2_2.ts`, `04_legacyChartAdapter_and_Seeder.ts`,
`05_CLAUDE_CODE_MASTER_BLUEPRINT.md`). Tệp gốc **không** đưa vào git (chỉ lấy ý + viết lại).

Vòng tăng trưởng: **QUAY LẠI** (nhịp 3 tháng tới đổi theo tháng — lý do mở lại lá số mỗi tháng) và **MỜI**
(hợp tham hai lá số cần người thứ hai). Đo: `chart_interacted{mo_dun:"tuvi", kind}` với kind `phi_hoa`,
`nhip_3_thang`, `hop_tham`, `dinh_gio`; tỉ lệ người mở lá số quay lại trong 30 ngày; số link mời từ hợp tham.

## 1. Đối chiếu với codebase hiện tại

| Ý trong tài liệu v2.2 | Codebase đã có | Quyết định |
|---|---|---|
| Ngũ Hổ Độn can 12 cung, Lai nhân cung | iztro trả `heavenlyStem`, `isOriginalPalace` → `la_lai_nhan` | Giữ iztro; thêm hàm Python tự tính để **đối chứng** (test), không thay |
| Bảng tứ hoá 10 can | `calc/tuvi_luu_nguyet.TU_HOA` (giống iztro, Canh/Nhâm giữ iztro) | Bảng trong tài liệu **trùng khít** → dùng lại bảng cũ, không thêm bảng thứ hai |
| **Phi tinh tứ hoá 12 cung** (cung can → 48 đường bay, tự hoá, xung) | **Chưa có** | **LÀM** — CALC Python thuần, golden đối chứng iztro (`fliesTo`/`selfMutaged`) |
| Radar 90 ngày (3 tháng lưu nguyệt) | Lưu nguyệt 5 phái + tứ hoá can tháng (TV-LN) | **LÀM** lớp RULES "Nhịp 3 tháng tới" ghép lưu nguyệt + tứ hoá lưu niên (chồng Kỵ, song Lộc) — không tính lại cung tháng |
| Đẩu Quân tháng Giêng | Đã có, khớp iztro 680/680 | Không làm lại |
| Hợp tham 2 lá số (can năm B phi hoá vào lá A) | Hợp đôi chỉ có thần số | **LÀM** — trung tính, **không chấm điểm** (quyết định 2026-09-30) |
| Định chuẩn giờ sinh (±1 canh giờ, đối chiếu năm cũ) | `do_tin_gio` exact/approx, cờ giờ nhạy | **LÀM** — người dùng tự chọn năm đối chiếu, không lưu, không câu sức khoẻ |
| Cung Phi Bát Trạch | Phong thuỷ mệnh quái theo **Lập xuân** (đúng hơn bản TS dùng năm dương) | Không làm lại |
| Điều hầu dụng thần theo mùa | Bát tự đã có điều hầu (`test_battu_dieu_hau.py`), chi tiết hơn bản 4 mùa | Không làm lại |
| 19 mục cuộc đời | Luận giải toàn bộ theo chương (`toan_bo.CHUONG_TUVI`) | Bổ sung 2 chương (Đường bay tứ hoá, 3 tháng tới) — đợt sau, đo trước |
| 8 ý định câu hỏi + điểm kiểm | Hỏi đáp Tử vi có bộ phân loại + kho 2.031 câu | Lưu KB `y_dinh_hoi` (dữ liệu); nối vào định tuyến ở vòng cải thiện có đo trước/sau |
| 4 định luật phân xử hai phái | Khung "Trường phái" hiện cả hai | Lưu KB `phoi_hop_phai` — **trình bày cả hai**, không để phái nào "phán quyết" |
| Từ điển chiến lược 14 chính tinh + sát/cát | KB `chinh_tinh` (tính chất, mặt tối, khi sáng/hãm, câu tự soi) | Thêm lớp `vai_tro` (góc nhìn công việc) viết lại trung tính |

## 2. Những phần KHÔNG làm theo nguyên văn (và lý do)

1. **Engine TypeScript trên Render** — trái kiến trúc 4 tầng: CALC là Python, web không tự tính. Thuật toán được
   viết lại bằng Python có test trước.
2. **Migration 02 (5 bảng + pgvector + RPC + trigger RLHF)**
   - Không có tệp `.down.sql`, bảng nghĩa không có `source_id` + `school_id` (bắt buộc).
   - `rlhf_consultation_logs` lưu **nội dung luận giải gắn `legacy_user_id`** → cấm tuyệt đối.
   - Trigger biến **bình luận tự do của người dùng thành `override_instruction` bơm vào prompt** → lỗ chèn lệnh
     (prompt injection) + LLM nhận "dữ kiện" ngoài tầng 1–3.
   - `SECURITY DEFINER` không đặt `search_path`, bảng không bật RLS.
   - `pgvector` + embedding 1536 chiều = dịch vụ/phụ thuộc mới chưa duyệt; KB Tử vi nằm trong git (JSON) theo
     quyết định QT-1, không chép sang bảng thứ hai.
   → Thay bằng: KB JSON trong git (`tuvi_phi_hoa_kb.json`, có source_id/school_id). Phản hồi "đúng/chưa đúng"
   chỉ ghi **mã** lên PostHog (như góp ý 1 chạm), không câu chữ, không lá số.
3. **Hội đồng 3 AI agent mỗi lượt hỏi** — 3 lần gọi LLM/lượt (chi phí, hạn mức RL-1) và Agent 1 "chấm điểm rủi
   ro" là việc của RULES. → Agent 1 = RULES Python tất định (đã làm ở đây); Agent 2 = lớp NARRATIVE sẵn có (chỉ
   diễn đạt JSON); Agent 3 = kiểm định luật cố định (bộ chặn từ doạ, khủng hoảng, sức khoẻ) — không thêm LLM.
4. **Giọng văn** — "BÁO ĐỘNG ĐỎ", "hố tử thần thanh khoản", "Bắt buộc Ở LẠI", "rủi ro thang 10 ở dòng đầu",
   "phá sản", "tai nạn thương tích", "bệnh lý cần điều trị" trái quy tắc "không doạ, không phán hung",
   "không chẩn đoán bệnh", "Tật Ách chỉ nói cách chịu áp lực". → Viết lại: mức `thuận / bình / cần thận trọng`,
   mỗi tín hiệu đi kèm việc nên làm + câu tự soi; không con số rủi ro, không mệnh lệnh.
5. **Phong thuỷ "dùng hành Hoả bổ trợ…"** — gợi ý vật phẩm/hành theo sao không có nguồn cổ thư; chỉ giữ gợi ý
   **hành vi**.
6. **Định giờ dùng cố định 2022–2024** — năm đối chiếu phải do người dùng chọn (năm họ nhớ rõ).

## 3. Hợp đồng API (engine `/v1/tuvi/*`, web proxy `/api/tuvi/*` cùng tên)

Mọi route nhận `la_so` = `TuanTrietInput` sẵn có (cùng tiền xử lý múi giờ, lịch, phái). Không lưu gì.

### POST `/v1/tuvi/phi-hoa` — `{la_so, nam_xem?: int}`
```jsonc
{ "engine_version": "...", "can_nam_sinh": "Giáp",
  "lai_nhan": {"cung": "Quan Lộc", "chi": "Tuất", "can": "Giáp"},
  "cung": [{"ten","chi","can","la_menh","la_lai_nhan"}],          // 12 cung, thứ tự như /an-sao
  "duong_bay": [{"tu_cung","can","hoa","sao","den_cung","xung_cung",
                 "tu_hoa": false, "den_tuan_triet": ["Tuần Không"], "nghia": "..."}],   // 48 đường
  "tu_hoa": [/* phần tử duong_bay có tu_hoa=true */],
  "vao_menh": [/* duong_bay có den_cung = "Mệnh" */],
  "noi_bat": [{"loai": "ky_xung|loc_nhap|tu_hoa|mau", "duong": {/* 1 duong_bay */},
               "tieu_de","nghia","viec_nen_lam","cau_tu_soi","ghi_chu_tuan_triet": null}],  // ≤ 8
  "luu_nien": {"nam": 2026, "can_chi": "Bính Ngọ",
               "hoa": [{"hoa","sao","den_cung","xung_cung"}]} ,                  // chỉ khi có nam_xem
  "phai": {"ten": "Phi tinh tứ hoá", "ghi_chu": "..."}, "luu_y": ["..."], "trang_thai": "nhap_ai",
  "co_canh_bao": [{"loai","chi_tiet"}] }
```
`hoa` ∈ `Lộc|Quyền|Khoa|Kỵ`. `xung_cung` = cung đối diện cung đích. `tu_hoa` = can cung nguồn hoá chính sao nằm
trong cung nguồn.

### POST `/v1/tuvi/nhip-3-thang` — `{la_so, ngay_xem?: date}`
```jsonc
{ "engine_version", "ngay_xem", "phai_luu_nguyet": "dau_quan_thai_tue",
  "luu_nien": {"nam_am", "can_chi", "tu_hoa": [{"hoa","sao","cung_goc"}]},
  "ten_phai_luu_nguyet": "Đẩu Quân từ Thái Tuế",
  "luu_nien_sau": {/* như luu_nien */},    // chỉ khi 3 tháng vắt sang năm âm sau
  "thang": [ {"thang","nhuan","phan","nam_am","can_chi","tu","den","cung_goc","chu_de",
              "muc": "thuan|binh|can_than", "nhan_muc": "Thuận|Bình|Cần thận trọng",
              "ly_do": [{"ma": "chong_ky|song_loc|loc_nhap_cung_chinh|ky_xung_cung_chinh|khoa_giai", "noi_dung"}],
              "tu_hoa_thang": [{"hoa","sao","cung_goc"}], "goi_y", "cau_tu_soi"} ],   // đúng 3 phần tử
  "uu_tien": {"thu_tu": ["dai_han","luu_nien","tieu_han","luu_nguyet"], "ghi_chu": "...",
              "han_nam": {"dai_han","luu_nien","tieu_han": {"chi","cung_goc"}}},
  "luu_y": ["..."], "co_canh_bao": [...] }
```
Mỗi tháng xếp mức theo tứ hoá của **năm âm chứa tháng đó** (`nam_am`), nên tháng sau Tết đọc cùng `luu_nien_sau`.

### POST `/v1/tuvi/hop-tham` — `{la_so, nguoi_kia, quan_he}`
`nguoi_kia = {birth_date, calendar_type?, am_nhuan?, birth_time?, gender?, noi_sinh?, vung?}`;
`quan_he ∈ nguoi_yeu|vo_chong|ban_be|dong_nghiep|doi_tac|sep|cha_me_con|gia_dinh` (mặc định `nguoi_yeu`).
```jsonc
{ "engine_version", "quan_he", "nhan_quan_he", "can_nam_nguoi_kia": "Ất",
  "can_menh_nguoi_kia": "Giáp" | null,
  "nguoi_kia_vao_ban": [{"hoa","sao","den_cung","xung_cung","nghia"}],     // 4 phần tử
  "ban_vao_nguoi_kia": [...] | null,      // chỉ khi người kia đủ giờ + giới tính + nơi sinh
  "menh_nguoi_kia_vao_ban": [...] | null, // can cung Mệnh người kia (cũng cần lá đầy đủ)
  "tom_tat": ["..."], "luu_y": ["..."], "khong_cham_diem": true }
```

### POST `/v1/tuvi/dinh-gio` — `{la_so, nam_doi_chieu?: int[] (≤3), tat_ca_gio?: bool}`
```jsonc
{ "engine_version", "ly_do": ["gan_ranh_gio|ang_chung|khong_biet"],
  "ung_vien": [{"nhan": "Giờ trước|Giờ đã nhập|Giờ sau", "chi_gio": "Ngọ",
                "khoang_gio": "11:00–12:59",            // theo kinh tuyến lịch UTC+7 (Tử vi chia canh theo giờ này)
                "khoang_gio_dong_ho": "11:00–12:59",    // cùng canh trên ĐỒNG HỒ nơi sinh
                "lech_gio_lich": false,                 // true khi đồng hồ nơi sinh ≠ giờ lịch
                "ghi_chu": "...",                       // chỉ ứng viên "Giờ Tý muộn (…)" (chế độ 12 canh)
                "ngay_duong": "1990-05-17",             // ngày dương theo ĐỒNG HỒ người dùng (= dau_vao.birth_date)
                "gio_dai_dien": "12:00", "la_gio_nhap": true,
                "cung_menh": {"chi","chinh_tinh": ["..."]}, "cuc": "Thủy nhị cục", "than_cu": "Quan Lộc",
                "dau_vao": {"birth_date","birth_time","calendar_type": "duong"},   // giờ ĐỒNG HỒ nơi sinh
                "nam": [{"nam": 2023, "can_chi": "Quý Mão",
                         "cau_hoi": [{"hoa": "Kỵ", "cung": "Tài Bạch", "cach": "nhap|chieu", "noi_dung": "..."}]}]}],
  "ly_do_lech": null,      // "mui_gio_lich_su" | "gio_mua_he" | "nuoc_ngoai" | null — vì sao đồng hồ lệch giờ lịch
  "nam_doi_chieu": [2023, 2024, 2025], "khac_nhau": ["..."], "loi_dan": "...", "luu_y": ["..."], "co_canh_bao": [...] }
```
Mặc định 3 ứng viên (giờ trước / đã nhập / sau = giờ nhập ± 2 giờ đồng hồ); `tat_ca_gio=true` → 12 canh giờ
(người không biết giờ).
`nam_doi_chieu` mặc định 3 năm âm gần nhất đã qua.

- **Khoảng giờ**: `khoang_gio` theo chỉ số giờ của lá (Tý sớm `00:00–00:59`, Tý muộn `23:00–23:59`, canh khác 2 giờ).
  `khoang_gio_dong_ho` = `khoang_gio` dời theo độ lệch *đồng hồ nơi sinh − kinh tuyến lịch* mà tiền xử lý `_DauVao`
  đã dùng cho chính ứng viên đó (múi giờ lịch sử, vd miền Nam 1960–1975 UTC+8: canh Mão lịch `05:00–06:59` → đồng hồ
  `06:00–07:59`; nước ngoài có giờ mùa hè: +1 giờ). Không lệch → hai trường bằng nhau, `lech_gio_lich=false`.
- **12 canh** (`tat_ca_gio`): mọi ứng viên thuộc **ngày đã nhập theo GIỜ ĐỒNG HỒ người dùng** (đúng điều họ thấy;
  lá số vẫn an theo giờ lịch như cũ): Tý = 00:30 lịch (giữa Tý sớm), canh khác = giữa canh, quy ra giờ đồng hồ; canh
  trùng giờ đã nhập dùng đúng giờ nhập. Ba ca của giờ nhập Tý muộn (chỉ số 12 theo giờ lịch):
  1. Giờ **đồng hồ** nhập 23:xx (không lệch) → thêm **ứng viên thứ 13** `nhan` "Giờ Tý muộn (23:00–23:59)" = đúng giờ
     nhập, `la_gio_nhap=true`, có `ghi_chu`; ứng viên Tý sớm khi đó `la_gio_nhap=false`. Thứ tự = thời gian (Tý sớm …
     Hợi, Tý muộn cuối) → web tính `lech` (sớm/muộn hơn giờ nhập) theo `dau_vao`.
  2. Đồng hồ chạy sớm hơn giờ lịch (miền Nam 1960–1975 UTC+8, giờ mùa hè…) và nhập 00:xx = 23:xx **hôm trước** theo
     giờ lịch → Tử vi tính Tý muộn sang ngày hôm sau = đúng ngày đã nhập, lá trùng lá Tý sớm → giờ nhập **thay** ứng
     viên Tý (vẫn 12 ứng viên), `nhan` "Giờ Tý muộn (00:00–00:59)" theo **khoảng giờ đồng hồ**, `ghi_chu` nêu giờ lịch.
  3. Đồng hồ nhập 23:xx nhưng giờ lịch là 22:xx (UTC+8) → giờ Hợi, không thêm ứng viên. (Lệch ≥ 2 giờ, vd UTC+9 năm
     1945: giờ nhập thuộc canh của hôm trước theo giờ lịch → thêm một ứng viên đầu danh sách.)
- **`ngay_duong`** mọi ứng viên (cả chế độ ±1 canh, vd "Giờ trước" của 00:30 rơi về hôm trước): web ghi ngày khi khác
  ngày của ứng viên giờ đã nhập.
- **`ly_do_lech`** lấy từ tiền xử lý `_DauVao`: `mui_gio_lich_su` (sinh trong nước, đồng hồ lúc đó ≠ UTC+7),
  `gio_mua_he` (nước ngoài, đã trừ 1 giờ mùa hè — "giờ lịch" ở đây là giờ chuẩn địa phương, không phải UTC+7),
  `nuoc_ngoai` (nước ngoài, không giờ mùa hè — không lệch), `null`. Web hiện câu giải thích theo mã.

## 4. Đầu vào mới cho người dùng (đề xuất UI)

| Ở đâu | Trường | Vì sao |
|---|---|---|
| Hồ sơ | "Giờ sinh này": thêm **"Không biết giờ"** (`do_tin_gio=unknown`) | Mở luồng định giờ 12 canh thay vì chặn Tử vi. Tài khoản lưu `unknown` (giờ để trống) từ migration **0015**; chưa chạy 0015 → lưu như chưa có giờ |
| Hồ sơ | **Phút sinh** đã có trong ô giờ — hiện gợi ý định giờ khi phút ở 15 phút đầu/cuối canh | Ranh giới canh giờ đổi cả lá |
| Lá số Tử vi | **Năm đối chiếu** (≤ 3 năm người dùng nhớ rõ) | Định giờ dựa trên năm của chính họ |
| Hợp tham | **Người kia**: ngày sinh (bắt buộc), giờ + giới tính + nơi sinh (tuỳ chọn → xem hai chiều), **quan hệ** | Can năm đủ cho một chiều; lá đầy đủ cho hai chiều + can Mệnh |
| Hợp tham | Nút "Gửi link để bạn ấy tự nhập" (link mời HMAC sẵn có) | Khâu MỜI, không chuyển ngày sinh người khác qua link |
| Khung Trường phái | Bật/tắt **lớp Phi tinh** (đường bay trên lá số) | Hai phái hiện song song, người dùng chọn |

## 5. Thứ tự làm (đợt này)

1. CALC `calc/tuvi_phi_hoa.py` + golden đối chứng iztro (test trước).
2. KB `kb/data/tuvi_phi_hoa_kb.json` (nháp AI, source_id + school_id mỗi mục).
3. RULES: `luangiai/tuvi_phi_hoa.py`, `tuvi_nhip_3_thang.py`, `tuvi_hop_tham.py`, `tuvi_dinh_gio.py`; route
   `app/tuvi_v2_api.py`.
4. Web: proxy + zod, khối "Đường bay tứ hoá", "3 tháng tới", "Hợp tham", "Định giờ sinh" trên `/tu-vi`.
5. QC độc lập (test, lint, typecheck, rà ranh giới tầng + giọng văn).

Không đổi lá số gốc → **không tăng `ENGINE_VERSION`**.

## 6. Bảng chuyển đổi TS → Python (chứng minh bằng oracle)

Bản TS gốc giữ nguyên văn ở `engine/ziwei/oracle_v22/astroEngine_v2_2.ts` — **chỉ làm ORACLE lúc phát triển**,
không chạy runtime, không import từ engine/web. `ziwei/oracle_v22/sinh_golden.py` an 67 lá golden phi hoá bằng iztro
của dự án, đổi tên → mã bằng `app/kb/tuvi_ma_chuan.py` (như adapter 04), chạy TS bằng
`node --experimental-strip-types sinh_golden.ts` → `fixtures/golden/tuvi_v22_oracle.json`.
Kiểm: `tests/test_tuvi_v22_oracle.py` (619 ca) + `tests/test_tuvi_ma_chuan.py`. Sinh lại:
`cd engine && PYTHONPATH=. .venv/bin/python ziwei/oracle_v22/sinh_golden.py [tệp KB v2.2 gốc]`.

| Hàm TS | Python | Trạng thái | Số ca khớp |
|---|---|---|---|
| `assignPalaceStemsAndLaiNhan` | `calc/tuvi_phi_hoa.ngu_ho_don`, `lai_nhan` (+ can iztro) | **Trùng** | 804/804 can cung, 67/67 Lai nhân |
| `calculateFlyingStarMatrix` — `allTransitions`, `selfTransformations` | `calc/tuvi_phi_hoa.phi_hoa` | **Trùng** (cung nguồn, can, hoá, sao, cung đích, cung xung, tự hoá, Tuần/Triệt) | 3.216/3.216 đường bay |
| `PALACE_CLASH_MAP` (xung theo tên cung) | xung theo chi đối diện | **Trùng** (vòng 12 cung cố định) | 67/67 lá |
| `criticalClashes` | `luangiai/tuvi_phi_hoa.chon_noi_bat` loại `ky_xung` | **Cố ý khác**: Python chỉ Mệnh/Tài Bạch/Quan Lộc, bỏ tự hoá, tối đa 8 mục nổi bật (TS gồm cả Điền Trạch, Phu Thê, tự hoá → 354 mục, quá nhiều để làm "nổi bật"). Áp đúng luật TS lên đường bay Python → ra đúng tập TS | 67/67 lá (tập TS tái lập); 197/354 là ứng viên Python |
| `calculateDouJunJanuaryBranch` (adapter 04) | `calc/tuvi_luu_nguyet.cung_thang_gieng("dau_quan_thai_tue")` | **Trùng**, trừ sinh nửa sau tháng nhuận: dự án (như iztro, `thang_nhuan=thang_sau`) tính sang tháng sau, adapter nhận số tháng thô → lệch đúng 1 cung | 66/67 trùng, 1/1 lệch đúng dự kiến |
| `calculate90DayRadar` — can tháng, cung tháng, tứ hoá tháng (sao + cung đích + cung xung) | `luangiai/tuvi_luu_nguyet.lap_nam` | **Trùng** | 804/804 tháng |
| `calculate90DayRadar` — `alertLevel` | `luangiai/tuvi_nhip_3_thang.xep_muc` | **Cố ý khác** (đổi tên RED/YELLOW/GREEN → `can_than/binh/thuan`, không giọng báo động). Luật TS tái lập 804/804; Python khác đúng 3 chỗ: Kỵ tháng ở cung đối diện Kỵ năm (TS chỉ so trùng cung) 27 tháng; TS báo đỏ khi Kỵ xung Tật Ách (Python không xếp mức theo sức khoẻ) 46 tháng; Python thêm `song_loc` 10 tháng | 721/804 cùng mức (89,7%), 83 khác đều đúng lý do |
| `calculate90DayRadar` — vắt năm, tháng nhuận | `nhip_3_thang.lap` | **Cố ý khác (TS sai)**: tháng sang năm âm sau TS vẫn dùng can năm cũ (sai can tháng + Kỵ năm); TS không biết tháng nhuận. Python dùng năm mới, tách nửa tháng nhuận | 157/201 tháng trùng can, cung, tứ hoá; 22 vắt năm + 22 nhuận khác đúng dự kiến |
| `calculate90DayRadar`, `buildBirthTimeCalibrationTest` — rơi về `'MENH'` khi không thấy sao/cung | `phi_tu_can` trả `None` | **Cố ý khác**: TS âm thầm gán Mệnh (sai cung), Python để trống, không luận | lá thiếu Văn Xương (ca dựng) |
| `calculateMultiChartSynergy` (can năm + can Mệnh người kia, hai chiều) | `luangiai/tuvi_hop_tham.lap` | **Trùng** cung đích + cung xung; **cố ý khác**: Python không có `impactVerdict` (BENEFACTOR_BOOST / TOXIC_DRAIN_ALERT…) — không chấm điểm hợp/khắc (2026-09-30), lời văn trung tính | 67/67 cặp × 12 hoá (804 đường) |
| `buildBirthTimeCalibrationTest` | `luangiai/tuvi_dinh_gio.lap` | **Trùng** chi giờ, chính tinh Mệnh, cung bị Kỵ xung theo năm; **cố ý khác**: năm đối chiếu do người dùng chọn (TS cố định 2022–2024), Python hỏi thêm cung Kỵ nhập + Lộc nhập, Tật Ách hỏi nhịp sinh hoạt (TS: "bệnh lý cần điều trị"), 12 canh cho người không biết giờ | 192/192 ứng viên × 3 năm |
| `calculateBaZhaiGua` | `calc/phongthuy.menh_quai` + `bang_huong` | **Trùng** 1901–2099 cả hai giới (số quái, tên quái, Đông/Tây tứ mệnh, 4 hướng tốt) với ngày sau Lập xuân; **cố ý khác**: TS lấy năm dương, Python năm theo Lập xuân (sinh 20/01 → năm trước); **TS lỗi năm 1900** (ra quái số 10) | 398/398 năm×giới |
| `0_legacy_adapter_mapping` + `normalizeToken` | `app/kb/tuvi_ma_chuan.py` | **Thêm mới**: mọi mục bảng v2.2 ra đúng mã + tên dự án ("Tử Nữ", "Nô Bộc", "Hoả Tinh", "Tị"); **cố ý khác**: tên cung/can/chi lạ → `ValueError` (TS âm thầm trả MENH/TY/GIAP), sao lạ → `None` (TS tạo `STAR_…`). Không đưa mã vào API công khai | 212/212 mục |
| `enrichLegacyChartWithV2Engine` | route `app/tuvi_v2_api.py` | **Không chuyển**: dự án không có "engine cũ" cần bọc — route nhận `la_so` và gọi thẳng các hàm trên | — |

Không tìm thấy chỗ Python sai so với TS ở điểm TS đúng.
