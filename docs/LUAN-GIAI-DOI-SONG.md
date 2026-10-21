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

Mức: điểm ≥ 3 → `thuan` ("Thuận lợi"), ≤ −2 → `can_chu_dong` ("Cần chủ động"), còn lại `can_bang` ("Cân bằng"). Không
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
  "muc": { "thuan": "Thuận lợi", "can_bang": "Cân bằng", "can_chu_dong": "Cần chủ động" },
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

## 6. Rà chung chung 2026-10-21

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
