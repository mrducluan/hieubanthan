# Review bản "Neuro-Symbolic 3-Layer Engine V3" (Google Drive, 2026-10-19)

Chủ dự án gửi 10 tệp trong thư mục Drive `HieuBan_NeuroSymbolic_Engine_V3`: `01`–`07`, `09` (SQL), `08_numerology_engine.service.ts`
và `CLAUDE_CODE_UPGRADE_SPEC.md`, kèm yêu cầu chạy 8 tệp SQL vào PostgreSQL rồi chép tệp service vào backend.
Tài liệu này ghi kết quả review: so V3 với engine thần số đang chạy, liệt kê lỗi, và nói phần nào đã đưa vào sản phẩm (TS-NOIDAU).

## 1. Kết luận

**Không chạy 8 tệp SQL và không chép tệp service.** Lý do, xếp theo mức nặng:

1. **Đi ngược kiến trúc bất biến trong CLAUDE.md.** V3 đặt phép tính (Pitago, Chaldea, Kabbalah, biểu đồ, nhịp) trong
   PL/pgSQL. CLAUDE.md quy định tầng CALC là Python thuần, tất định, có golden test, và "engine không biết Supabase tồn
   tại". Hai bộ máy tính song song (Python + SQL) sẽ lệch nhau (xem mục 3) và người dùng thấy hai con số khác nhau.
2. **Vi phạm quyền riêng tư đã chốt.** `user_feedback_logs` lưu ngày sinh + họ tên đã chuẩn hoá + toàn bộ hồ sơ số;
   `user_episodic_memories` lưu "ký ức" theo `user_id`. CLAUDE.md: không lưu luận giải gắn user_id; nhật ký hỏi
   không có user_id / tên / ngày sinh (quyết định 2026-09-30; NĐ 13/2023, Luật BVDLCN 91/2025).
3. **Kabbalah đã bị loại có lý do** (TS-PHAI 2026-10-13: Kabbalah chỉ dựa tên Hebrew). Bảng của V3 (A–I = 1–9,
   J–R = 10–90, S–Z = 100–800) là gematria tự chế trên chữ Latin, Sephirah = `(tổng + ngày + tháng + năm) mod 10` —
   không có nguồn, không đối chiếu được.
4. **Phụ thuộc và hạ tầng mới chưa duyệt:** extension `vector` (CMS-4 đã chốt không pgvector), gói npm `pg`, kết nối
   Postgres trực tiếp từ backend (web hiện chỉ đi qua Supabase + engine).
5. **Bộ tệp chưa chạy được** (mục 2): `03` hỏng khoá ngoại ngay khi chạy, `08` gọi hàm không tồn tại.

## 2. Lỗi trong từng tệp

| Tệp | Lỗi |
|---|---|
| 01 | Đường đời tính kiểu "rút từng phần, bỏ số cái rồi cộng" — sản phẩm dùng "cộng mọi chữ số" (đã khoá golden) → khác số với nhiều ngày sinh; vd 24/10/1988: sản phẩm ra **33**, V3 ra 6 + 1 + 8 = 15 → **6**. Đỉnh cao giữ số cái (11/22/33) — sản phẩm rút về 1–9. Quy tắc Y "nguyên âm khi chữ trước không phải nguyên âm" khác quy tắc Y theo âm tiết đã khoá (spec 2026-08-15). Chaldea không tách số kép 10–52 như Cheiro (lấy tổng thô, vd 60 vẫn để 60). |
| 02 | Chỉ có 2 nút (số 1, 2 Pitago); không có `source_id`/`school_id` bắt buộc cho bảng nghĩa. |
| 03 | `INSERT graph_edges` trỏ `PYT_KARMIC_19_1`, `CHA_COMP_19_1` — hai nút không có trong `02` → **lỗi khoá ngoại, tệp dừng**. `fn_resolve_3school_matrix`: `SELECT array_append(...) INTO` trên truy vấn không có dòng (chưa có nút SEPHIRAH) gán mảng thành NULL → mất cả 5 nút đã kích hoạt → luôn trả rỗng. |
| 04 | `search_tsv` không bao giờ được điền (không có trigger), `embedding` NULL → điểm hybrid luôn 0 → "khớp ý định" trả câu bất kỳ. Chỉ 1 ý định. |
| 05 | Phụ thuộc 03/04 nên gói context không có nút/ý định thật. |
| 06 | Lưu tên + ngày sinh (mục 1.2). Đạt 5 lần thì báo `AUTO_PROMOTED…` nhưng không tạo luật nào; ON CONFLICT không nối ghi chú mới. Tự "thăng" luật từ phản hồi người dùng mà không người duyệt — trái quy trình KB (người duyệt). |
| 07 | `strength_arrows`, `empty_arrows` luôn là mảng rỗng (chưa viết). `interpretation_cache` lưu văn trả lời theo hồ sơ 90 ngày. |
| 08 | Gọi `fn_assemble_llm_context_payload_v2` — không có trong bộ tệp (05 chỉ có bản không hậu tố; spec nói `…_v3_ultimate`, cũng không có). Năm 2026 viết cứng; tham số `callLlmFn` không dùng. |
| 09 | `user_episodic_memories` theo user_id (mục 1.2). "Radar tháng" ra lệnh và dự báo ("chốt sale lớn", "tránh đầu tư lướt sóng", "rà soát sức khoẻ") — trái quy tắc không dự báo sự kiện / không phán. |

