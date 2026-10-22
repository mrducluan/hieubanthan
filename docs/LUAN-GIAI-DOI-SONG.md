# LG-ĐS — Luận giải Tử vi "đời sống" + tầng HỌC Tử vi (GĐ1–GĐ2, pgvector)

Ngày: 2026-10-21 · Chủ dự án quyết (trả lời mục 7 `docs/PHAN-TICH-MIGRATION-V2-2.md`):
1. **Lưu luận giải gắn người dùng + cơ chế tự học: làm.**
2. **Làm tới GĐ2, bật pgvector.**
3. **Hiện công khai "x% thấy đúng" trên thẻ.**
4. Làm lại luận giải: đào sâu tổng quan, cuộc đời, gia đình, sức khoẻ, công việc, tình yêu…; lời dễ hiểu, không "giọng
   AI"; có hộp đóng khung / highlight điểm quan trọng; đưa hướng + lời khuyên.

Vòng tăng trưởng: **QUAY LẠI** (bài luận có ích → mở lại, bài đã lưu, nhịp 3 tháng) + **NẠP Sao** (chương sâu mở bằng
Sao) + nền móng (tự học làm luận đúng hơn theo thời gian). Đo: Gate 1/2 mảng Tử vi (`reading_completed`), tỉ lệ
"Đúng với mình" theo mã mẫu, `luan_giai_luu` (số bài lưu / người), tỉ lệ câu hỏi Tử vi "không nhận ra" trước/sau vectơ.

## 1. Vì sao bản cũ "học thuật"

