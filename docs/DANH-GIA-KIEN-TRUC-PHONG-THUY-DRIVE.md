# Đánh giá kiến trúc "All-in-one PostgreSQL Neuro-Symbolic Feng Shui" (bộ tài liệu Drive) so với kiến trúc 5 tầng

**Ngày:** 2026-10-22 · **Người viết:** Claude (theo yêu cầu chủ dự án: "xem lại kiến trúc này là gì, đánh giá tổng quan,
nếu là bản nâng cấp có giá trị thì cập nhật kiến trúc 5 tầng; cho anh phân tích để quyết định").
**Nguồn đọc:** thư mục Drive Phong thuỷ (13 tệp `.sql` + 1 `.py`): *Khởi tạo Extensions & Cấu trúc Lõi*, *Khởi tạo Đồ Thị
Tri Thức (Apache AGE) & Động cơ PL/pgSQL*, *Thiết kế Kho Câu Hỏi & Vòng lặp Tự Cải Thiện*, `liqi_24_mountains`,
`liqi_nine_stars`, `liqi_81_combinations`, `xingshi_spatial_features`, `rlhf_patch_rules`, `knowledge_golden_samples`,
`knowledge_question_intents`, `fn_*`, *HÀM XỬ LÝ KHÔNG GIAN (GEOMETRY ENGINE)*, *MÃ SQL & PROMPT…*, *PYTHON COMPUTER VISION PIPELINE*.

> Kết luận ngắn: **bản Drive không phải một kiến trúc thay thế, mà là một bản thiết kế "tất cả trong Postgres"** (tính toán,
> đồ thị, vectơ, hình học, vòng RLHF đều chạy trong DB). Có **5 ý tưởng đáng lấy** (mục 3) và **6 điểm trái nguyên tắc**
> đã chốt (mục 4). Em đề xuất **giữ kiến trúc 5 tầng, bổ sung 4 điều** (mục 5) thay vì đổi nền. Bảng quyết định ở mục 6.

## 1. Bản Drive gồm những gì

| Khối | Nội dung chính | Ghi chú kỹ thuật |
|---|---|---|
| Extensions | `vector` (pgvector), `pg_trgm`, `age` (Apache AGE), `postgis` | Supabase có pgvector, pg_trgm, PostGIS; **không có Apache AGE** |
| Lý khí (bảng) | `liqi_24_mountains` (độ, tam nguyên long, âm dương, thế tinh), `liqi_nine_stars` (JSONB: trạng thái theo vận, thuộc tính, bộ phận cơ thể, nhân vật gia đình, *cross-map* Pitago/Chaldea/Kabbalah, remedy khoa học & truyền thống), `liqi_81_combinations` (**chỉ 7 dòng mẫu**, điểm −100…+100, `domain_impacts`, `trigger_years` cứng), `liqi_solar_terms_calendar` (Lập xuân 2024–2028 cố định, sao năm, Thái Tuế, Tam Sát, sao tháng) | Sao tháng **lệch một nhóm** so với quy tắc Thẩm thị (đã ghi ở `NANG-CAP-PHONG-THUY-KINH-DICH.md`); Lập xuân cố định → engine đã tính VSOP87 |
| Hình thế | `xingshi_spatial_features` (6 dấu hiệu: xuyên đường sát, xà ngang, thương sát, bếp đối WC/cửa, WC trung cung/khuyết góc, minh đường tụ thuỷ) có *vision signature*, `severity` −100…100, cờ `is_veto_sha`, giải thích "khoa học" (Venturi, cortisol, prospect-refuge…) và truyền thống, remedy 3 mức ngân sách | Nội dung dấu hiệu **trùng 18 dấu hiệu `bo_tri` của PT-V0** đã có; phần "khoa học" phần lớn là suy diễn không nguồn |
| Hình học | `apartment_floorplan_geometries` (đa giác mặt bằng PostGIS), `fn_generate_lu_shu_9_grid` (tâm nhà, 9 ô, tỉ lệ diện tích), `fn_detect_spatial_sha_violations` (WC trung cung, xuyên đường, khuyết góc < 40 %), `fn_calculate_satellite_facing_degree` (ST_Azimuth hai điểm bản đồ), pipeline CV Python | Ý đúng, cài đặt lỗi cú pháp (`FOR i.row_idx IN`), phụ thuộc PostGIS |
| Đồ thị AGE | Nhãn `SpatialEntity / FlyingStar / PalaceSector / NumerologyCore / RemedySolution`; cạnh `GENERATES / CONTROLS / TRIGGERS_TIMING / RESONATES_WITH / NEUTRALIZES`; mỗi ý định câu hỏi kèm một câu Cypher | Đồ thị nhỏ (9 sao × ngũ hành) — JSON đã đủ (`thanso_do_thi.json` là tiền lệ) |
| Động cơ PL/pgSQL | `fn_get_mountain_by_degree` (kiêm hướng > 4,5°), `fn_generate_flying_star_chart`, **`fn_evaluate_conflict_synthesis`** với 4 công tắc: `conflict_mode` = **MODE_1A_70_30** (70 % hình thế + 30 % lý khí, dấu hiệu *veto* kéo điểm ≤ −40) hoặc **MODE_1B_SPACE_TIME** (hình thế quyết định nền, lý khí/lưu niên quyết định *ứng kỳ*); `facing_mode` (cửa / ban công), `grid_mode` (9 ô / 8 hướng), `persona_mode` (khoa học / truyền thống) | **Hai bộ tính** nếu chạy song song engine Python; ngưỡng kiêm hướng khác mình (3°) |
| Vòng tự cải thiện | `knowledge_question_intents` (vectơ 1536 OpenAI/Gemini + tsvector), `knowledge_golden_samples` (4 lớp lời LLM làm "mẫu chuẩn"), `rlhf_patch_rules` (7 luật, `patch_instruction` **ghi thẳng vào engine/prompt**, confidence), `user_consultation_sessions` (**user_id, birth_date, full_name**, compass, vision JSON, toggles, rating 1–5, kết quả sau 30 ngày), `feedback_quarantine_log` (chẩn đoán của "Critic Agent", `proposed_sql_or_rule_patch`, trạng thái `AUTO_PATCHED`), trigger tự động: rating ≤ 2 → cách ly; 5/5 + 30 ngày 5/5 → **tự thăng** lên golden | Trái riêng tư + trái ranh giới tầng HỌC (máy tự sửa luật / tự tạo mẫu chuẩn từ lời LLM) |

## 2. Đối chiếu từng thành phần với 5 tầng hiện có

| Thành phần Drive | Hiện có ở hieuban.com | Đánh giá | Đề xuất |
|---|---|---|---|
| 24 sơn + thế tinh, phi tinh, cục | `calc/huyen_khong.py` (hạ quái + thế quái, kiêm hướng > 3°, cục, tổ hợp) | Đã có đầy đủ, có test | Giữ |
| 9 sao đa chiều + cross-map thần số | `sao_doi_thuong` (9 sao), `thanso_do_thi.json` (liên phái thần số) | Cross-map "Đường đời 1 ↔ Nhất Bạch" là **ghép tuỳ ý**, không có trong cổ thư → không dùng để luận | Không làm cầu nối sao ↔ số; chỉ giữ gợi mở chéo bằng *ý định* (KC-3) |
| 81 tổ hợp có điểm số, lĩnh vực, năm kích hoạt | Trước: 45 cặp; **nay PT-81: 81 tổ hợp có thứ tự** (sơn = người, hướng = tiền), lĩnh vực, năm theo lưu niên tính từ cung | Điểm số/"cực hung"/tên bệnh bỏ; năm kích hoạt Drive cứng tay, mình **tính** | Đã làm trong PR này |
| Lịch tiết khí cố định | `calc/tietkhi` (VSOP87), `luu_nien`, `luu_nguyet` | Một bộ tính | Giữ |
| Dấu hiệu hình thế + vision signature + veto | PT-V0 18 dấu hiệu (`bo_tri`), dấu hiệu từ ảnh chưa xác nhận → không luận | **Ý "veto" đúng**: dấu hiệu lớn đã xác nhận phải giới hạn mức, không để phi tinh "kéo lên" | Chính thức hoá luật *trần mức* (mục 5.1) |
| 70/30 (Mode 1A) | Không có điểm số | Trộn hai thang điểm vô nghĩa về mặt học thuật, và ra con số doạ | **Không** |
| Tách không gian / thời gian (Mode 1B) | Báo cáo đã xếp: hình thế trước, lưu niên/lưu nguyệt là "nhịp" | **Đúng với cách làm của mình** | Ghi thành nguyên tắc RULES (mục 5.1) |
| 9 ô Cửu cung từ đa giác, khuyết góc, tâm nhà | Chưa (PT-V0 chỉ chọn vị trí theo 9 phương) | Có giá trị khi PT-V2 có sơ đồ; **không cần PostGIS** — đa giác đơn giản tính bằng Python thuần | Làm ở PT-V2 (mục 5.2) |
| Hướng từ hai điểm bản đồ (ST_Azimuth) | Chưa; đang có la bàn điện thoại + nhập tay | Rất hữu ích cho căn hộ (không ra được cửa chính) — công thức *bearing* thuần | Làm nhỏ (mục 5.2) |
| 4 công tắc UI | Khung "Trường phái" (lịch, mốc năm, giờ Tý…) | `facing_mode` đã có (đo ở cửa / ban công); `grid_mode` = PT-V2; `persona_mode` = chỉ đổi lời giải thích | Thêm **một** công tắc "góc nhìn: theo sách xưa / theo đời sống hiện đại" cho lời giải thích dấu hiệu (tuỳ anh, mục 6) |
| Remedy khoa học (Kelvin, âm thanh, vi khí hậu) & vật phẩm | KB chỉ nói nếp dùng phòng, không vật phẩm | Phần ánh sáng / thông gió / tiếng ồn **dùng được** như gợi ý sinh hoạt; vật phẩm (thạch anh, hồ lô, tỳ hưu) **cấm** | Lấy phần sinh hoạt, ghi là "cách nhìn hiện đại", không gắn mác khoa học |
| Remedy 3 mức ngân sách | "Việc nên làm" có 3 nhóm theo *thời điểm* | Chia theo **chi phí** (0 đồng / ít tiền / sửa chữa) dễ hành động hơn | Thêm nhãn chi phí cho việc nên làm (mục 5.3) |
| Apache AGE + Cypher theo ý định | Luật từ khoá + từ điển ý định chung (`y_dinh_chung.json`) + kho vectơ nội bộ | Supabase không có AGE; đồ thị nhỏ; Cypher cứng khó test | **Làm theo cách khác (2026-10-22, chủ dự án giao)**: đồ thị JSON trong git `phongthuy_do_thi.json` (11 ý định · 6 phòng · 20 dấu hiệu · 9 sao; cạnh QUAN_TAM / CAN_XEM / SAO_LIEN_QUAN / KICH_HOAT / O_PHONG / HOA_GIAI_BOI + sinh/khắc tính từ ngũ hành sao), duyệt bằng Python `kb/phongthuy_do_thi.py` (`theo_y_dinh`, `duong_di` BFS) — một câu Cypher của Drive = một lần `theo_y_dinh()`. Báo cáo Nhà của bạn nhận `y_dinh` → mục "Theo điều bạn đang băn khoăn" (phòng cần nhìn, dấu hiệu nên rà, hộp liên quan, năm sao kích hoạt tới phía phòng = TRIGGERS_TIMING); route `/v1/phongthuy/do-thi/{y_dinh}`. Không cạnh sao ↔ con số thần số. |
| pgvector 1536 (OpenAI/Gemini) | pgvector + `bam512_v1` nội bộ (không gửi câu hỏi ra ngoài), bật theo ngưỡng | Đã quyết (TS-V3/LG-ĐS) | Giữ |
| Golden samples 4 lớp từ lời LLM | Không lưu văn LLM làm chuẩn | Lưu lời LLM làm "mẫu chuẩn" rồi nạp lại = tự nhiễm (model collapse / poisoning) | **Không** |
| RLHF patch rules tự ghi vào prompt | Tầng HỌC: máy chỉ xếp lại/hạ hộp, người duyệt sửa KB qua PR | 7 luật mẫu trong Drive **đều là tri thức tốt** (ranh giới Lập xuân, hành lang chung cư, không đập kết cấu, đảo bếp ≠ bếp nấu, điều hoà thổi bàn thờ, nước ở Cửu Tử vận 9…) nhưng phải vào **KB / luật RULES qua PR**, không tự bật | Chuyển 7 luật thành mục KB `phongthuy_bo_cuc` + luật RULES (việc riêng, mục 6) |
| `user_consultation_sessions` lưu tên, ngày sinh, mặt bằng, toggles theo user | Không lưu luận giải/ngày sinh gắn user ngoài hồ sơ người dùng chủ động lưu | Trái quy tắc riêng tư; sơ đồ/ảnh nhà là dữ liệu nhạy cảm (NĐ 13/2023) | **Không**; hồ sơ nhà đã có cách làm riêng (KC-2: lưu máy, tài khoản chỉ khi bấm lưu) |
| Phiếu "sau 30 ngày" | Chưa | **Ý hay**: hỏi lại "đã áp dụng, thấy sao?" sau 30–90 ngày, chỉ mã + 3 mức | Thêm vào vòng kiểm chứng, opt-in qua nhắc việc đã có (mục 5.4) |

## 3. Năm ý tưởng đáng lấy

1. **Hình thế là nền, lý khí là nhịp** (Mode 1B) — và dấu hiệu lớn đã xác nhận là **trần mức**: chương không được lên
   "Thuận lợi" khi còn dấu hiệu *veto* chưa xử lý (xuyên đường sát, xà ngang đè đầu giường, WC trung cung, thương sát).
2. **Hình học mặt bằng thuần Python** cho PT-V2: tâm nhà (centroid đa giác), lưới 9 ô theo khung bao, tỉ lệ diện tích từng
   ô (khuyết góc < 40 %), kiểm tra WC chạm ô giữa, hai điểm cửa – ban công thẳng hàng (± 12°).
3. **Hướng nhà từ hai điểm trên bản đồ** (tâm nhà → điểm trước mặt nhà): công thức *bearing* trắc địa, sai số đủ dùng
   (≈ 1°), cho người ở căn hộ không đo được bằng la bàn ở cửa.
4. **Việc nên làm theo 3 mức chi phí**: 0 đồng (kê lại, đổi thói quen) · ít tiền (đèn, rèm, cây) · sửa chữa (vách, trần
   giật cấp). Không vật phẩm.
5. **Phiếu kết quả sau 30 ngày** cho vòng kiểm chứng: "Đã làm theo chưa? Thấy khác gì?" (3 mức, chỉ mã), gửi qua nhắc việc
   opt-in (KC-4), không nội dung tự do.

## 4. Sáu điểm trái nguyên tắc đã chốt → không làm

1. Phép tính trong PL/pgSQL (song song với engine) → **hai bộ tính sẽ lệch số** (CLAUDE.md tầng CALC).
2. Điểm số −100…+100 và nhãn `HUNG / DAI_CAT / CỰC HUNG` → trái "không doạ, không phán hung để giữ chân".
3. Tên bệnh, "trúng độc", "tai nạn lửa điện" trong `domain_impacts` → trái quy tắc sức khoẻ. **Đã làm lại (2026-10-22, chủ dự án yêu cầu giữ ý, đổi lời)**: 40 tổ hợp có `an_toan` — lời nhắc chăm nhà theo ngũ hành cặp sao ("cẩn thận hơn với lửa và điện: kiểm tra dây điện, bếp gas, có bình chữa cháy nhỏ"; nước rò rỉ, sàn trơn; vật sắc nhọn cất kỹ; ẩm mốc, thức ăn đậy kín; bậc thang, lối đi; gió lùa), mở đầu bằng "sách xưa gắn cặp sao này với … — lời nhắc chăm nhà, không phải dự báo"; test cấm tên bệnh / "tai nạn" / "cháy nổ".
4. Vật phẩm hoá giải (thạch anh, tỳ hưu, hồ lô, chuông gió) trong `remedy_traditional` → trái quy tắc KB.
5. Lưu `full_name`, `birth_date`, mặt bằng, toggles, lời luận theo `user_id` và dùng để huấn luyện → trái quy tắc riêng tư.
6. `rlhf_patch_rules` + `AUTO_PATCHED` + golden samples từ lời LLM → máy tự sửa luật/tự sinh chuẩn → trái tầng HỌC
   ("máy không bao giờ sinh câu luận mới, tự sửa KB, hay đưa chữ người dùng vào lời nhắc AI").

Ngoài ra bản Drive còn lỗi kỹ thuật: sao tháng lệch nhóm; `liqi_81_combinations` chỉ 7 dòng; `trigger_years` ghi tay
(2024, 2026…) thay vì tính từ lưu niên theo cung; vòng lặp PL/pgSQL sai cú pháp; thứ tự tạo bảng tham chiếu chéo
(`household_members_profile` → bảng tạo ở tệp sau); Lập xuân cố định đến 2028.

## 5. Đề xuất cập nhật kiến trúc 5 tầng (nếu anh duyệt, em ghi vào CLAUDE.md)

### 5.1 RULES — thêm hai nguyên tắc Phong thuỷ
- **"Hình thế là nền, lý khí là nhịp"**: mức của một chương / một phòng do hình thế (dấu hiệu đã xác nhận, du niên với
  người ở) quyết định; phi tinh, lưu niên, lưu nguyệt chỉ quyết định *thời điểm* (năm/tháng nên làm hay nên chờ).
- **Trần mức theo dấu hiệu lớn**: có dấu hiệu nhóm *veto* đã xác nhận (danh sách cố định trong KB `bo_tri`, cờ `veto: true`)
  → mức cao nhất của chương liên quan là "Cân bằng", hộp đầu tiên luôn là "Trước hết: …" (đã có mầm trong chương 2).
  Không điểm số.

### 5.2 CALC — hình học mặt bằng thuần Python (PT-V2, khi có sơ đồ)
`calc/mat_bang.py`: đa giác → tâm, khung bao, 9 ô, tỉ lệ diện tích, điểm thuộc ô, hai điểm thẳng hàng; `bearing(lat1, lon1,
lat2, lon2)` cho hướng từ bản đồ. Không PostGIS, không dependency (toán đa giác đơn giản, test golden tay). Ảnh vẫn chờ
50–100 bộ có phiếu đồng ý; sơ đồ người dùng **vẽ tay trên lưới** có thể làm trước ảnh.

### 5.3 KB — hai lối giải thích + 3 mức chi phí
- Mỗi dấu hiệu `bo_tri` thêm `giai_thich_hien_dai` (ánh sáng, gió, tiếng ồn, tầm nhìn — ghi "cách nhìn đời sống hiện đại",
  không gắn mác khoa học, không trích nghiên cứu không có nguồn) bên cạnh `giai_thich_truyen_thong` đã có; web có công tắc
  hiển thị (không đổi phép tính).
- `viec_nen_lam` gắn nhãn `chi_phi` ∈ {khong_ton, it_tien, sua_chua}.
- Bảy luật trong `rlhf_patch_rules.sql` → viết lại thành mục KB (ranh giới Lập xuân đã có trong engine; hành lang chung cư;
  không đập kết cấu/hộp kỹ thuật; đảo bếp không phải bếp nấu; điều hoà/quạt thổi thẳng bàn thờ; nước ở cung có Cửu Tử/Ngũ
  Hoàng vận 9; không "sửa nhà" cho chuyện thuộc "sửa thói quen").

### 5.4 HỌC — hai bổ sung (đã làm một phần trong PR này)
- **Đã làm:** hộp Phong thuỷ và Kinh Dịch có mã kiểm chứng `ds.phongthuy.*`, `ds.kinhdich.*`; cùng cơ chế hạ hộp theo tỉ lệ
  (≥ 100 phiếu, < 40 %), phiếu cá nhân xếp cuối; `/quan-tri/hoc` gom theo mảng. Quy tắc riêng tư: xem `docs/VONG-TU-CAI-THIEN.md`.
- **Chờ duyệt:** phiếu "sau 30 ngày" (bảng nhỏ trong migration 0019: khoá HMAC, mã hộp, `da_lam` 3 mức, `thay_khac` 3 mức,
  không chữ) + hàng đợi "đề xuất luật" cho người duyệt (máy chỉ gom: mã hộp, số phiếu, tỉ lệ; người viết luật và mở PR).

### Không đưa vào kiến trúc
PostGIS, Apache AGE, PL/pgSQL tính toán, embedding bên ngoài, điểm số, golden samples từ lời LLM, luật tự bật, lưu định
danh/mặt bằng theo user.

## 6. Bảng quyết định — **chủ dự án đã chốt 2026-10-22: làm Q1 → Q7 lần lượt, Q8 không làm**; trạng thái bên dưới

| # | Việc | Khâu tăng trưởng | Ước lượng | Phụ thuộc | Đề xuất của em |
|---|---|---|---|---|---|
| Q1 | Ghi hai nguyên tắc 5.1 vào CLAUDE.md + cờ `veto` trong KB `bo_tri`, luật trần mức + test | nền móng (lời luận đúng hơn) | 0,5 ngày | — | **Đã làm**: `bo_tri[*].veto` (đường đâm, xà ngang, WC giữa nhà, cửa thông ban công), `phongthuy_doi_song._ap_tran_muc` → chương 2 & 3 không vượt Cân bằng, `tran_muc` giải thích, hộp veto đứng đầu "Điều quan trọng nhất", `nguyen_tac` trong báo cáo; web badge "Xử lý trước" + dòng "trần Cân bằng — còn …" |
| Q2 | `calc/mat_bang.py` (hình học thuần) + sơ đồ vẽ tay trên lưới 3×3 ở Khảo sát nhà | THU HÚT (công cụ căn hộ) | 2 ngày | — | **Đã làm**: lưới **6×6** vẽ tay (hàng trên = mặt trước), ô đại diện phòng + ban công; engine tính tâm (trọng tâm diện tích), Cửu cung trên khung bao (khuyết góc < 40 %), phương theo góc từ tâm quay theo độ hướng, WC trong 1/3 giữa, cửa–tâm–ban công thẳng hàng ≤ 12° không ô trống chắn → tự suy `vi_tri` + dấu hiệu `wc_giua_nha` / `nha_chu_l` / `cua_thong_ban_cong` (BoCuc 0.2 `mat_bang`); không PostGIS |
| Q3 | Hướng nhà từ hai điểm bản đồ (nhập toạ độ / dán link bản đồ) | THU HÚT | 0,5 ngày | — | **Đã làm**: `mat_bang.bearing` (phương vị ban đầu, bắc thật) + `khoang_cach_m`, route `/v1/phongthuy/huong-ban-do` (trả như đo la bàn + khoảng cách + lưu ý), web ô "Lấy hướng từ bản đồ" trong Đo hướng (đọc "lat, lon" hoặc link `@lat,lon` / `q=` / `!3d!4d`); toạ độ không lưu |
| Q4 | Giải thích hai lối + công tắc "sách xưa / đời sống" cho dấu hiệu hình thế | QUAY LẠI (đọc dễ hiểu) | 1,5 ngày (viết KB 18 dấu hiệu × 2) | — | **Đã làm**: `bo_tri[*].giai_thich_hien_dai` cho 20 dấu hiệu (ánh sáng, gió, tiếng ồn, tầm nhìn — không mác khoa học), `goc_nhin` ở `/bo-cuc` và `/luan-giai` (câu đưa lên trước, câu kia ở `giai_thich`), công tắc dùng chung Khảo sát nhà + Nhà của bạn (nhớ máy `hbt.pt_goc_nhin`); hỏi đáp bố trí thêm "Nhìn theo đời sống" |
| Q5 | Việc nên làm theo 3 mức chi phí | QUAY LẠI | 0,5 ngày | — | **Đã làm**: `bo_tri[*].viec[{chi_phi ∈ khong_ton·it_tien·sua_chua, lam}]` (mỗi dấu hiệu luôn có việc 0 đồng), hộp dấu hiệu mang `viec`, chương Việc nên làm thêm `hanh_dong_chi_phi` (web nút "xếp theo: thời điểm / chi phí"), không vật phẩm |
| Q6 | Bảy luật Drive → KB/luật RULES qua PR | nền móng | 1 ngày | — | **Đã làm**: KB `quy_tac_thuc_hanh` (7 luật, có `ap_dung`); RULES: căn hộ + đường đâm/cửa đối/cửa thông ban công → "xử lý bên trong cửa"; căn hộ + WC giữa nhà/xà ngang → bỏ việc đụng kết cấu, chỉ trần thạch cao / đổi chiều cửa; câu hỏi bếp nói rõ "bếp nấu, không tính bàn đảo"; dấu hiệu mới `ban_tho_gio_thoi`; vận 9 `to_hop_cung.khong_dat_nuoc` (sơn tinh 9 / có 5, 2 → không bể cá, thác nước) vào đoạn báo cáo; Lập xuân đã là mặc định engine; "sửa nhà / sửa thói quen" = đoạn chương 5 (không ghép số thần số với sao) |
| Q7 | Phiếu sau 30 ngày + hàng đợi đề xuất luật | nền móng tầng HỌC | 1,5 ngày + anh chạy migration | 0017 | **Đã làm (migration 0022 chờ anh chạy)**: `kiem_chung_sau` (mã + phái + `da_lam` 3 mức + `thay_khac` 3 mức + số ngày; khoá HMAC, 1 phiếu/người/mã, 24 tháng) — máy người dùng nhớ hộp Nên để ý / Lời khuyên đã bấm "Đúng với mình" (localStorage), ≥ 30 ngày Hôm nay hỏi lại; `de_xuat_luat` máy chỉ GOM (≥ 100 phiếu & < 40 % đúng, hoặc ≥ 30 phiếu sau & ≥ 60 % "như cũ") cho người duyệt ở `/quan-tri/hoc`, cron ngày gọi `gom_de_xuat_luat` + `don_kiem_chung_sau`; không tự bật gì |
| Q8 | PostGIS / AGE / PL/pgSQL / embedding ngoài / điểm số | — | — | — | **Không làm** (chủ dự án chốt); phần "đồ thị theo ý định" của AGE làm bằng JSON + Python (dòng Apache AGE ở mục 2) |

Mỗi việc "Làm" sẽ có dòng quyết định riêng trong CLAUDE.md khi bắt đầu; phép tính Huyền Không, Bát trạch hiện tại không
đổi → không tăng `ENGINE_VERSION` cho Q1–Q7.

## 7. Ý tưởng mới ghi nhận khi rà codebase (2026-10-22, chủ dự án dặn "có ý tưởng gì mới thì bổ sung") — chờ anh tích

| # | Ý tưởng | Khâu | Vì sao đáng làm | Cần gì |
|---|---|---|---|---|
| Y1 | **"Chụp một góc, hỏi một câu"** (PT-V2 nhẹ): người dùng chụp ảnh phòng → chỉ hỏi 3–5 câu có/không do đồ thị chọn theo ý định (vd sức khoẻ: xà ngang? gương đối giường? WC giữa nhà?) — ảnh **không gửi lên máy chủ**, chỉ để người dùng nhìn mà trả lời; không cần model thị giác | THU HÚT | Dấu hiệu khai tay hiện ít người điền hết 20 ô; đồ thị đã có cạnh ý định → dấu hiệu nên rút gọn form được ngay | 1 ngày web, không engine |
| Y2 | **Mặt bằng từ thẻ chia sẻ**: ảnh "Nhà của bạn" (OG) vẽ lưới 3×3 phủ màu theo mức + chấm veto, QR về `/phong-thuy?tu=nha.…`; chỉ dữ liệu công khai (8 hướng, mức), không địa chỉ | MỜI | Thẻ chia sẻ các mảng khác đã có concept riêng (TCS-1); Phong thuỷ chưa có thẻ | 0,5 ngày (`lib/og-chung.tsx`) |
| Y3 | **Nhắc theo mùa của nhà**: cron sáng (KC-4 GĐ2) thêm mốc "tháng tiết mới — phía cửa tháng này nên giữ yên / thuận sửa" cho người đã bật "mốc lịch", lấy từ `thang_nay` (chỉ cần hướng trong `ho_so_nha`) | QUAY LẠI | Hồ sơ nhà + push đã có, chỉ ghép; đúng nhịp 12 lần/năm, không doạ | 0,5 ngày, không migration (0018 + 0020 đủ) |
| Y4 | **Hộp "Việc 0 đồng tuần này"** ở Hôm nay: mỗi tuần một việc 0 đồng từ dấu hiệu đã khai (xoay vòng, có nút "đã làm" → phiếu sau 30 ngày tự có nhãn) | QUAY LẠI | Nối thẳng Q5 với Q7: việc nhỏ dễ làm → phiếu "đã làm" có ý nghĩa hơn | 0,5 ngày web |
| Y5 | **Trang kiến thức "20 dấu hiệu nhà ở"** `/phong-thuy/dau-hieu/{mã}` dựng từ KB (sách xưa + đời sống + việc theo chi phí + luật căn hộ), ảnh OG la bàn; nối từ hỏi đáp và báo cáo | THU HÚT (SEO cụm "gương đối giường", "nhà vệ sinh giữa nhà", "xà ngang đè giường" — truy vấn lớn) | KB đã đủ hai lối + việc; chỉ dựng trang như SEO-F/H | 1 ngày (engine route + web + sitemap + mẫu cụm CMS) |
| Y6 | **Hỏi đáp Phong thuỷ đọc hồ sơ nhà**: câu "bếp nhà tôi có sao không?" → engine nhận `nha` (hướng, bố cục trên máy) như `sinh` → trả lời theo đúng nhà thay vì chung chung | QUAY LẠI | Hồ sơ nhà đã lưu máy; hỏi đáp hiện chỉ biết mệnh | 1 ngày engine + web |
| Y7 | **So "trước – sau" khi sửa**: người dùng đánh dấu "đã xử lý" một dấu hiệu → bài đọc tính lại không trần mức, hiện hai mức cạnh nhau; nút "đã xử lý" cũng là phiếu sau 30 ngày | QUAY LẠI | Cho thấy việc 0 đồng đổi được gì ngay — động lực làm thật | 0,5 ngày (web + `dau_hieu[*].da_xu_ly` bỏ qua trần) |
| Y8 | **Rà lại 45 cặp cũ `cap_sao`**: KB còn giữ 45 cặp không thứ tự làm dự phòng; sau khi `to_hop_81` ổn định một tháng (phiếu kiểm chứng), bỏ dự phòng để KB một nguồn | nền móng | Hai bảng nghĩa song song dễ lệch khi sửa | 0,2 ngày + phiếu |

Em đề xuất làm trước: **Y5** (SEO, KB đã sẵn), **Y3** (ghép hai thứ đã có), ~~**Y7**~~ (đã làm ở UI-PT 2026-10-22 — nút "Tôi đã xử lý" + so trước–sau, `docs/RA-SOAT-UI-PHONG-THUY.md`). Y1, Y2 ghi lại thành P6, P7 và **đã làm ở UI-PT2** (2026-10-22) cùng P5 so hai căn.