## 3. Đối chiếu với engine đang chạy

| V3 | Engine hiện tại |
|---|---|
| `fn_calc_pythagoras` | `calc/thanso.py` — đủ chỉ số + vết tính + độ nhạy quy ước; golden + test. |
| `fn_calc_chaldean` | `calc/thanso_chaldean.py` (TS-PHAI) — số kép 10–52 đúng Cheiro, tên gọi, golden tính tay. |
| `fn_calc_kabbalah` | Không làm (TS-PHAI). |
| Biểu đồ + mũi tên (07) | `calc/thanso_mo_rong.py` — có đủ 8 mũi tên đủ/trống, số lặp, số vắng; bài học nghiệp. |
| Radar tháng (09) | `luangiai/nhip_ca_nhan.py`, `hom_nay.py` — tháng/ngày cá nhân + KB, lời trung tính. |
| Phản hồi / self-improvement (06) | Góp ý 1 chạm (không lưu danh tính) + skill `thanso-tu-cai-thien` (người duyệt, có số trước/sau). |
| Ma trận câu hỏi + chỉ số cần (04) | **Chưa có dạng bảng nỗi đau** → làm ở TS-NOIDAU. |
| Đồ thị liên phái (03) | Có đối chiếu số từng vị trí; **chưa có "giao điểm" 13/14/16/19** → làm ở TS-NOIDAU. |
| Hybrid search (04) | Phân loại từ khoá tất định (`luangiai/hoi.py`, golden ~2.000 câu) — thêm `lien_quan()` ở TS-NOIDAU. |

## 4. Phần giá trị đã đưa vào sản phẩm — TS-NOIDAU

Giữ ý tưởng, viết lại theo kiến trúc 4 tầng, không migration, không dependency, không đổi phép tính (không tăng
`ENGINE_VERSION`):

- **KB `thanso_noi_dau.json`** — 5 trụ đời (map từ `life_pillar_type`), 25 câu nỗi đau, mỗi câu gắn các chỉ số trả
  lời (`required_indicators`). Test khoá mọi câu chuẩn định tuyến đúng lĩnh vực qua bộ phân loại hỏi đáp thật.
- **RULES `luangiai/noi_dau.py`** + route `/v1/thanso/noi-dau` — mỗi câu kèm con số của chính người dùng (lấy từ
  CALC, cùng bộ số hỏi đáp dùng). `lien_quan()` thay hybrid search: so khớp từ bỏ dấu, tất định, không embedding.
- **Câu bấm từ bảng trả lời đúng thẻ** (`noi_dau.bo_sung_goi`): bằng chứng của đúng những chỉ số thẻ hiện được đưa
  lên đầu gói — trước đó các câu cùng lĩnh vực nhận cùng một lời đáp. Thêm chỉ số "tháng mở đầu sắp tới" (tháng cá
  nhân 1 trong 12 tháng tới) cho câu chọn thời điểm bắt đầu.
- **Hỏi đáp** trả thêm `cau_lien_quan` (≤ 3 câu "hỏi tiếp"); câu khủng hoảng / ngoài phạm vi không gợi gì.
- **Giao điểm hai phái** (`thanso_doi_chieu.json`, `giao_diem` trong bài Chaldea) — cạnh có thật duy nhất của đồ thị
  V3 (19 Pitago ↔ 19 Chaldea), mở cho 13/14/16/19, lời trung tính (bỏ "hậu vận rực rỡ" của V3).
- **Sửa lỗi phân loại**: "ưu tiên" bỏ dấu thành "uu tien" khớp từ khoá tiền → câu "tháng này nên ưu tiên gì" lạc sang
  tài chính.
- **Web** `/than-so`: khối "Bạn đang vướng ở đâu?" (cả hai phái), chip "Hỏi tiếp" dưới câu trả lời, khối giao điểm ở
  phái Chaldea. Đo `pain_point_clicked {tru, ma_cau, nguon: bang|hoi_tiep}` — chỉ mã.