`toan_bo.tuvi` ghép câu trả lời hỏi đáp cho 10 câu hỏi chuẩn → mỗi chương mở bằng **định nghĩa cung**, sau đó liệt kê
từng sao kèm nhãn (Miếu/Hãm), tên cách cục Hán, "Mệnh chủ Cự Môn, Thân chủ Hoả Tinh". Không có tổng hợp ("rốt cuộc tôi
thế nào?"), không có sức khoẻ, anh em, bạn bè, nhà cửa, không có dòng thời gian cuộc đời, lời khuyên rải rác.

## 2. Bản mới — cấu trúc

Engine (RULES, tất định, không LLM) đọc lá số → **chấm từng cung** → chọn câu đời thường từ KB mới → ghép chương có
hộp nổi bật. Phần học thuật cũ **không mất**: chuyển vào "Vì sao nói vậy" (`can_cu`, web thu gọn).

### 2.1 Chấm cung (`luangiai/tuvi_doi_song.py`)

Điểm của một cung = các chính tinh (độ sáng **Nam phái**: Miếu/Vượng +2, Đắc +1, Bình 0, Hãm −2) + tứ hoá sinh niên
trong cung (Lộc +2, Quyền +1, Khoa +1, Kỵ −2) + lục cát (Tả, Hữu, Xương, Khúc, Khôi, Việt, Lộc Tồn: +1) + lục sát
(Kình, Đà, Hoả, Linh, Không, Kiếp: −1) + **nửa điểm** cung xung chiếu và hai cung tam hợp (làm tròn về 0). Tuần/Triệt
đóng cung: ghi cờ `cham` ("việc đến chậm, cần kiên nhẫn"), không cộng trừ. Cung vô chính diệu: mượn chính tinh cung xung
chiếu (ghi rõ trong `can_cu`).

Mức: điểm ≥ 4 → `thuan` ("Thuận lợi"; VH-1 nâng từ 3), ≤ −2 → `can_chu_dong` ("Cần lưu ý" — VH-1 đổi nhãn từ "Cần chủ
động", giữ mã), còn lại `can_bang` ("Cân bằng"). Đường bay theo thang riêng (≥ 1 / ≤ −3); Lời khuyên, Vận hạn không mang mức. Không
có mức "xấu", không điểm số hiện cho người dùng.

### 2.2 Chương (theo thứ tự; chương 1 miễn phí như SAO-2)

| ma | Tiêu đề | Đọc từ |
|---|---|---|
| `tong_quan` | Con người bạn | Mệnh + Thân + Phúc Đức, cách cục (gọi tên đời thường) |
| `cuoc_doi` | Các giai đoạn cuộc đời | 12 đại hạn → dòng thời gian, đánh dấu giai đoạn đang đi |
| `su_nghiep` | Công việc & sự nghiệp | Quan Lộc (+ Mệnh, Thiên Di tam phương) |
| `tien_bac` | Tiền bạc | Tài Bạch + Điền Trạch |
| `tinh_cam` | Tình yêu & hôn nhân | Phu Thê + sao đào hoa |
| `gia_dinh` | Gia đình: cha mẹ, anh em, con cái | Phụ Mẫu, Huynh Đệ, Tử Nữ |
| `suc_khoe` | Sức khoẻ & năng lượng | Tật Ách (+ Mệnh) — **phòng ngừa, không chẩn đoán** (mục 2.4) |
| `quan_he` | Bạn bè, đồng nghiệp, môi trường bên ngoài | Nô Bộc, Thiên Di |
| `nha_cua` | Nhà cửa, nơi ở | Điền Trạch |
| `duong_bay` | Mảng đời nào kéo mảng đời nào | Phi hoá (lời đời thường từ `tuvi_phi_hoa`) |
| `nam_nay` | Năm nay & 3 tháng tới | Đại hạn → lưu niên → tiểu hạn → nhịp 3 tháng (thứ tự ưu tiên giữ nguyên) |
| `van_han` | Vận hạn & điều nên tránh | 10 năm tới: tứ hoá năm × cung chính, đại hạn, cờ dân gian (VH-1, mục 8) |
| `loi_khuyen` | Lời khuyên dành cho bạn | Tổng hợp: 3 điểm mạnh nên dùng, 3 điều nên để ý, 3 việc nên làm |

### 2.3 Hợp đồng JSON (`POST /v1/tuvi/luan-giai`, giữ mọi trường cũ)

```jsonc
{
  "mo_dun": "tuvi", "phien_ban": "doi_song_1", "trang_thai": "nhap_ai", "ket": "...", "phi": {...},
  "cot_loi": [Hop],                       // 3–5 hộp "Điều quan trọng nhất" đặt đầu bài
  "thoi_gian_bieu": [{                    // 12 đại hạn
    "tu_tuoi": 6, "den_tuoi": 15, "nam_tu": 1995, "nam_den": 2004, "cung": "Phụ Mẫu",
    "chu_de": "học hành, người dẫn dắt", "muc": "thuan|can_bang|can_chu_dong", "mot_cau": "...", "hien_tai": false }],
  "chuong": [{
    "ma": "su_nghiep", "tieu_de": "Công việc & sự nghiệp", "cau_hoi": "...",   // cau_hoi giữ cho tương thích
    "muc": "thuan|can_bang|can_chu_dong", "nhan_muc": "Thuận lợi",
    "tom_tat": "1–2 câu nói ngắn",
    "hop": [Hop],                         // 2–6 hộp, đã xếp
    "doan": ["đoạn thân bài đời thường", ...],   // giữ tên `doan` (SAO-2, diễn đạt AI, thuật ngữ dùng trường này)
    "can_cu": ["Thiên Cơ (Đắc) ở cung Quan Lộc", "Hoá Kỵ ở Tài Bạch", ...],   // "Vì sao nói vậy"
    "cau_tu_soi": "...",
    "moi_xem": {...}                      // như cũ
  }]
}
Hop = { "loai": "cot_loi|diem_manh|luu_y|loi_khuyen|thoi_diem",
        "tieu_de": "≤ 60 ký tự", "noi_dung": "1–3 câu", "can_cu": ["..."],
        "ma_mau": "ds.su_nghiep.thien_co.sang.manh",   // ^[a-z0-9_.+-]{3,60}$ — mã kiểm chứng tất định
        "ty_le_dung": 0.78, "so_phieu": 120,           // chỉ có khi đầu vào `trong_so` có mã này (≥ 30 phiếu)
        "dang_xem_lai": false }
```

Đầu vào thêm (tuỳ chọn): `trong_so: {ma_mau: {dung: int, chua_dung: int}}` (bảng tỉ lệ công khai, web lấy từ Supabase,
chỉ mã ≥ 30 phiếu, ≤ 5.000 mục) và `ca_nhan: {ma_mau: "dung"|"chua_dung"}` (phiếu của chính người đang xem).

### 2.4 Quy tắc lời văn (test bắt)

- Câu ngắn, chủ ngữ "bạn", ví dụ đời thường ("khi nhận lương", "lúc cãi nhau"). Thuật ngữ chỉ ở `can_cu`.
- **Cấm cụm "giọng AI"** (danh sách trong KB `cum_cam`): "hành trình", "khám phá bản thân", "năng lượng vũ trụ", "hãy
  nhớ rằng", "điều quan trọng là", "không chỉ… mà còn", "đánh thức", "tiềm năng vô hạn", "vũ trụ gửi", "bước ngoặt định
  mệnh", "chìa khoá vàng", "thăng hoa", "lan toả", "kiến tạo", "trao quyền", "phiên bản tốt nhất", "đồng hành cùng bạn"…
- Cấm doạ / phán: "chắc chắn", "định mệnh", "số phận", "tai hoạ", "xui xẻo", "đại hạn xấu", "khắc", "phá sản", "ly hôn",
  "chết", "tai nạn" (trừ khi phủ định trong câu an toàn).
- **Sức khoẻ**: được nói (a) nhịp năng lượng, thói quen dễ hao sức, (b) "phần cơ thể sách xưa gắn với sao này — nên chăm
  sóc phòng ngừa" (vd mắt, giấc ngủ, tiêu hoá), (c) lời khuyên sinh hoạt + khám định kỳ. **Cấm tên bệnh, cấm "bạn có/sẽ
  bị", cấm tiên đoán tuổi/năm ốm.** Chương luôn kèm câu: "Đây là gợi ý chăm sóc theo sách xưa, không thay lời bác sĩ — có
  dấu hiệu bất thường hãy đi khám."
- Mỗi hộp `luu_y` phải đi kèm một hướng xử lý (hộp `loi_khuyen` hoặc câu "nên…" trong chính hộp).

### 2.5 KB mới `engine/app/kb/data/tuvi_doi_song_kb.json` (nháp AI, source_id + school_id)

```jsonc
{ "_nguon": "...", "source": {...}, "trang_thai": "nhap_ai", "school_id": "nam_phai_viet",
  "linh_vuc": { "<Cung>": {"ma": "su_nghiep", "ten_doi_thuong": "công việc", "hoi": "..."} },      // 12 cung
  "sao_linh_vuc": { "<Chính tinh>": { "<Cung>": {
      "sang": {"manh": "...", "de_vap": "...", "loi_khuyen": "..."},
      "ham":  {"manh": "...", "de_vap": "...", "loi_khuyen": "..."} } } },                     // 14 × 12 × 2
  "hoa_linh_vuc": { "Lộc|Quyền|Khoa|Kỵ": { "<Cung>": {"y": "...", "loi_khuyen": "..."} } },        // 4 × 12
  "nhom_sao_linh_vuc": { "cat|sat|dao_hoa": { "<Cung>": {"y": "...", "loi_khuyen": "..."} } },      // 3 × 12
  "suc_khoe": { "<Chính tinh>": {"bo_phan": "...", "thoi_quen": "...", "loi_khuyen": "..."},
                "sat": {...}, "chung": "câu miễn trừ" },
  "dai_han": { "<Cung>": {"chu_de": "...", "nen_lam": "...", "de_vap": "..."} },                   // 12
  "muc": { "thuan": "Thuận lợi", "can_bang": "Cân bằng", "can_chu_dong": "Cần lưu ý" },
  "cach_cuc_doi_thuong": { "<tên cách cục>": "một câu đời thường" },
  "cum_cam": ["hành trình", ...] }
```
Mỗi mục lá có thể kèm `source_id` riêng; mặc định thừa kế `source`/`school_id` gốc file. `sang` dùng khi chính tinh
Miếu/Vượng/Đắc, `ham` khi Hãm; Bình dùng `sang` nhưng bỏ câu "mạnh" nếu cung `can_chu_dong`.

## 3. Tầng HỌC Tử vi — migration 0017 (`supabase/migrations/0017_tuvi_hoc.sql`)

| Bảng / hàm | Làm gì | Bảo vệ |
|---|---|---|
| `create extension vector` (schema `extensions`) | pgvector | Down không gỡ extension (có thể dùng nơi khác) |
| `kiem_chung_phieu` | Một phiếu / người / mã: `khoa` (HMAC máy chủ của user_id hoặc IP), `user_id` (null với khách, FK cascade), `loai`, `mau`, `phai`, `ket_qua`, `tao_luc`, `het_han` 24 tháng | RLS: chủ xem phiếu của mình; ghi chỉ qua hàm service role; đổi ý = cập nhật phiếu (không cộng dồn) |
| `ghi_kiem_chung(...)` | Upsert phiếu, kiểm mã theo mẫu cho phép | `security definer set search_path = ''`, chỉ service_role |
| `ty_le_kiem_chung(p_mau text[] \| null, p_toi_thieu int)` | Số đúng/chưa đúng theo mã (≥ ngưỡng) | Chỉ số đếm, service_role (web công khai qua route có cache) |
| `luan_giai_luu` | Bài luận người dùng **chủ động lưu** (hoặc bật "tự lưu" — không tích sẵn): `user_id`, `mo_dun`, `tieu_de`, `noi_dung jsonb` (≤ 256 KB), `engine_version`, `tao_luc`, `het_han` 365 ngày | RLS chủ sở hữu select/insert/delete, ≤ 100 bài, xoá ngay |
| `tuy_chon_hoc` | `user_id` pk, `tu_luu_luan_giai bool default false`, `dong_y_luc` | RLS chủ sở hữu |
| `cau_hoi_vec` | Kho vectơ ý định: `mo_dun`, `y_dinh`, `cau` (đã lọc), `vec vector(512)`, `mo_hinh`, `nguon` (`kho` / `nguoi_dung` / `bien_tap`), `so_xac_nhan`, `khoa_xac_nhan text[]` (≤ 20 HMAC), `trang_thai` (`hoat_dong` / `cho_duyet` / `tat`) | Không user_id; RLS không policy; hàm service role |
| `tim_y_dinh_gan(mo_dun, vec, mo_hinh, nguong)` | Láng giềng gần nhất (cosine, HNSW) trong `hoat_dong` | service_role |
| `xac_nhan_y_dinh(...)` | Người dùng bấm "Đúng ý tôi hỏi": gộp vào câu gần trùng (cos ≥ 0,95, cùng ý định) hoặc thêm `cho_duyet`; **≥ 3 khoá khác nhau → tự `hoat_dong`** | service_role; quản trị tắt được |
| `thong_ke_hoc_tuvi()` / `duyet_cau_hoi_vec()` | Quản trị xem & bật/tắt | `qt_can_vai_tro` |

**Tự học — ranh giới:** máy được (a) xếp lại / hạ hộp có tỉ lệ đúng thấp (≥ 100 phiếu, < 40% → `dang_xem_lai`, chuyển
xuống "Vì sao nói vậy"), (b) hạ hộp mà chính người đó đã bấm "chưa đúng", (c) thêm câu hỏi đã lọc vào kho vectơ khi đủ
3 người xác nhận cùng ý định. Máy **không** sinh câu luận mới, **không** đưa chữ người dùng vào lời nhắc AI (chữ người
dùng chỉ là dữ liệu cho người duyệt), **không** sửa KB — sửa KB vẫn qua PR.

## 4. pgvector — nhúng ở đâu

`engine/app/nhung.py`: vectơ **512 chiều tất định** (băm cụm âm tiết bỏ dấu + cụm 2 âm tiết + n-gram 3 ký tự, chuẩn hoá
L2), **không gửi câu hỏi ra ngoài**, không thư viện mới (`mo_hinh = "bam512_v1"`). Đổi sang mô hình nhúng ngữ nghĩa (qua
OpenRouter — cùng nhà cung cấp đã khai) = đặt env `NHUNG_MO_HINH`, dựng lại kho; cột `mo_hinh` tách hai loại vectơ.

Luồng hỏi đáp Tử vi: engine trả `y_dinh` (None khi từ khoá không nhận ra) → web máy chủ xin engine `/v1/nhung` cho câu
đã lọc → `tim_y_dinh_gan` (ngưỡng cos ≥ 0,82) → có kết quả thì hỏi lại engine với `y_dinh_goi_y` → câu trả lời kèm nút
"Đúng ý bạn hỏi?" → `xac_nhan_y_dinh`. Kho gốc: `/quan-tri/hoc` nút "Dựng kho vectơ" (engine `/v1/nhung/kho` trả câu có
nhãn + vectơ từ `fixtures/cau_hoi/huyenhoc_cau_hoi.jsonl`, web upsert `nguon = 'kho'`).

## 5. "x% thấy đúng" công khai

Thẻ có `ma_mau` hiện "**78%** trong 120 người có cùng điểm này thấy đúng" khi ≥ 30 phiếu; dưới ngưỡng: "Bạn thấy
đúng không?" (không hiện số). Số lấy từ `ty_le_kiem_chung`, route web cache 1 giờ. Ghi chú nhỏ: "số người tự bấm, không
phải kiểm định khoa học".

## 6. BT-ĐS — Luận giải Bát tự cùng khung (2026-10-21)

Chủ dự án: "Bát tự vẫn là bản cũ. Làm tiếp Bát tự theo cùng khung như Tử vi." Bản cũ (`toan_bo.battu`) ghép 4 câu trả
lời hỏi đáp → mở bằng định nghĩa, liệt kê thập thần, thiếu tổng hợp, thiếu tình cảm / gia đình / sức khoẻ / lời khuyên.
Vòng tăng trưởng: **QUAY LẠI** (bài có ích, "Năm nay & tháng tới" đổi theo tháng tiết, bài đã lưu) + **NẠP Sao** (chương 2–12
mở bằng Sao như SAO-2). Đo: Gate 1/2 mảng `battu` (`reading_completed`), tỉ lệ "Đúng với mình" theo mã `ds.bt.*`,
`luan_giai_luu` với `mo_dun = battu`.

### 6.1 Đọc gì — một bộ tính

`luangiai/battu_doi_song.py` (RULES, tất định) chỉ ĐỌC số `calc.battu` / `calc.battu_mo_rong` đã tính: 4 trụ, thập thần,
tàng can, điểm ngũ hành (`THANG_DIEM`), thân vượng / nhược, dụng thần hai cách (`_dung_than`: phù ức + điều hậu kiểu
Trích Thiên Tuỷ; cách cục Tử Bình Chân Thuyên), đại vận, lưu niên + 12 lưu nguyệt, thần sát, quan hệ hợp / xung / hình /
hại giữa trụ. Tháng "tới" tính theo tiết (ngày giao tiết giờ VN, `calc.tietkhi`). Không chép phép tính nào sang đây.

### 6.2 Chấm mảng đời (luật công khai, docstring mô-đun)

- **Nhóm thập thần theo hành** (`vai_tro_hanh`): Tỷ Kiếp · Ấn · Thực Thương · Tài · Quan Sát. Tỉ lệ nhóm = điểm hành / tổng.
  Độ đậm: ≥ 30% `dam` · ≥ 12% `vua` · > 0 `mong` · 0 `vang`; "có mặt rõ" = dam / vua.
- **Hợp sức** (chấm RIÊNG cho từng cách — QC 2026-10-21): +1 khi hành của nhóm là hành cần thêm theo cách ấy và nhóm có
  mặt rõ; −1 khi là hành nên bớt theo cách ấy và nhóm đậm.
- **Hai cách (dụng thần — KHÔNG tự chọn, `chon = None`)**: cách 1 "cân sức" = phù ức + điều hậu (hành nên bớt = phần còn
  lại khi thân vượng / nhược); cách 2 "theo tháng sinh" = hỷ / kỵ theo nhóm của cách cục (KB `cach.<ma>.hy/ky`, có bản riêng
  khi thân nhược / vượng — vd Tài cách thân nhược: hỷ Ấn, kỵ Tỷ Kiếp).

Mảng có phần phụ thuộc dụng thần (Con người bạn, Năng lượng, Công việc, Tiền bạc, Tình cảm, Gia đình) chấm mức theo
**từng cách** (`muc_cach_1`, `muc_cach_2`, trả ở `chuong[].hai_cach_muc`) rồi gộp bằng `gop_muc` — cùng luật đại vận bên
dưới; khác nhau → thân bài nói rõ "theo cách cân sức thì…, theo tháng sinh thì…", "Vì sao nói vậy" ghi mức từng cách.

| Mảng | Luật (điểm ≥ 2 Thuận lợi · ≤ −1 Cần lưu ý · còn lại Cân bằng — ngưỡng riêng từng mảng từ VH-1, mục 8.2) |
|---|---|
| Công việc | Quan Sát rõ +1 (+ hợp sức; Ấn hoặc Tài đỡ +1; Thực Thương đậm gặp Quan −1); không Quan mà Thực Thương rõ: 0 (sống bằng tay nghề); không cả hai −1 |
| Tiền bạc | Tài rõ +1 (+ hợp sức; Thực Thương rõ sinh Tài +1); không Tài −1 (0 nếu Thực Thương rõ); Tỷ Kiếp đậm −1. Thân nhược mà Tài đậm → hộp "tiền đến nhiều nhưng dễ mệt vì gánh" |
| Tình cảm | sao phối ngẫu (nam Tài, nữ Quan Sát) rõ +1 + hợp sức, vắng −1; nữ lộ cả Chính Quan lẫn Thất Sát −1; nam Tỷ Kiếp đậm −1; chi ngày (cung phối ngẫu) bị xung / hình / hại −1, hợp +1; bản khí chi ngày → "kiểu gắn bó" |
| Gia đình | Ấn rõ +1 + hợp sức; Tài đậm phá Ấn −1; trụ năm–tháng xung / hình / hại −1, hợp +1; anh em (Tỷ Kiếp), con cái (nam Quan Sát, nữ Thực Thương; trụ ngày–giờ) chỉ thêm hộp |
| Học & nghĩ | Ấn rõ +1, Thực Thương rõ +1; Ấn đậm lấn Thực Thương −1; cả hai mỏng −1; Văn Xương / Thái Cực / Hoa Cái +1 |
| Bạn bè, bên ngoài | thân yếu có bạn ngang hàng đỡ +1; thân mạnh mà Tỷ Kiếp đậm −1; Quan Sát đậm đè thân yếu −1; Thiên Ất Quý Nhân +1; Vong Thần −1; Kiếp Sát −1 |
| Con người bạn | thân trung hoà +1; hành cần thêm (của từng cách) có mặt rõ +1, vắng hẳn −1; ≥ 2 sao cát +1; ≥ 2 sao hung −1 |
| Năng lượng | cách 1: phù ức / điều hậu không cần hoặc hành cần bù đã có mặt rõ +1 mỗi phần, vắng hẳn −1; cách 2: hỷ (như trên) + kỵ (hành nên bớt đậm −1, đều mỏng +1) |
| Sức khoẻ | theo độ lệch: thiếu ≥ 2 hành hoặc một hành ≥ 45% → Cần lưu ý; không thiếu và hành lớn nhất < 35% → Thuận lợi |

**Đại vận / lưu niên / lưu nguyệt**: mỗi cách chấm can (1 điểm) + chi (2 điểm, hành bản khí) — hành cần thêm cộng, hành
nên bớt trừ; ≥ 1 thuận, ≤ −1 cần chủ động. Gộp: cùng mức → mức đó; ngược nhau → Cân bằng + câu "Hai cách đọc cho kết quả
ngược nhau…"; một cách cân bằng → theo cách còn lại + câu "Hai cách đọc khác nhau…". Ưu tiên đại vận > lưu niên > lưu nguyệt.

**Tuổi**: < 16 tuổi — chương công việc / tiền / tình cảm thêm câu "nói về xu hướng khi lớn lên", không nói con cái của
chính em; ≥ 45 tuổi và sao con mỏng → hộp "con cái tự lập, cần quan tâm đều" (không khuyên "lên kế hoạch có con").

### 6.3 Chương (chương 1 miễn phí như SAO-2)

| ma | Tiêu đề | Đọc từ | Trực quan (web) |
|---|---|---|---|
| `tong_quan` | Con người bạn | nhật chủ × sức tự thân (KB 10 × 3), thập thần nổi nhất, cách cục (tên đời thường), Thiên/Nguyệt Đức | `than_do` → thanh sức tự thân |
| `ngu_hanh` | Năng lượng của bạn: thừa gì, thiếu gì | hành dư / thiếu + **hai cách** gợi ý bù (màu, hướng, thói quen, nghề — dân gian) | `bieu_do` → 5 cột ngũ hành, `hai_cach` |
| `cuoc_doi` | Các giai đoạn cuộc đời | 8 đại vận → `thoi_gian_bieu` (mức gộp + từng cách) | dải đại vận hai cách + dòng thời gian |
| `su_nghiep` | Công việc & sự nghiệp | Quan Sát, Ấn, Tài, Thực Thương; nghề theo cách cục | |
| `tien_bac` | Tiền bạc | Tài, Thực Thương, Tỷ Kiếp; Lộc Thần, Kim Dư | |
| `tinh_cam` | Tình yêu & hôn nhân | sao phối ngẫu, chi ngày, Đào Hoa / Hồng Diễm, Cô Thần / Quả Tú | |
| `gia_dinh` | Gia đình: cha mẹ, anh em, con cái | Ấn, trụ năm–tháng, Tỷ Kiếp, sao con + trụ giờ | |
| `hoc_tap` | Cách bạn học và nghĩ | Ấn, Thực Thương, Thiên Ấn, Văn Xương / Thái Cực / Hoa Cái | |
| `suc_khoe` | Sức khoẻ & năng lượng | hành dư / thiếu → phần cơ thể sách xưa gắn với hành (phòng ngừa) + nhịp sức theo thân | miễn trừ `mien_tru` |
| `quan_he` | Bạn bè, đồng nghiệp, người bên ngoài | Tỷ Kiếp × thân, Quan Sát, Thiên Ất, Tướng Tinh, Dịch Mã, Vong Thần, Kiếp Sát… | |
| `nam_nay` | Năm nay & tháng tới | đại vận đang đi → lưu niên (+ quan hệ với chi ngày) → 3 tháng theo tiết | |
| `van_han` | Vận hạn & điều nên tránh | 10 năm lưu niên (hai cách) + cờ dân gian + 12 tháng tiết (VH-1, mục 8) | dòng 10 năm, dải 12 tháng |
| `loi_khuyen` | Lời khuyên dành cho bạn | 3 điểm mạnh, 3 điều nên để ý, 3 việc nên làm (gom từ các chương) | |

### 6.4 Hợp đồng JSON (`POST /v1/battu/luan-giai`, cùng `doi_song_1` mục 2.3, nhận `trong_so` / `ca_nhan`)

Thêm so với Tử vi: `chuong[tong_quan].than_do = {ti_le, vuong_tu, nhuoc_duoi, muc: manh|yeu|can_bang, nhan}`,
`chuong[ngu_hanh].bieu_do = {hanh: [{hanh, diem, ty_le, nhom, trang_thai: thieu|thua|vua, cach_1, cach_2}], nhat_chu}`,
`chuong[ngu_hanh].hai_cach = {cach_1: {ten, hanh}, cach_2: {ten, hanh, ma}, chon: null}`,
`thoi_gian_bieu[] += {nhan: "vận Ất Dậu", muc_cach_1, muc_cach_2, hai_cach_khac}` (`cung` = can chi của vận),
`chuong[nam_nay].nam_xem`, `chuong[cuoc_doi|nam_nay].van_tham_chieu = {trang_thai: dang_di|chua_khoi|da_qua_van_cuoi,
chi_so}` (một hàm cho cả hai chương), `chuong[<mảng>].hai_cach_muc = {cach_1, cach_2}`. Thuật ngữ (thập thần, nhật chủ, dụng thần, can chi…) chỉ ở `can_cu`.

**Mã kiểm chứng `ds.bt.<chương>.<…>`** (vd `ds.bt.tien_bac.tai_nang_than_yeu.vap`, `ds.bt.cuoc_doi.thuong_quan.thuan.hien_tai`):
dùng tiền tố `ds.` để đi qua ràng buộc có sẵn của migration 0017 (loại `doi_song`, mã `^ds\.…`) — **không cần migration
mới**; phái ghi kèm phiếu = `tu_binh` (web `PHAI_DOI_SONG`). Bảng tỉ lệ công khai dùng chung với Tử vi (mã khác tiền tố).

### 6.5 KB `engine/app/kb/data/battu_doi_song_kb.json` (nháp AI, `source_id` tu_binh_chan_thuyen, `school_id` tu_binh)

`nhat_chu` (10 can × hình tượng, chân dung, câu tự soi, manh / yeu / can_bang × {manh, de_vap, loi_khuyen}) · `noi_bat`
(10 thập thần) · `cach` (11 cách: tên đời thường, ý, mặt trái, nghề, hỷ / kỵ theo nhóm) · `hanh` (5 hành: thừa / thiếu,
màu, hướng, nghề, thói quen, phần cơ thể, nhịp, lời khuyên sức khoẻ) · `than_sat` (18 sao, lời đời thường) ·
`tinh_huong.<mảng>.<mã>` ({tieu_de, loai, y, loi_khuyen}) · `phoi_ngau` (10, theo bản khí chi ngày) · `suc_khoe` ·
`van` (10 thập thần của vận: chủ đề, nên làm khi thuận, dễ vấp, nên làm khi cần chủ động) · `thang` · `nam_quan_he` ·
`tom_tat` · `cau_tu_soi`. Cụm "giọng AI" dùng CHUNG danh sách `cum_cam` của Tử vi. Test: không thuật ngữ ngoài
`can_cu`, không cụm cấm / doạ, không tên bệnh, không lặp câu giữa các chương, hai lá khác hẳn ít câu chung (< 25%), không
hộp nào xuất hiện ở > 70% lá golden (chặn câu ai đọc cũng đúng). Golden 15 lá: `fixtures/golden/battu_doi_song.json`.

### 6.6 Web

Trang `/bat-tu` dùng chung `components/luan-giai/BaoCaoDoiSong` (hộp nổi bật, "Vì sao nói vậy", kiểm chứng, lưu bài,
khoá chương SAO-2) + `BieuDoBatTu.tsx` (thanh sức tự thân, 5 cột ngũ hành, dải đại vận hai cách — `motion`, tôn trọng
prefers-reduced-motion, SVG nội dòng). Route `/api/battu/luan-giai` gửi `trong_so` + `ca_nhan` như Tử vi
(`lib/hoc-tuvi.themHocLuanGiai`). E2E: `e2e/luan-giai-bat-tu.spec.ts` (fixture sinh từ engine thật).

### 6.7 QC 2026-10-21 (rà sau khi giao BT-ĐS)

Đã sửa (test viết trước, `tests/test_battu_doi_song.py` mục "QC 2026-10-21"):

1. **Không có đại vận "đang đi"**: `van_tham_chieu(tgb, nam_xem)` chọn vận tham chiếu + trạng thái (`dang_di` /
   `chua_khoi` / `da_qua_van_cuoi`); chương "Các giai đoạn" và "Năm nay" dùng cùng kết quả, câu riêng từng trạng thái
   ở KB `van_tham_chieu` (nháp AI). Người đã qua 8 vận không còn đọc "mười năm này / mười năm tới bắt đầu năm 2016";
   chương Các giai đoạn lấy vận cuối làm "gần nhất" (mã `…gan_nhat`, `…truoc`); trẻ chưa khởi vận không còn tóm tắt
   "Mười năm này…". Chưa khởi vận / đã qua vận cuối: mức chương Năm nay theo lưu niên. Test 1936–1959 + trẻ sơ sinh.
2. **Mức mảng đời ngầm theo dụng thần cách 1**: chấm theo cả hai cách rồi gộp như đại vận (mục 6.2). Golden 12/15 lá
   đổi mức; 169/315 lá (golden + 300 ngẫu nhiên) đổi ít nhất một mức, đa số Cân bằng → Thuận lợi khi một cách thấy
   thuận, cách kia cân bằng.
3. **Hai hộp "dễ vấp" trái nhau ở chương Con người bạn** (vd "quá chặt với tiền" + "tiền vào nhanh ra cũng nhanh"):
   mỗi chủ đề (`CHU_DE_VAP`: tiền, nóng vội, một mình gánh…) chỉ giữ một hộp — nét nổi nhất thắng nét của cách cục.
   Test 300 lá.

Cùng đợt (ngoài BT-ĐS): "Xem lá số 2 người" — cung phi năm theo Lập xuân như `/phong-thuy` (ghi rõ khi mốc Tết cho
quái khác), người kia chỉ có ngày dùng cùng lịch người dùng chọn và suy vùng từ nơi sinh (miền Nam 1960–1975 lịch
UTC+8); "3 tháng tới" — nhãn "Nửa sau tháng 6 nhuận (tính như tháng 7)", trục biểu đồ "6N·đầu" / "6N·sau".

**Đã sửa 2026-10-22 — đại vận "đang đi" theo NGÀY khởi vận.** CALC `battu._dai_van` thêm `tu_ngay` / `den_ngay` cho
mỗi vận (ngày khởi vận + 10 năm), hàm `dai_van_theo_ngay(ls, ngay)`. Luận giải: `thoi_gian_bieu(pt, ngay_xem)` đánh
dấu `hien_tai` theo ngày, `van_tham_chieu` (chưa khởi / đang đi / đã qua) theo ngày, "năm thứ n của giai đoạn" đếm từ
ngày bắt đầu vận, giai đoạn mới bắt đầu trong 12 tháng tới → câu "Từ ngày 13/12/2026, bạn sang giai đoạn mười năm
mới…", căn cứ ghi khoảng ngày. Hỏi đáp "đại vận hiện tại" theo ngày; hỏi một năm cụ thể (và lưu niên, dòng 10 năm)
giữ **quy ước bảng đại vận** (`dai_van_tai`: năm bắt đầu vận → 9 năm sau, như các phần mềm Bát tự phổ biến), riêng
năm đang xem lấy đúng vận đang đi và căn cứ ghi "Ngày … sang đại vận …". Hồ sơ mẫu 17/05/1990: Ất Dậu bắt đầu
13/12/2026 → ngày 21/10/2026 vẫn Giáp Thân (trước báo nhầm Ất Dậu). `tu_nam` / `den_nam` giữ nguyên → không tăng
`ENGINE_VERSION`. Web: dòng thời gian hiện "từ 13/12/2016 đến 12/12/2026".

## 7. Rà chung chung Tử vi 2026-10-21

Chủ dự án: "Xem lại phần nào luận giải còn mang tính chung chung, không có ý nghĩa thì sửa đi." Phạm vi: 11 chương đời
sống (trừ `nam_nay` — nhịp tháng do phiên khác sửa), `tuvi_doi_song_kb.json`, `tuvi_kb.json` (nghĩa sao × cung, tứ hoá ×
cung cho thẻ cung / hỏi đáp / trang SEO), `tuvi_cach_cuc.json`, chữ ghép trong `tuvi_phi_hoa.py`. Không đổi lá số, không
đổi điểm/mức của cung → không tăng `ENGINE_VERSION`.

### 6.1 Đo — `engine/scripts/do_chung_chung_tuvi.py` (giữ để chạy định kỳ)

`cd engine && .venv/bin/python scripts/do_chung_chung_tuvi.py [--tat-ca] [--chi-tiet]` — 8 lá mẫu (golden
`lasotuvi_60.json`, người sinh 1946–2005, mỗi kiểu Mệnh một lá) hoặc cả 60 lá. Đơn vị = câu người dùng đọc (tóm tắt,
đoạn, hộp, dòng thời gian; không gồm "Vì sao nói vậy", câu tự soi, câu miễn trừ cố định).

| Chỉ số (càng thấp càng tốt) | 8 lá trước | 8 lá sau | 60 lá trước | 60 lá sau |
|---|---|---|---|---|
| Câu trùng nguyên văn giữa hai lá "khác hẳn" (≤ 3/12 cung cùng bộ chính tinh), trung bình | 0,199 | 0,067 | 0,186 | 0,049 |
| … cặp tệ nhất | 0,452 | 0,278 | 0,500 | 0,295 |
| Câu "Barnum" (có ở ≥ 50% số lá) | 30 | 3¹ | 22 | 0 |
| Câu lặp nguyên văn trong một bài (trung bình / bài) | 4,0 | 0 | 4,02 | 0 |
| Câu chứa cụm chung chung (KB `cum_chung_chung`) / bài | 14,9 | 0 | 15,3 | 0 |
| Câu lộ thuật ngữ ngoài "Vì sao nói vậy" / bài | 0 | 0 | 0 | 0 |
| Câu định nghĩa cung thay vì nói về người xem / bài | 0 | 0 | 0 | 0 |
| Hộp lưu ý có hướng xử lý chung (một câu cho ≥ 2 mảng đời, hoặc câu dự phòng trong mã) / bài | 2,88 | 0 | 2,85 | 0 |
| Mục lời luận KB chứa cụm chung chung (đời sống / tuvi_kb / cách cục) | 11 / 6 / 0 | 0 / 0 / 0 | | |
| Mục lời luận KB chứa cụm cấm giọng AI (đời sống / tuvi_kb / cách cục) | 0 / 3 / 5 | 0 / 0 / 0 | | |
| Số câu / bài | 133,6 | 128,6 | 132,4 | 127,9 |

¹ Ba câu còn lại là lời theo SAO (lời sức khoẻ của Thiên Cơ, "Ra ngoài bạn mạnh nhất ở chỗ cần lý lẽ" của Cự Môn sáng ở
Thiên Di) — 4/8 lá mẫu tình cờ có cùng sao ở cùng chỗ; trên 60 lá không còn câu nào ≥ 50%.

Chương `nam_nay` đo riêng (không sửa): trùng giữa lá 0,222 (8 lá) / 0,226 (60 lá); 27/60 bài có câu tháng lặp nguyên
văn trong chính chương này — chuyển phiên sửa nhịp tháng.

### 6.2 Sửa gì

- **Tóm tắt chương nói VÌ SAO** (`ly_do`, `ly_do_cau`): thay 3 câu mô tả mức dùng chung ("Có cả điểm thuận lẫn chỗ cần
  để ý; kết quả tuỳ nhiều vào cách bạn làm") bằng lý do lấy từ chính cung: độ sáng chính tinh (lời đời thường), tứ hoá,
  cát/sát, Tuần/Triệt, cung vô chính diệu, và **tên mảng đời** ở cung xung chiếu / tam hợp đang đỡ hay kéo. Thuận →
  điều đỡ trước; cần chủ động → điều vướng trước; cân bằng → "…, nhưng …". Cung Tật Ách nói về sức, không nói "nét".
- **Tuần/Triệt riêng từng cung** (KB `tuan_triet`: câu Tuần, câu Triệt, việc nên làm cho mỗi loại) thay một câu
  "việc đến chậm… đừng bỏ ngang" cho mọi cung.
- **Lục sát theo cặp sao** (KB `sat_loi_khuyen` 11 cung × Kình Đà / Hoả Linh / Không Kiếp) và một vế nói rõ cát/sát cụ
  thể (KB `nhom_sao_chi_tiet`: Khôi Việt → người giúp là người lớn tuổi, Xương Khúc → việc học, giấy tờ…).
- **Dòng thời gian**: việc nên làm theo MỨC của giai đoạn (KB `dai_han.thuan|can_bang|can_chu_dong`) + lý do; giai
  đoạn bắt đầu ≤ 12 tuổi dùng lời tuổi đi học (`tuoi_nho` — không còn "lo chỗ ở, tích luỹ tài sản" cho đứa trẻ 6 tuổi).
  Hộp chương "Các giai đoạn" không chép lại dòng thời gian; "nên tận dụng / nên chuẩn bị trước" chỉ nói giai đoạn chưa
  qua (người lớn tuổi hết giai đoạn thuận phía trước → hộp mới "Giai đoạn thuận bạn đã đi qua"); câu an ủi chung thay
  bằng "quãng thuận dài nhất".
- **Sức khoẻ**: tóm tắt nêu đúng phần cơ thể nên giữ của lá này; bỏ câu chung "các gợi ý dưới đây…"; sát ở Tật Ách theo
  từng sao (KB `suc_khoe.sat_sao`).
- **Thân cư** theo cung (KB `than_cu`), **phá cách** nói nét mờ đi khi nào theo nhóm sát hội về (hộp phá cách thứ hai nói
  khác, không lặp nguyên câu).
- **Đường bay**: tóm tắt gọi tên mảng hay đỡ / mảng hay kéo; Lộc/Quyền/Khoa dùng câu theo cung đích (KB phi hoá, chỉ
  đọc) điền mảng phát bằng lời thường; mẫu "*" (không nói mảng phát) không dùng lời mẫu; việc nên làm của Kỵ gắn vào
  lúc mảng phát đang căng, không lặp giữa hai đường bay.
- **Lời khuyên**: tóm tắt nêu chỗ dựa lớn nhất / chỗ nên gỡ trước; "Nên gỡ từng điều theo ba việc ngay dưới" → thứ tự
  mảng cụ thể.
- **KB thẻ cung / hỏi đáp**: viết lại 48 câu `tu_hoa_cung` (vd "Con cái, sáng tạo mang lại niềm vui.") thành câu cụ thể
  + một việc nên làm; sửa cụm cấm ("toả sáng", "chìa khoá", "trao quyền", "đồng hành", "tai nạn") ở `tuvi_kb`,
  `tuvi_cach_cuc`. Bỏ `muc_mo_ta` / `muc_mo_ta_bien_the` (không còn dùng).
- Danh sách cụm chung chung mới: KB `cum_chung_chung` (46 cụm, tách khỏi `cum_cam`).

**Mã kiểm chứng (`ma_mau`)**: không đổi mã nào. Thêm một mã mới `ds.cuoc_doi.dh_<cung>.thuan.da_qua`. Lời của nhiều mã
viết lại nhưng cùng điều kiện lá số (cùng sao × cung × sáng/hãm, cùng Tuần/Triệt…), phiếu cũ vẫn dùng được.

### 6.3 Ví dụ trước → sau (lá 15/05/1990 giờ Thìn nam, xem 21/10/2026)

| Chỗ | Trước | Sau |
|---|---|---|
| Tóm tắt "Con người bạn" | Nhìn chung, con người bạn ở mức cân bằng. Có cả điểm thuận lẫn chỗ cần để ý; kết quả tuỳ nhiều vào cách bạn làm. | Con người bạn ở mức cân bằng: nét mạnh của bạn dùng được việc, nhưng chuyện tiền bạc lẫn chuyện công việc cũng đang cần bạn lo. |
| Tuần ở Phu Thê | Ở chuyện tình cảm, vợ chồng, việc thường đến chậm hơn bạn mong. Nên chuẩn bị sớm, kiên nhẫn và đừng bỏ ngang khi chưa thấy kết quả. | Chuyện tình cảm của bạn thường đến muộn hoặc phải qua một hai mối mới thành; quan hệ càng lâu càng bền. Đừng vội cưới cho kịp tuổi; quen đủ lâu để thấy người ấy xử lý một lần cãi nhau và một lần thiếu tiền ra sao. |
| Thân cư Tài Bạch | Càng lớn tuổi, bạn càng dồn tâm sức cho chuyện tiền bạc. Nên chọn sớm cách làm bền cho mảng này. | Càng lớn tuổi, bạn càng dồn sức vào chuyện kiếm và giữ tiền; bạn yên tâm nhất khi tài khoản có dư. Đặt một con số đủ dùng cho từng năm; đạt rồi thì dành thời gian cho sức khoẻ và người nhà. |
| Sức khoẻ (tóm tắt + đoạn) | Nhịp sức của bạn khá bền; giữ được nếp sinh hoạt là giữ được sức. Các gợi ý dưới đây xoay quanh nếp ăn ngủ, vận động và khám định kỳ — làm đều mỗi ngày quan trọng hơn làm nhiều một lúc. | Sức của bạn khá bền; chỗ nên giữ kỹ nhất là phổi, hô hấp. |
| Đường bay (tóm tắt) | Trong đời bạn, các mảng đời kéo nhau khá rõ: chỗ thuận nhiều hơn chỗ vướng. | Mảng hay đỡ cho các mảng khác là chuyện công việc; mảng hay kéo bận tâm sang chỗ khác là chuyện sức khoẻ. |
| Thẻ cung / hỏi đáp: Hoá Lộc ở Tử Nữ | Con cái, sáng tạo mang lại niềm vui. | Con cái hoặc điều bạn tự làm ra (sản phẩm, học trò) làm bạn tự hào, có khi thành cả nguồn thu. Nên dành thời gian cho con khi mọi việc đang thuận. |

### 6.4 Test chặn tái phạm — `tests/test_tuvi_doi_song_chung_chung.py`

Trên 16 lá golden (mỗi lá thứ 4): (a) trùng giữa hai lá khác hẳn trung bình ≤ **0,10**, cặp tệ nhất ≤ **0,40**, không
câu nào có ở ≥ 50% số lá; (b) không câu lặp trong một bài (trừ chương "Lời khuyên" gom lại có chủ ý, và lặp nằm trọn
trong `nam_nay`); (c) không câu nào chứa `cum_chung_chung`, KB lời luận sạch cụm chung chung + cụm cấm; (d) mỗi hộp lưu ý
có hướng xử lý nằm trong hộp, không phải câu dự phòng trong mã, không dùng chung cho hai mảng đời. Kèm test đơn vị cho lý
do theo mức, Tuần/Triệt từng cung, lời tuổi đi học, không nói giai đoạn đã qua, sát theo cặp sao, phá cách không lặp.

### 6.5 Đợt 2 — ba bề mặt ngoài bài: đường bay, thẻ cung, hỏi đáp cung

Phạm vi: thẻ "đường bay nổi bật" (`/v1/tuvi/phi-hoa` → `noi_bat`, KB `tuvi_phi_hoa_kb.json` trừ `nhip_3_thang` /
`hop_tham`), lời giải nghĩa chính tinh trên thẻ chi tiết 12 cung (`/v1/tuvi/an-sao` → `chinh_tinh[].giai_nghia`), câu
trả lời template "Cung X của tôi nói gì?" (`hoidap/tuvi.py`). Không đổi lá số, không đổi mã mẫu → không tăng
`ENGINE_VERSION`.

**Đo** — `scripts/do_chung_chung_tuvi.py --be-mat [--tat-ca] [--chi-tiet]`: mỗi lá một tập câu người dùng đọc (không gồm
căn cứ, câu tự soi, câu kết / miễn trừ cố định). 60 lá golden:

| Chỉ số (càng thấp càng tốt) | Đường bay trước | sau | Thẻ cung trước | sau | Hỏi đáp cung trước | sau |
|---|---|---|---|---|---|---|
| Câu "Barnum" (có ở ≥ 50% số lá) | 7 | **0** | 28 | **0** | 76 | **0** |
| Câu trùng giữa hai lá khác hẳn, trung bình | 0,168 | 0,062 | 0,817 | 0,031 | 0,556 | 0,087 |
| … cặp tệ nhất | 0,654 | 0,571 | 1,0 | 0,50 | 0,714 | 0,478 |
| Câu lộ thuật ngữ (tên sao, tên cung kỹ thuật, tứ hoá, độ sáng) / lá | 13,5 | **0** | 3,65 | **0** | 77,2 | **0** |
| Câu chứa cụm cấm giọng AI / lá | 0 | 0 | 0 | 0 | 4,87¹ | 0 |
| Câu chứa cụm chung chung / lá | 0 | 0 | 0 | 0 | 0 | 0 |
| Số câu / lá | 26,2 | 26,1 | 27,5 | 42,0² | 136,2 | 99,0 |

¹ "khắc", "xui", "tai nạn" trong câu định nghĩa cung ("nó không phán 'khắc'…") — nay chỉ ở căn cứ.
² Thẻ cung nay có 3 câu mỗi chính tinh (điều thường thấy, chỗ dễ vấp, một việc nên làm) thay cho 2 câu nhãn sao.

**Sửa gì**

- **KB phi hoá viết theo cặp mảng phát → mảng đích.** `phi_vao_cung` (48 mục, nay là `{y, viec_nen_lam, can_cu}` có
  source_id + school_id): `{Chu_tu}` / `{chu_tu}` = mảng phát bằng lời thường ("Chuyện tiền bạc" / "việc của chính bạn"),
  không tên cung; việc nên làm cũng gắn mảng phát (trước câu thứ hai chỉ theo cung đích → lặp ở nửa số lá). Thuật ngữ cũ
  lọt lời ("Phái phi tinh còn xem…" ở Lộc → Huynh Đệ, "Kỵ ở đây cũng chiếu về Mệnh" ở Kỵ → Thiên Di) chuyển vào `can_cu`.
  Thêm `ky_chieu` (12 câu theo cung bị Kỵ chiếu, có `{chu_tu}`) — Kỵ nói cả mảng đích lẫn mảng bị kéo theo. `tu_hoa_cung`
  bỏ "Cung {cung} tự hoá…", thêm tiêu đề lời thường.
- **Hai mẫu "*" theo cung phát** (`khoa_vao_phu_mau`, `ky_xung_menh`): `theo_cung_phat` 11 lời mỗi mẫu (tiêu đề, nghĩa,
  việc nên làm, tự soi) — trước mọi lá ra cùng "Giấy tờ, học hành thuận" / "Kỵ chiếu về bản thân". **Giữ mã mẫu**; mã
  kiểm chứng phía web (`maPhiHoa` = loại.cung phát.hoá.cung đích) vốn đã theo cặp. 18 mẫu còn lại bỏ phần "Can X cho Hoá Y
  bay vào Z, chiếu W:" đầu câu nghĩa.
- **RULES phi hoá** (`luangiai/tuvi_phi_hoa.py`): mọi chuỗi người đọc dựng bằng biến lời thường (`bien_mang`), thẻ nổi
  bật trả thêm `can_cu` (dòng kỹ thuật "Hoá Kỵ (Thái Dương, can Giáp) từ cung Tật Ách vào Phu Thê, chiếu Quan Lộc" + ghi chú
  KB); tiêu đề luật chung "{Mảng} đỡ cho / thêm sức cho / làm rõ / kéo bận tâm sang {mảng}". Web `PhiHoa.tsx` hiện
  `can_cu` bằng "Vì sao nói vậy".
- **Luận giải đời sống chương "Đường bay"**: bỏ lớp lọc thuật ngữ, cắt chuỗi theo ": ", bộ mẫu rỗng và câu mặc định riêng
  — dùng thẳng tiêu đề / nghĩa / việc nên làm / căn cứ của thẻ phi hoá (hai nơi nói cùng một lời). Mã kiểm chứng `ds.duong_bay.*`
  không đổi.
- **Thẻ cung** (`luangiai/tuvi_the_cung.py`, dùng chung cho `/v1/tuvi/an-sao` và hỏi đáp): `giai_nghia` = `{thuong_thay,
  nen_lam, can_cu}` theo sao × CUNG × sáng/hãm (KB đời sống `sao_linh_vuc`, cùng nguồn với luận giải) thay cho
  `{tinh_chat, sac_thai}` chỉ theo sao ("Đế tinh: …", "Sáng: …"). Web `ChiTietCung.tsx` hiện "Nên làm" + "Vì sao nói vậy".
- **Hỏi đáp về lá của chính người hỏi** (`_doc_cung`, `_doc_menh`): mỗi mục kèm `doi_thuong`; thân bài hiện lời đời thường,
  đoạn kỹ thuật cũ (định nghĩa cung, "Trong lá số của bạn, X ở cung Y (Đắc — …)", "Nét chung… Mặt tối…", "Biểu hiện dễ
  thấy…", "Cách cục … Mặt tối … Gợi ý …", "Thân cư cung …", "Phụ tinh đáng kể…") chuyển vào trường mới `can_cu` của câu trả
  lời. Web `KhungChat` hiện `can_cu` thu gọn dưới câu trả lời (mọi mảng trả `can_cu` đều dùng được). Câu hỏi kiến thức chung
  (không lá số) và `la_so_mau` không đổi. Phá cách: một câu theo đúng sát tinh hội về ("Nét này dễ mờ đi mỗi khi bạn nóng
  vội hoặc kế hoạch đổ giữa chừng") thay câu chung. Lục cát / đào hoa không thêm việc nên làm chung theo cung.
- **`chu_de_han`**: thêm trường riêng `chu_de_han_ngan` (KB `tuvi_kb.json` + `tuvi_kb.chu_de_han_ngan`) — luận giải đời
  sống thôi cắt "Giai đoạn chủ đề X: …" theo dấu ":" (nơi duy nhất cắt; hỏi đáp hạn, lưu nguyệt, trang kiến thức vẫn dùng câu
  đầy đủ). Câu miễn trừ sức khoẻ của hỏi đáp bỏ tên cung, thêm "không thay lời bác sĩ".

**Test chặn** — `tests/test_tuvi_be_mat_chung_chung.py` (16 lá): 0 câu Barnum, 0 câu lộ thuật ngữ, 0 cụm chung chung /
cụm cấm ở cả ba bề mặt; trùng giữa lá ≤ 0,15; hỏi đáp có `can_cu`, câu kiến thức chung không đổi; `chu_de_han_ngan` không
tên cung. `tests/test_tuvi_phi_hoa_luan.py`: mọi cặp 12 × 12 × 4 hoá không lộ thuật ngữ; hai mẫu "*" ra 11 lời khác nhau,
giữ mã; KB phi hoá sạch cụm cấm / chung chung, đủ source_id + school_id.

**Ví dụ** (lá 15/05/1990 giờ Thìn nam, xem 21/10/2026; thẻ cung: hồ sơ mẫu e2e 17/05/1990 12:30)

| Chỗ | Trước | Sau |
|---|---|---|
| Đường bay Khoa Tài Bạch → Phụ Mẫu (mẫu "*") | **Giấy tờ, học hành thuận** — Hoá Khoa bay vào Phụ Mẫu (từ cung nào hay từ can năm xem): thi cử, hồ sơ, thủ tục, quan hệ với người đi trước dễ rõ ràng, dễ có người hướng dẫn. | **Tiền bạc đi kèm giấy tờ rõ ràng** — Chuyện tiền của bạn thường đi qua hợp đồng, hồ sơ rõ ràng nên ít bị thiệt vì giấy tờ; tiền bỏ ra cho việc học cũng đáng. Nên làm: Với khoản tiền lớn, làm hợp đồng giấy trắng mực đen; dành một khoản cố định cho việc học. |
| Đường bay Kỵ Tật Ách → Phu Thê, chiếu Quan Lộc | **Hoá Kỵ từ Tật Ách chiếu sang Quan Lộc** — Chuyện nhịp sinh hoạt, cách chịu áp lực dễ kéo theo bận tâm cho công việc, vai trò; đây là chỗ nên làm chậm, rõ ràng hơn. | **Sức khoẻ kéo bận tâm sang công việc** — Chuyện sức khoẻ đưa điều vướng vào chuyện tình cảm: hai người dễ kỳ vọng mà không nói ra. Khi chuyện sức khoẻ rối, ở chỗ làm bạn cũng khó tập trung. |
| Thẻ cung: Cự Môn (Đắc) ở Mệnh | Ám tinh: sắc sảo, giỏi ăn nói, hay nghi vấn và phân tích đến tận cùng. Sáng: lời nói có sức nặng — giỏi lý luận, phân tích, hợp nghề dùng lời (giảng dạy, luật, tư vấn, truyền thông). | Bạn nói có lý, phân tích việc gì cũng tới nơi, nên khi cần thuyết phục ai, người ta thường nghe bạn. Bạn hay hỏi tại sao và dễ bắt lỗi trong lời người khác, khiến họ thấy bị soi dù bạn chỉ muốn rõ ràng. Nên làm: Trước khi phản biện ai, nói trước một điều bạn đồng ý với họ, rồi mới nêu chỗ bạn thấy chưa ổn. |
| Hỏi đáp "Cung Quan Lộc của tôi nói gì?" (đoạn đầu) | Cung Quan Lộc: Cách bạn làm việc, kiểu môi trường và vai trò hợp với bạn… Cung này cho thấy phong cách làm việc…; nó không chỉ định một nghề duy nhất… / Trong lá số của bạn, Cự Môn ở cung Quan Lộc (Hãm — Sao ở vị trí hãm: mặt tối dễ lộ…): … Nét chung của Cự Môn: Ám tinh: … Mặt tối cần để ý: … | Chỗ làm dễ có điều tiếng hoặc hiểu lầm quanh bạn, nhất là khi bạn góp ý không chọn lúc. Bạn phát hiện lỗi trong kế hoạch rất nhanh, hợp những việc kiểm tra, rà soát, nghiên cứu. Mọi việc quan trọng sếp giao bằng miệng, gửi lại một tin nhắn tóm tắt để hai bên hiểu giống nhau. (Định nghĩa cung, sao, độ sáng → "Vì sao nói vậy".) |

### 6.8 Gộp mức mảng đời chặt hơn (2026-10-21)

Sau QC lỗi 2 (chấm mảng theo cả hai cách dụng thần), luật gộp dùng chung với đại vận ("một cách cân bằng → theo cách
còn lại") làm nhiều mảng lệch về "Thuận lợi" — đo 300 lá: Năng lượng 73%, Học & nghĩ 84%, Công việc 59%, Con người 57%.
Nhãn ai cũng nhận thì không còn nói gì riêng. Đổi: mảng đời dùng `gop_muc_mang` (chỉ giữ mức mạnh khi hai cách cùng
thấy, khác nhau → Cân bằng, thân bài vẫn nói rõ từng cách); Học & nghĩ cần 3 dấu hiệu mới "Thuận lợi". Đại vận / lưu
niên / lưu nguyệt giữ `gop_muc`. Sau đổi (300 lá): "Thuận lợi" 10–43% tuỳ mảng; test `test_phan_bo_muc_khong_lech_mot_phia`
chặn mảng nào ≥ 60% "Thuận lợi". Golden 14/15 lá đổi mức (có chủ đích).

## 8. VH-1 — "Vận hạn & điều nên tránh" + cân lại nhãn mức (2026-10-21)

Chủ dự án: đo 300 lá Bát tự sau khi gộp chặt hai cách thấy "Cần chủ động" = 0% ở Con người, Năng lượng, Lời khuyên; người
dùng quan tâm vận hạn, những điều cần tránh. Vòng tăng trưởng: **QUAY LẠI** (dòng 10 năm đổi theo năm, xem lại khi sắp
sang năm mới) + **NẠP Sao** (chương sâu, khoá SAO-2 như mọi chương sau chương 1). Đo: `reading_completed` mảng `tuvi` /
`battu`, tỉ lệ mở chương Vận hạn (`paywall_viewed` → mở khoá), tỉ lệ "Đúng với mình" của mã `ds.van_han.*` /
`ds.bt.van_han.*`.

### 8.1 Đổi nhãn "Cần chủ động" → "Cần lưu ý"

Giữ mã `can_chu_dong` (phiếu kiểm chứng, bài đã lưu, golden không đổi mã). Nhãn ở KB `muc`, hằng `MUC_MAC_DINH` (Tử vi +
Bát tự), web `NHAN_MUC`, chú thích biểu đồ đại vận, câu dòng thời gian "Giai đoạn cần lưu ý". Rõ nghĩa "để ý, cẩn trọng"
hơn mà vẫn không doạ. Tiêu đề hộp kiểu "Chuyện tiền bạc cần bạn chủ động" giữ nguyên (là câu, không phải nhãn).

### 8.2 Cân lại để có đủ ba mức (luật ghi trong docstring `battu_doi_song.py`, `tuvi_doi_song.py`)

- **Lời khuyên** không còn chép mức của Con người bạn — chương tổng hợp, không chip (`muc = null`). **Vận hạn** cũng không
  chip (mỗi năm một mức).
- **Bát tự** (ngưỡng riêng `NGUONG_MANG`): Con người bạn — thân rất lệch (tỉ lệ trợ lực < 0,30 hoặc > 0,70) −1; thần sát
  đếm lại (≥ 3 cát và ≤ 1 hung +1, ≥ 3 hung −1 — sao cát có ở 92% lá nên "≥ 2 cát" không còn phân biệt); ngưỡng 2 / 0.
  Năng lượng — phần chung theo độ lệch (một hành ≥ 45% −1, vắng hẳn một hành −1, đủ năm hành và hành lớn nhất < 35% +1),
  điều hậu "không cần bù" 0 (trước +1); ngưỡng 2 / 0. Gia đình — trụ ngày–giờ (con cái) xung / hình / hại −1; ngưỡng 2 / 0.
  Học & nghĩ — chỉ một dấu hiệu là Cần lưu ý (ngưỡng 3 / 1). Tình cảm, Bạn bè — ngưỡng 1 / −1. Công việc — Quan Sát đậm
  mà thân nhược −1.
- **Tử vi**: ngưỡng Thuận lợi của cung 3 → 4 (ngưỡng 3 cho 55% cung, 67% chương Công việc "Thuận lợi"); đường bay theo
  thang riêng (số đường Lộc − số đường Kỵ nổi bật: ≥ 1 thuận, ≤ −3 cần lưu ý — thẻ nổi bật vốn ưu tiên đường Kỵ nên thang
  cung cho 60% "Cần lưu ý").
- Golden đổi có chủ đích: Bát tự `fixtures/golden/battu_doi_song.json` **14/15 lá** đổi ít nhất một mức (+ khoá mức 10 năm
  `van_han_nam`); Tử vi 60 lá `lasotuvi_60` **45/60 lá** đổi ít nhất một mức chương (đường bay 19, công việc 9, gia đình 8,
  nhà cửa / bạn bè / tiền / tình cảm / con người 7, sức khoẻ 5, các giai đoạn / năm nay 4) — test 60 lá không khoá mức
  từng lá, chỉ khoá luật + phân bố.

Phân bố nhãn (Thuận lợi · Cân bằng · Cần lưu ý), ngày xem 21/10/2026. Bát tự 300 lá ngẫu nhiên (seed 2026, sinh
1940–2015); Tử vi 60 lá golden. Test `tests/test_van_han_doi_song.py::test_phan_bo_nhan_*` chặn: không nhãn nào ≥ 60%, mọi
chương có mức đều ≥ 5% "Cần lưu ý"; dòng 10 năm mỗi nhãn 10–60%.

| Bát tự (300 lá) | Trước | Sau |
|---|---|---|
| Con người bạn | 37 · 63 · **0** | 25 · 54 · 21 |
| Năng lượng | 15 · **84** · **0** | 29 · 53 · 18 |
| Các giai đoạn | 46 · 26 · 28 | 46 · 26 · 28 |
| Công việc | 51 · 41 · 9 | 51 · 41 · 9 |
| Tiền bạc | 26 · 53 · 22 | 26 · 53 · 22 |
| Tình cảm | 10 · **65** · 25 | 41 · 34 · 25 |
| Gia đình | 18 · **75** · 7 | 12 · 49 · 39 |
| Học & nghĩ | 32 · **66** · **1** | 32 · 50 · 18 |
| Sức khoẻ | 40 · 47 · 13 | 40 · 47 · 13 |
| Bạn bè, bên ngoài | 6 · 60 · 35 | 36 · 29 · 35 |
| Năm nay | 46 · 27 · 27 | 46 · 27 · 27 |
| Lời khuyên | 37 · 63 · **0** (chép Con người) | không mang mức |
| Vận hạn — mỗi năm (3.000 năm) | — | 43 · 23 · 34 |

| Tử vi (60 lá) | Trước | Sau |
|---|---|---|
| Con người bạn | 58 · 23 · 18 | 47 · 35 · 18 |
| Các giai đoạn | 57 · 20 · 23 | 50 · 27 · 23 |
| Công việc | **67** · 20 · 13 | 52 · 35 · 13 |
| Tiền bạc | 50 · 40 · 10 | 38 · 52 · 10 |
| Tình cảm | **60** · 23 · 17 | 48 · 35 · 17 |
| Gia đình | 45 · 37 · 18 | 32 · 50 · 18 |
| Sức khoẻ | 48 · 25 · 27 | 40 · 33 · 27 |
| Bạn bè, bên ngoài | 55 · 33 · 12 | 43 · 45 · 12 |
| Nhà cửa | 52 · 22 · 27 | 40 · 33 · 27 |
| Đường bay | 8 · 32 · **60** | 20 · 40 · 40 |
| Năm nay | 57 · 20 · 23 | 50 · 27 · 23 |
| Lời khuyên | 58 · 23 · 18 (chép Con người) | không mang mức |
| Vận hạn — mỗi năm (600 năm) | — | 22 · 44 · 35 |

Bát tự Công việc giữ 9% "Cần lưu ý" (≥ 5%): điểm 0 phần lớn là "sống bằng tay nghề" (không Quan, Thực Thương rõ) — không
phải điều cần lưu ý nên không hạ ngưỡng.

### 8.3 Chương mới `van_han` — "Vận hạn & điều nên tránh" (ngay sau "Năm nay & tháng tới", trước "Lời khuyên")

Mười năm tới tính từ năm đang xem. Chương không chip mức; mỗi năm một mức + cờ. Trả `chuong[van_han].dong_nam` =
`[{nam, tuoi, muc, nhan_muc, hien_tai, co: [{ma, nhan, y?, tranh?, lam?}], mang, y, nen_tranh, nen_lam, can_cu,
muc_cach_1?, muc_cach_2?, hai_cach_khac?}]` (Bát tự thêm `thang_toi` 12 tháng theo tiết). Dữ liệu nằm TRONG chương → khoá
SAO-2 là mất cả dòng (`catXemTruoc` không cần sửa); hộp cốt lõi của chương bị lọc theo `tu_chuong` như mọi hộp.

**Tử vi** (`dong_muoi_nam`, chỉ đọc `calc.tuvi_phi_hoa.phi_tu_can` — bảng tứ hoá theo can năm, đối chiếu `van_han` iztro
trong test; cung lưu niên = cung mang chi của năm; đại hạn = cung chứa tuổi mụ; năm âm lịch Việt, Tết). Điểm năm: Kỵ năm
nhập cung chính (Mệnh, Tài Bạch, Quan Lộc, Phu Thê, Điền Trạch) −2, trùng cung Kỵ gốc −1 nữa · Kỵ năm ở cung đối diện,
chiếu cung chính −1 · Lộc năm nhập cung chính +2 · song Lộc (gặp Lộc gốc / Lộc Tồn) +1 · Kỵ / Lộc năm rơi đúng cung đang
đi (lưu niên hoặc đại hạn) −1 / +1 · đại hạn Thuận lợi +1 / Cần lưu ý −1. **≥ 2 Thuận lợi · điểm âm mà Kỵ năm chạm cung
chính → Cần lưu ý** (luôn gọi được tên mảng chịu tác động) · còn lại Cân bằng. "Ưu tiên: đại hạn > lưu niên > tiểu hạn" +
tiểu hạn năm nay ghi trong "Vì sao nói vậy".

**Bát tự** (`dong_muoi_nam`, chỉ đọc `battu_mo_rong.luu_nien`): năm từ Lập xuân, chấm như đại vận — từng cách (can 1 + chi
2 theo hành cần thêm / nên bớt) rồi `gop_muc`, khác nhau → câu "Hai cách đọc khác nhau ở năm N…" + cờ trên dòng. Mảng chịu
tác động theo thập thần của can năm (10 lời riêng). Thêm cờ năm xung / hình chi ngày (chỗ ở, người gần). 12 tháng tới theo
tiết chấm cùng luật → hộp "Mười hai tháng tới": tháng nên đi chậm (kèm mảng) + tháng thuận để bắt đầu việc mới.

**Cờ tập quán dân gian** (`doi_song_chung.co_dan_gian`, chỉ đọc `calc.tuoi_dan_gian`): năm tuổi (cùng chi năm sinh), năm
xung tuổi (lục xung), năm va tuổi (hình / hại), tam tai — theo chi năm sinh (Tử vi: năm âm lịch; Bát tự: chi trụ năm).
Cờ **không đổi mức**; lời nhắc tục lệ cố định (ai có cờ cũng đọc giống nhau) nên KHÔNG thành hộp, chỉ hiện trên dòng 10 năm
khi bấm năm ("Theo tập quán dân gian — …") và một câu gắn năm trong thân bài ("Theo tập quán dân gian, 2026 là năm tuổi…;
xem như lời nhắc giữ nếp, không phải điềm báo").

**Hộp** (≤ 6, `doi_song_chung.chon_hop_van_han`): năm Cần lưu ý gần nhất trước (≤ 3 mẫu; năm sau trùng mẫu gộp vào tiêu
đề "Năm 2027 và 2031: …", không lặp câu) — `luu_y` có **"Nên tránh: …"** + **"Nên làm: …"**; năm thuận gần nhất (1,
`diem_manh`, "Nên làm"); Bát tự thêm hộp 12 tháng. Ít điểm nhấn → "năm nên giữ nhịp hơn cả" + "năm đáng dồn sức nhất".
Lời theo mảng × tuổi: 18–34 (`tre`), từ 35 (`lon`), dưới 18 (`nho` — lời cho cha mẹ theo mảng của con: sức, tiền tiêu vặt,
học, bạn, chỗ ở; không vay, bảo lãnh, cưới xin). KB mới `van_han` trong `tuvi_doi_song_kb.json` (Kỵ nhập 5 cung × 2 tuổi,
Kỵ chiếu 5, Lộc nhập 5, trẻ 10, cờ 4) và `battu_doi_song_kb.json` (10 thập thần × cần lưu ý 2 tuổi + thuận, trẻ 10, cờ 6) —
nháp AI, `source_id` + `school_id`. Không vật phẩm, không giải hạn, không tên bệnh, không đoán năm ốm.

**Mã kiểm chứng** (đi qua ràng buộc 0017 `^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$`, không migration mới): Tử vi
`ds.van_han.{ky_nhap|ky_chieu}.<cung>.<tre|lon|nho>`, `ds.van_han.{loc_nhap|song_loc}.<cung>[.nho]`,
`ds.van_han.{giu_nhip|don_suc}.<cung>`; Bát tự `ds.bt.van_han.<thập thần>.can.<tre|lon>`,
`ds.bt.van_han.<nhóm>.can.nho`, `ds.bt.van_han.<thập thần>.thuan`, `ds.bt.van_han.thang.{cham|thuan}`,
`ds.bt.van_han.{giu_nhip|don_suc}.<thập thần>`.

**Điều quan trọng nhất**: nếu trong 3 năm tới (kể cả năm nay) có năm Cần lưu ý → thêm đúng hộp của năm gần nhất (cùng mã,
`tu_chuong = van_han`); vẫn ≤ 5 hộp, ≤ 3 hộp mỗi loại, luôn có một điểm mạnh và một lưu ý.

**Lời mời khi khoá (SAO-2)**: câu đầu chương là năm THUẬN gần nhất / năm đáng dồn sức ("Trong mười năm tới, năm thuận gần
nhất là 2028: hợp nhận việc khó.") — điểm nhấn không đếm số năm phải tránh; câu hỏi mở `CAU_HOI_MO[(…, "van_han")]`.

**Web**: `components/luan-giai/DongMuoiNam.tsx` — 10 chấm (lục / vàng / hổ phách, không đỏ; CSS `.cham-vh`), năm nay vòng
vàng + "Năm nay", cờ nhỏ (tuổi · xung · va · tam tai · nhà), bấm năm → khung "Nên tránh / Nên làm" + lời tục lệ + "Vì sao
nói vậy"; chấm hiện lần lượt bằng `motion` (tôn trọng giảm chuyển động); điện thoại 360px cuộn ngang trong khung riêng.
Bát tự thêm dải 12 tháng. E2E `e2e/van-han.spec.ts`.

**Test**: `tests/test_van_han_doi_song.py` — luật năm trên lá dựng tay, đối chiếu iztro, Bát tự = `muc_hai_cach` của lưu
niên, cờ không đổi mức, trẻ dưới 18, lời văn (thuật ngữ, doạ, cụm cấm / chung chung, bệnh), không câu Barnum (Bát tự 80
lá; Tử vi qua `test_tuvi_doi_song_chung_chung`), không lặp câu trong chương, KB đủ ô và sạch, cốt lõi, lời mời không doạ,
phân bố nhãn. Không đổi lá số / tứ trụ → không tăng `ENGINE_VERSION`.

### 8.x Tháng Bát tự gộp chặt (2026-10-21)

Dải 12 tháng (và 3 tháng ở "Năm nay") dùng `muc_thang`: ngưỡng ±1 như đại vận nhưng gộp chặt hai cách (chỉ Thuận lợi /
Cần lưu ý khi cả hai cách cùng thấy). Trước: 46 · 21 · 34% (Thuận · Cân bằng · Cần lưu ý), nhiều lá 7–8 tháng cam /
năm; sau: 26 · 58 · 16%, trung bình ~2 tháng "Cần lưu ý" / năm (100 lá × 12 tháng). Lưu nguyệt là lớp ưu tiên thấp
nhất nên chỉ tô màu khi tín hiệu đồng thuận. Test `test_thang_chi_to_mau_khi_tin_hieu_ro`.

## 9. BT-DC — "Cách nào đúng với bạn?" (2026-10-22)

Chủ dự án hỏi có nên cho người dùng bình chọn cách lấy dụng thần. Bình chọn mơ hồ ("cách nào nghe đúng hơn") dễ chọn
theo cảm tính; người dùng biết chắc nhất là **đời mình đã qua**. Nên làm **đối chiếu quá khứ**:

- RULES `luangiai/battu_doi_chieu.py` + `POST /v1/battu/doi-chieu-cach` (web `/api/battu/doi-chieu-cach`, không lưu,
  không trừ Sao): chọn tối đa 5 năm Bát tự đã qua (tuổi ≥ 16, 15 năm gần nhất) + tối đa 1 giai đoạn mười năm đã qua mà
  hai cách đọc KHÁC nhau (ngược hẳn thuận ↔ cần lưu ý đứng trước), mức từng cách chấm như báo cáo (`muc_hai_cach`).
  Dưới 3 câu → không hỏi, kèm lời lý do (`it_nam_qua` / `hai_cach_trung`). Mẫu 300 lá: 88% có câu hỏi.
- Web `components/huyen-hoc/DoiChieuCach.tsx` (trên `/bat-tu`, giữa tứ trụ và luận giải): mỗi câu "Nhìn lại năm 2019
  (khi bạn 29 tuổi), nhìn chung đó là một năm…" → Khá suôn sẻ / Bình thường / Khá vất vả / Không nhớ rõ; trả lời xong
  lật ra mỗi cách đã nói gì (✓ chỗ khớp). Đủ 3 câu: so mã (`lib/cach-chinh-battu.ts` `ketQua`, luật `luat` engine trả:
  chênh ≥ 2 → kết luận một cách, chênh 1 → "nghiêng", bằng → "chưa rõ"), lời kết luận do engine soạn (KB
  `battu_doi_song_kb.json` → `doi_chieu`, nháp AI).
- Người dùng có thể **chọn cách chính** → báo cáo hiện thêm "Theo cách bạn chọn: <mức>" cạnh mức chung ở chương và
  giai đoạn hai cách khác nhau. Mức chung, mã kiểm chứng, phép tính không đổi; hệ thống vẫn không tự chọn (`chon` None).
- Riêng tư: câu trả lời + cách chính chỉ ở localStorage (`hbt.battu.doi_chieu.v1`, theo từng lá số trên máy, tối đa 8);
  PostHog `chart_interacted` `kind=battu_doi_chieu` chỉ nhận `cach_cuc`, `than`, `khop_1`, `khop_2`, `so_cau`,
  `ket_qua` — không năm, không ngày sinh. Số này là dữ liệu thật cho người duyệt bảng hỷ/kỵ (`docs/DUYET-HY-KY-BAT-TU.md`).
- Khâu tăng trưởng: QUAY LẠI (trò tương tác trên chính đời mình, giữ người đọc tới phần luận giải) + nền móng chất lượng
  (đo cách nào khớp theo cách cục). Đo: tỉ lệ người mở `/bat-tu` trả lời đủ 3 câu, tỉ lệ chọn cách chính.
- Việc sau (chờ số): cho "cách chính" đổi luôn mức chung của báo cáo (hiện chỉ nhấn) — cần đo phân bố nhãn theo từng
  cách (gộp chặt đang giữ 10–60% mỗi nhãn).

## 10. Kiểm chứng "Xem lá số 2 người" + rà toàn bộ vòng HỌC (2026-10-22)

### 10.1 Loại phiếu `hai_nguoi` (migration 0021, chủ dự án duyệt)

- **Mã** do engine dựng (`luangiai/tuvi_hai_nguoi.py`): `hn.<tiêu chí>.<loại>.<quan hệ>` — tiêu chí `menh · can · chi ·
  cung_phi · tu_vi`, loại = kiểu quan hệ giữa hai năm sinh (tương sinh, tam hợp, Diên Niên…), quan hệ = lựa chọn của
  người dùng. Không tên, ngày sinh, năm, can chi của ai (test `test_ma_mau_khong_lo_nhan_than`). Phái = phiên bản luật
  chấm (`hai_nguoi_1`).
- **SQL** `kiem_chung_ma_hop_le` nhánh `hai_nguoi`: danh mục chặt `c_hn_*` = đúng những loại có thể thành HỘP (kết luận
  "Hợp" hoặc "Cần dung hoà"; loại chỉ ra "Bình hoà" như `binh_hoa`, `trung`, `binh`, `phuc_vi` bị từ chối). Danh mục so
  HAI CHIỀU với hằng số engine (`TY_*`, `_ket_luan`) trong `tests/test_kiem_chung_ma.py`.
- **Web**: hộp điểm mạnh / cần dung hoà dùng `HopNoiBat` với `KiemChungBai` `{loai: "hai_nguoi", phai: diem.phien_ban}`;
  "x% trong N người thấy đúng" khi ≥ 30 phiếu (một lời gọi `/api/kiem-chung/ty-le`). PostHog `tuvi_kiem_chung` chỉ mang
  mã. Chưa chạy 0021 → hàm cũ trả false → route trả `{da_luu:false, ly_do:"tu_choi"}`, Sentry báo một lần mỗi loại mỗi
  phiên bản máy chủ; người dùng vẫn thấy "Cảm ơn".
- **Tự học** (cùng luật mục 3, `doi_song_chung._ap_hoc`): `/api/tuvi/hop-tham` gửi engine `trong_so` (mã `hn.*` ≥ 30
  phiếu) + `ca_nhan` (phiếu `hai_nguoi` của chính người đăng nhập). Hộp ≥ 100 phiếu & < 40% đúng bị bỏ khỏi hộp, dòng
  "Đang xem lại: …" vào căn cứ của tiêu chí ("Vì sao nói vậy"), tiêu chí cùng kết luận kế tiếp (nếu có) thay chỗ; hộp
  người xem bấm "chưa đúng" xếp cuối. **Điểm, mức, lời không đổi** (test). Engine cũ chưa nhận trường mới → 422 → route
  gọi lại không kèm.

### 10.2 Rà end-to-end từng loại phiếu

| Loại | Nút (web) | API → RPC → bảng | x% công khai | Engine học (`trong_so`/`ca_nhan`) | Quản trị |
|---|---|---|---|---|---|
| `phi_hoa` (Đường bay) | `PhiHoa.tsx`, mã web `maPhiHoa`, phái `phi_tinh` | `/api/kiem-chung` → `ghi_kiem_chung` → `kiem_chung_phieu` | **mới có** (trước: không tải tỉ lệ) | không (thẻ, chưa có luật hạ) | tang-truong (PostHog) + hoc (DB) |
| `nhip_3_thang` | `NhipBaThang.tsx`, `maNhip`, phái lưu nguyệt | như trên | **mới có** | không | như trên |
| `doi_song` Tử vi `ds.*` | `BaoCaoDoiSong` → `HopNoiBat` | như trên | có | có (`toan_bo.tuvi`) | như trên |
| `doi_song` Bát tự `ds.bt.*` (+ `ds.bt.van_han.*`) | như trên, phái `tu_binh` | như trên | có | có | như trên |
| `doi_song` Thần số `ds.thanso.*` | như trên, phái `pitago` | như trên | có | **mới có** (`ban_do_con_so.bao_cao`, route `/api/thanso/ban-do-con-so`) | như trên |
| `doi_song` Phong thuỷ / Kinh Dịch | `NhaCuaBan`, `DocQue` | — | — | — | **chưa có mã** (`ma_mau`) — chưa có phiếu |
| `hai_nguoi` `hn.*` | `HopThamTuVi` | như trên (0021) | có | có | như trên |
| Thần số hỏi đáp | `GopYCauTraLoi` | `/api/thanso/phan-hoi` → engine `chu-ky-so` → `gui_phan_hoi_thanso` → `thanso_phan_hoi` + cụm | — | — (cụm → người duyệt) | hoc (cụm bất thường) |

**Lỗi tìm được và đã sửa** (đều có test):
1. Phiếu bị DB từ chối mất âm thầm: `/api/kiem-chung` nay trả `ly_do: "tu_choi"` + báo Sentry (một lần / loại);
   `/api/thanso/phan-hoi` báo Sentry khi DB từ chối.
2. Chữ ký số thần số có chỉ số 0 (tên thiếu nguyên âm / phụ âm, vd "Y") → `thanso_chu_ky_hop_le` (Pitago 1–33) từ chối
   CẢ góp ý: engine `/v1/thanso/chu-ky-so` bỏ khoá 0 / rỗng (`test_chu_ky_so_luon_qua_rang_buoc_sql`).
3. Cron dọn dữ liệu: 0016 lỗi thì trả 502 trước khi dọn phiếu 0017; `don_nhac_viec` (0018) chưa từng được gọi → ba hàm
   chạy độc lập.
4. `phieuCuaToi` lấy 500 phiếu mới nhất MỌI loại → người bấm nhiều thẻ có thể mất `ca_nhan` của mảng đang xem; nay lọc
   theo loại, `trong_so` lọc theo tiền tố mảng (lời gọi engine nhỏ hơn).
5. `/quan-tri/tang-truong` ghi mọi phiếu không phải phi hoá là "3 tháng tới" (kể cả đời sống) → nhãn theo loại;
   `/quan-tri/hoc` thêm tên khối; `nhanMau` đọc được mã `hn.*` và `ds.thanso.*`.
6. Thần số "Bản đồ con số" có nút + x% nhưng engine không nhận `trong_so`/`ca_nhan` → thêm như Tử vi / Bát tự.

**Kiểm thử mới**: `engine/tests/test_kiem_chung_ma.py` liệt kê mã thật (60 lá Tử vi, golden Bát tự, 40 hồ sơ thần số,
1.500 cặp hai người, phi hoá 30 lá, nhịp 5 phái) và kiểm từng mã với hàm SQL dựng lại từ CHÍNH tệp migration mới nhất;
có `KIEM_CHUNG_PGDB` thì chạy luôn hàm SQL thật (job CI `sao-that`). `supabase/kiem_thu/thu_kiem_chung_0021.sql`
(ASSERT). `web/e2e-that/kiem-chung-that.spec.ts`: ghi phiếu → tỉ lệ ≥ 30 → đổi ý không cộng dồn → mã ngoài danh mục bị
từ chối có lý do → nút trên /tu-vi ghi `hai_nguoi` → hộp < 40% bị hạ → phiếu "chưa đúng" của người đăng nhập xếp cuối.

**Còn mở (cần quyết)**: Phong thuỷ "Nhà của bạn" và Kinh Dịch chưa có `ma_mau` (một quẻ gieo ngẫu nhiên thì "đúng với
mình" đo gì? — cần chủ dự án chốt trước khi gắn); `DocQue`/`NhaCuaBan` dùng `HopNoiBat` ngoài `KiemChungBai` nên khi gắn
mã phải bọc provider (mặc định phái `nam_phai_viet`). Phi hoá / nhịp chưa có luật hạ thẻ theo tỉ lệ. Tỉ lệ `ty_le_kiem_chung`
gộp mọi phái theo mã (mã nhịp như `binh.-` chung cho 5 phái lưu nguyệt). `don_nhac_viec` (0018) chỉ `revoke from public`
— trên Supabase vai trò anon/authenticated vẫn có quyền mặc định gọi (chỉ xoá mốc > 400 ngày, rủi ro thấp; nên thu hồi
ở migration sau).
