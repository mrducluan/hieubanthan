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
- **Hợp sức**: +1 khi hành của nhóm là hành cần thêm (cách 1) và nhóm có mặt rõ; −1 khi là hành nên bớt và nhóm đậm.
- **Hai cách (dụng thần — KHÔNG tự chọn, `chon = None`)**: cách 1 "cân sức" = phù ức + điều hậu (hành nên bớt = phần còn
  lại khi thân vượng / nhược); cách 2 "theo tháng sinh" = hỷ / kỵ theo nhóm của cách cục (KB `cach.<ma>.hy/ky`, có bản riêng
  khi thân nhược / vượng — vd Tài cách thân nhược: hỷ Ấn, kỵ Tỷ Kiếp).

| Mảng | Luật (điểm ≥ 2 Thuận lợi · ≤ −1 Cần chủ động · còn lại Cân bằng) |
|---|---|
| Công việc | Quan Sát rõ +1 (+ hợp sức; Ấn hoặc Tài đỡ +1; Thực Thương đậm gặp Quan −1); không Quan mà Thực Thương rõ: 0 (sống bằng tay nghề); không cả hai −1 |
| Tiền bạc | Tài rõ +1 (+ hợp sức; Thực Thương rõ sinh Tài +1); không Tài −1 (0 nếu Thực Thương rõ); Tỷ Kiếp đậm −1. Thân nhược mà Tài đậm → hộp "tiền đến nhiều nhưng dễ mệt vì gánh" |
| Tình cảm | sao phối ngẫu (nam Tài, nữ Quan Sát) rõ +1 + hợp sức, vắng −1; nữ lộ cả Chính Quan lẫn Thất Sát −1; nam Tỷ Kiếp đậm −1; chi ngày (cung phối ngẫu) bị xung / hình / hại −1, hợp +1; bản khí chi ngày → "kiểu gắn bó" |
| Gia đình | Ấn rõ +1 + hợp sức; Tài đậm phá Ấn −1; trụ năm–tháng xung / hình / hại −1, hợp +1; anh em (Tỷ Kiếp), con cái (nam Quan Sát, nữ Thực Thương; trụ ngày–giờ) chỉ thêm hộp |
| Học & nghĩ | Ấn rõ +1, Thực Thương rõ +1; Ấn đậm lấn Thực Thương −1; cả hai mỏng −1; Văn Xương / Thái Cực / Hoa Cái +1 |
| Bạn bè, bên ngoài | thân yếu có bạn ngang hàng đỡ +1; thân mạnh mà Tỷ Kiếp đậm −1; Quan Sát đậm đè thân yếu −1; Thiên Ất Quý Nhân +1; Vong Thần −1; Kiếp Sát −1 |
| Con người bạn | thân trung hoà +1; hành cần thêm (cách 1) có mặt rõ +1, vắng hẳn −1; ≥ 2 sao cát +1; ≥ 2 sao hung −1 |
| Năng lượng | phù ức / điều hậu không cần hoặc hành cần bù đã có mặt rõ: +1 mỗi phần; vắng hẳn −1 |
| Sức khoẻ | theo độ lệch: thiếu ≥ 2 hành hoặc một hành ≥ 45% → Cần chủ động; không thiếu và hành lớn nhất < 35% → Thuận lợi |

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
| `loi_khuyen` | Lời khuyên dành cho bạn | 3 điểm mạnh, 3 điều nên để ý, 3 việc nên làm (gom từ các chương) | |

### 6.4 Hợp đồng JSON (`POST /v1/battu/luan-giai`, cùng `doi_song_1` mục 2.3, nhận `trong_so` / `ca_nhan`)

Thêm so với Tử vi: `chuong[tong_quan].than_do = {ti_le, vuong_tu, nhuoc_duoi, muc: manh|yeu|can_bang, nhan}`,
`chuong[ngu_hanh].bieu_do = {hanh: [{hanh, diem, ty_le, nhom, trang_thai: thieu|thua|vua, cach_1, cach_2}], nhat_chu}`,
`chuong[ngu_hanh].hai_cach = {cach_1: {ten, hanh}, cach_2: {ten, hanh, ma}, chon: null}`,
`thoi_gian_bieu[] += {nhan: "vận Ất Dậu", muc_cach_1, muc_cach_2, hai_cach_khac}` (`cung` = can chi của vận),
`chuong[nam_nay].nam_xem`. Thuật ngữ (thập thần, nhật chủ, dụng thần, can chi…) chỉ ở `can_cu`.

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