**Khâu tăng trưởng:** QUAY LẠI (mỗi lần mở có câu gắn đúng nỗi đau + chuỗi hỏi tiếp) và gián tiếp NẠP SAO (câu hỏi
vượt hạn mức miễn phí SAO-2). Chỉ số: tỉ lệ `pain_point_clicked` / lượt xem `/than-so`, số câu hỏi mỗi phiên
(`advisor_question_completed`), tỉ lệ `nguon=hoi_tiep`.

## 5. QC độc lập (2 agent) — đã sửa

- Giao điểm: khi hai phái ra HAI số khác nhau ở vị trí tên (≈ 6,7% trường hợp, vd "Đỗ Bảo An" 13/6/1960: Pitago 14,
  Chaldea 16) lời Pitago từng lấy theo số Chaldea → nay mỗi phái lời của đúng số mình; câu nối chỉ khi cùng số.
- Bộ lọc công khai (BM-1) lọt nhãn "AI nháp" ở nguồn Chaldea (có từ TS-PHAI) và nguồn mới → thêm quy tắc chung.
- Bấm câu khi khung chat đang trả lời bị mất → `KhungChat` giữ câu, hỏi ngay khi xong.
- Phái Chaldea: bảng ghi rõ con số trên thẻ theo Pitago.
- `lien_quan`: câu vô nghĩa và câu về người khác / con không còn được gợi câu của chính mình.

Còn để ngỏ (đề xuất, chưa làm): nhãn "Bóng tối" ở đỉnh cao → "Điểm cần để ý"; câu năm cá nhân 8 "nếu đã gieo đúng,
đây là năm thu hoạch" nghe như dự báo → viết lại KB theo skill `thanso-kb`.

## 6. TS-V3 (2026-10-20) — chuyển đổi đầy đủ sau khi chủ dự án duyệt

Chủ dự án duyệt: điều chỉnh kiến trúc, quy tắc riêng tư cho vòng tự cải thiện, làm Kabbalah, pgvector + `pg`. Nguyên tắc
giữ: **một bộ tính** (Python, golden) — SQL chỉ còn là tầng HỌC. Bảng dưới là số phận từng tệp:

| Tệp V3 | Giờ ở đâu | Đã sửa gì so với bản SQL |
|---|---|---|
| 01 `fn_calc_pythagoras` | `calc/thanso.py` | Đường đời có **2 cách, người dùng chọn** (`tong_het` mặc định / `tung_phan` = cách V3); Y theo âm tiết đã khoá; đỉnh cao rút về 1–9 |
| 01 `fn_calc_chaldean` | `calc/thanso_chaldean.py` | Số kép 10–52 đúng Cheiro (V3 để tổng thô) |
| 01 `fn_calc_kabbalah` | `calc/thanso_kabbalah.py` | Bảng chuyển chữ Golden Dawn + giá trị Hebrew chuẩn (V3 tự chế A–I/J–R/S–Z); Sephirah = rút về ≤ 10 (V3: mod 10 trộn tên + ngày); thêm độ nhạy bảng |
| 01 schema `knowledge_nodes` | KB JSON có `source_id` + `school_id` | V3 thiếu nguồn bắt buộc |
| 02 seed (2 nút) | `thanso_meanings` + `thanso_chaldean` + `thanso_kabbalah` | Đủ mọi số của 3 phái |
| 03 `graph_edges` + `fn_resolve_3school_matrix` | `luangiai/tong_hop.tuong_tac` + KB `thanso_do_thi.json` | Không còn lỗi khoá ngoại / mảng NULL; cạnh sinh từ số thật của người dùng |
| 04 `question_intents` + hybrid search | KB `thanso_noi_dau.json` + `hoi.phan_loai` + `noi_dau.lien_quan` | Tất định, test định tuyến 25/25; không cần embedding |
| 05 `fn_assemble_llm_context_payload` | `tong_hop.ngu_canh` · `/v1/thanso/ngu-canh` | Quy tắc diễn đạt ở KB; câu khủng hoảng không dựng ngữ cảnh |
| 06 vòng tự cải thiện | migration **0015** `thanso_phan_hoi` + `thanso_cum_bat_thuong` + `/quan-tri/hoc` | Chỉ chữ ký số (không tên/ngày sinh); ≥ 5 lần → chờ duyệt, người duyệt sửa KB (V3 báo "AUTO_PROMOTED" mà không làm gì) |
| 07 biểu đồ + mũi tên | `calc/thanso_mo_rong.py` | Đủ 8 mũi tên (V3 trả mảng rỗng) |
| 07 `interpretation_cache` | không làm | Engine tất định; LLM có hạn mức RL-1 |
| 08 service TS | `web/lib/services/numerology-engine.service.ts` | Gọi engine, không `pg`, không hàm `_v2` không tồn tại, không năm viết cứng |
| 09 `user_episodic_memories` | migration **0015** `ky_uc_nguoi_dung` | Chỉ điều người dùng bấm ghi nhớ; RLS chủ sở hữu; xoá được; 180 ngày |
| 09 radar tháng | `nhip_ca_nhan` / `hom_nay` (KB tháng cá nhân) | Bỏ lời ra lệnh / dự báo ("chốt sale", "sức khoẻ") |
| `vector` (pgvector) | chưa bật | Chưa có nguồn embedding; bật khi ≥ 500 câu không nhận ra/tháng |

Cách đọc hai cách cộng Đường đời: **cộng hết** phổ biến ở sách/trang thần số Việt Nam; **rút gọn từng phần** hay gặp
ở sách phương Tây (Hans Decoz…). Không có cách "đúng" duy nhất — sản phẩm để mặc định cộng hết (kết quả cũ của người
dùng giữ nguyên), có nút đổi, và luôn báo khi hai cách ra số khác nhau.

## 7. QC độc lập vòng 2 (TS-V3) — đã sửa

| Phát hiện | Sửa |
|---|---|
| "Cộng hưởng" giả: Đường đời ba phái là CÙNG một phép cộng ngày sinh → luôn trùng (300/300 ngày thử) | Gộp thành một nguồn "chung"; bỏ nhóm đường đời khỏi đồ thị; số nổi bật phải có nguồn độc lập ngoài nhóm này; trang ghi rõ |
| Quy con đường 1–22 và Sephirah 10 về 1–9 (Malkuth thành "1") | Con đường không quy về số; Sephirah 10 không so; trang Qabalah ghi "không có số tương ứng" |
| Đánh số con đường lệch Golden Dawn (chữ thứ 14 = Nun nhưng "Path 14" là Daleth) | Trả cả "chữ thứ n" và "con đường số n + 10 trên Cây" |
| Nguồn ghi quá: bảng không hoàn toàn từ *777* | Ghi "dựa trên 777, bổ sung C F J W X, KH, H câm trong NH/GH/NGH"; rút gọn về con đường là quy ước hiện đại; thêm lưu ý chữ Hebrew là chữ thiêng; lưu ý "Thị" (Tav 400) |
| H không nhất quán (NH, GH tính He) | NH = Nun, GH = Gimel (H câm) — golden "Phạm Khánh" đổi 185 → 180 (tính tay lại) |
| Hỏi đáp Qabalah trả cùng một đoạn cho nghề/tình/tiền | Chỉ câu tự mô tả hoặc hỏi thẳng về Qabalah mới đổi; còn lại Pythagoras + ghi chú; câu chuẩn bảng nỗi đau vẫn đúng chỉ số thẻ |
| Câu tự soi lặp, thiếu dấu chấm | Bỏ trùng trong template, chuẩn dấu câu |
| Chữ ký số mang ngày sinh (Chaldea ngày sinh, tổng thô) + validator nhận khoá bất kỳ, `{}` và NULL | Chỉ số RÚT GỌN của phái được góp ý; SQL nhận đúng danh sách khoá + khoảng giá trị; rỗng/NULL bị từ chối |
| Cam kết 12 tháng / 180 ngày chưa có cơ chế xoá; ký ức tự đặt hạn 2100 được | `don_du_lieu_hoc()` + cron ngày `/api/cron/don-du-lieu-hoc`; trigger ép mốc thời gian + chủ sở hữu; không trùng câu |
| `locGhiChu` lọt điện thoại có dấu, Zalo/FB, ngày viết bằng chữ, email có dấu cách; SQL từ chối thì mất cả góp ý | Lọc thêm các mẫu; SQL từ chối ghi chú → vẫn lưu góp ý không kèm ghi chú; dặn không ghi tên/sức khoẻ/tôn giáo |
| `/api/thanso/ngu-canh` công khai lách hạn mức hỏi đáp SAO-2 | Gỡ route; service chỉ dùng phía máy chủ |
| `/api/thanso/phan-hoi` không giới hạn (5 lượt đẩy cụm sang chờ duyệt) | Giới hạn 12 góp ý / 10 phút mỗi người gọi |
| Còn chỗ bỏ qua cách cộng Đường đời (hợp đôi, `/van`, `/chu-ky`, đối chiếu ở Chaldea, người thứ hai) | Đã luồn tham số |
| Mã nội bộ "v3", "RESONATES_WITH" trong JSON công khai (BM-1) | Bỏ |
